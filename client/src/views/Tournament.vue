<template lang="pug">
main
  input#modalChat.modal(
    type="checkbox"
    @click="toggleChat()"
  )
  div#chatWrap(
    role="dialog"
    data-checkbox="modalChat"
  )
    .card
      label.modal-close(for="modalChat")
      Chat(
        ref="chatcomp"
        :pastChats="chats"
        @mychat="processChat"
        @chatcleared="clearChat"
      )
  input#modalJoin.modal(type="checkbox")
  div#joinWrap(
    role="dialog"
    data-checkbox="modalJoin"
  )
    .card
      label.modal-close(for="modalJoin")
      fieldset
        label(for="joinName") {{ st.tr["User name"] }}
        input#joinName(type="text" v-model="newName")
      fieldset
        label(for="joinElo") {{ st.tr["Known rating:"] }}
        input#joinElo(type="number" v-model="newElo")
        label(for="joinEstimElo") {{ st.tr["Unknown rating:"] }}
        .button-group#joinEstimElo
          button(@click="setElo(1200)") Beginner
          button(@click="setElo(1500)") Intermediate
          button(@click="setElo(1800)") Good player
          button(@click="setElo(2100)") Expert
          button(@click="setElo(2400)") Master
      fieldset
        button(@click="joinTournament()") Send
  input#modalGamelink.modal(type="checkbox")
  div#gamelinkWrap(
    role="dialog"
    data-checkbox="modalGamelink"
  )
    .card
      label.modal-close(for="modalGamelink")
      fieldset
        label(for="gamelink") {{ st.tr["Game link"] }}
        input#gamelink(type="text" v-model="curGame.gameLink")
        button(@click="setGamelink()") Send
  input#modalScore.modal(type="checkbox")
  div#scoreWrap(
    role="dialog"
    data-checkbox="modalScore"
  )
    .card
      label.modal-close(for="modalScore")
      fieldset
        label(for="score") {{ st.tr["Score"] }}
        .button-group#score(
          v-if="!tournament.bothcol"
          @click="setScore($event)"
        )
          button.white-win 1-0
          button.draw 1/2
          button.black-win 0-1
        .button-group#score(
          v-else
          @click="setScore($event)"
        )
          button.white-win +2
          button.white-win +1
          button.draw =
          button.black-win -1
          button.black-win -2
      fieldset
        label(for="scoreF") {{ st.tr["Score (forfeit)"] }}
        .button-group#scoreF(@click="setScore($event)")
          button.white-win 1-F
          button.draw F-F
          button.black-win F-1
  .row
    #aboveTour.col-sm-12
      span {{ tournament.title }} 
      span {{ tournament.cadence }} 
      span {{ tournament.nbRounds }}
      button#chatBtn(
        onClick="window.doClick('modalChat')"
        aria-label="Chat"
      )
        span Chat
        img(src="../assets/chat.svg")
  .row
    .col-sm-12.col-md-10.col-md-offset-1.col-lg-8.col-lg-offset-2
      .button-group
        button.tabbtn#players(@click="setDisplay('players',$event)")
          | {{ st.tr["Players"] }}
        button.tabbtn#tournament(@click="setDisplay('tournament',$event)")
          | {{ st.tr["Tournament"] }}
      div(v-show="display=='players'")
        button(
          v-if="showConfirmButton"
          @click="confirmParticipation()"
        )
          | {{ Confirm }}
        table
          thead
            tr
              th Name
              th User name
              th Elo
              th Club
          tbody
            tr(
              v-for="p in sortedPlayers()"
              @click="tryTogglePlayer(p)"
            )
              td {{ p.firstName + " " + p.lastName }}
              td {{ p.name }}
              td {{ p.elo }}
              td {{ p.club }}
        button(onClick="window.doClick('modalJoin')") Join
      div(v-show="display=='tournament'")
        div(v-if="!!tournament.completed")
          table(v-if="!!finalGrid")
            thead
              tr
                th Pl
                th Name
                th User name
                th Elo
                th Club
                th(v-for="(r,i) in rounds") {{ "R" + i }}
                th Score
                th Bc
                th Perf
            tbody
              tr(v-for="(p,i) in sortedPlayers()")
                td {{ i }}
                td {{ p.lastName + " " + p.firstName }}
                td {{ p.name }}
                td {{ p.elo }}
                td {{ p.club }}
                td(v-for="(r,j) in rounds")
                  a(:href="finalGrid.rounds[i][j].url || '#'")
                    | {{ finalGrid.rounds[i][j].value }}
                td {{ finalGrid.score[i] }}
                td {{ finalGrid.tieBreak[i] }}
                td {{ finalGrid.performance[i] }}
        div(v-else-if="Date.now() > tournament.dtstart")
          table(v-if="rounds.length >= 1")
            thead
              tr
                th Player1
                th Player2
                th Result
                th View
            tbody
              tr(
                v-for="g in rounds[rounds.length-1]"
                :class="{ 'my-pairing': isMyGame(g) }"
              )
                td {{ nameAndScore(g.player1) }}
                td {{ nameAndScore(g.player2) }}
                td(@click="tryShowModalScore(g)") {{ g.score }}
                td(@click="setLinkOrShowGame(g)") {{ viewGameBtn(g) }}
              tr(v-if="!!exempts[rounds.length-1]")
                td {{ exempts[rounds.length-1] }}
                td -
                td E
                td &nbsp;
          button(
            v-show="showPairingBtn()"
            @click="computePairings()"
          )
            | Next round
        div(v-else)
          p
            span Time before start:
            span {{ remainingTime }}
</template>

<script>
import Chat from "@/components/Chat.vue";
import { notify } from "@/utils/notifications";
import { ajax } from "@/utils/ajax";
import { getRandString } from "@/utils/alea";
import { ppt } from "@/utils/datetime";
import { ArrayFun } from "@/utils/array";
import { checkPlayer } from "@/data/playerCheck";
import { store } from "@/store";
import { processModalClick } from "@/utils/modalClick.js";
import params from "@/parameters";
// Time before a tournament to confirm registration: 45 minutes
const CONFIRM_WINDOW = 45*60*1000;
export default {
  name: "my-tournament",
  components: { Chat },
  data: function() {
    return {
      st: store.state,
      tournament: {},
      players: {},
      chats: [],
      display: "players",
      rounds: [],
      scores: {}, //current results
      exempts: [],
      finalGrid: null,
      newName: "",
      newElo: 0,
      countdown: 0,
      timer: null,
      socketCloseListener: null,
      curGame: {}, //for tryShowModalScore(g) "callback"
      conn: null
    };
  },
  watch: {
    $route: function(to, from) {
      if (to.path.length < 6 || to.path.substr(0, 12) != "/tournament/")
        // Page change
        this.cleanBeforeDestroy();
      else if (from.params["id"] != to.params["id"]) {
        // Change everything:
        this.cleanBeforeDestroy();
        this.atCreation();
      }
      else if (!!to.query["disp"]) this.setDisplay(to.query["disp"]);
    }
  },
  created: function() {
    this.atCreation();
  },
  mounted: function() {
    ["gamelinkWrap","scoreWrap","joinWrap"].forEach(elt => {
      document.getElementById(elt)
        .addEventListener("click", processModalClick);
    });
    document.getElementById("chatWrap").addEventListener("click", (e) => {
      processModalClick(e, () => {
        this.toggleChat("close")
      });
    });
  },
  computed: {
    remainingTime: function() {
      return ppt(this.countdown);
    },
    showConfirmButton: function() {
      const now = Date.now();
      return (
        now < this.tournament.dtstart &&
        now >= this.tournament.dtstart - CONFIRM_WINDOW &&
        Object.keys(this.players).includes(this.st.user.id) &&
        !!this.players[this.st.user.id].quit
      );
    }
  },
  beforeDestroy: function() {
    this.cleanBeforeDestroy();
  },
  methods: {
    cleanBeforeDestroy: function() {
      if (!!this.timer) clearInterval(this.timer);
      if (!!this.conn) {
        clearInterval(this.socketCloseListener);
        this.conn.removeEventListener("message", this.socketMessageListener);
        this.send("disconnect");
        this.conn = null;
      }
    },
    atCreation: function() {
      // (Re)Set variables
      let chatComp = this.$refs["chatcomp"];
      if (!!chatComp) chatComp.chats = [];
      this.chats = [];
      const setSocketVars = () => {
        const now = Date.now();
        if (now > this.tournament.dtstart) {
          // Tournament running or completed
          this.display = "tournament";
          if (this.tournament.completed) this.computeFinalGrid();
          else {
            // Initialize connection
            const sid = getRandString();
            this.connexionString = params.socketUrl + "/?sid=" + sid;
            this.conn = new WebSocket(this.connexionString);
            this.conn.addEventListener("message", this.socketMessageListener);
            this.socketCloseListener = setInterval(
              () => {
                if (this.conn.readyState == 3) {
                  this.conn.removeEventListener(
                    "message",
                    this.socketMessageListener);
                  this.conn = new WebSocket(this.connexionString);
                  this.conn.addEventListener(
                    "message",
                    this.socketMessageListener);
                }
              },
              1000
            );
          }
        }
        else {
          this.countdown = this.tournament.dtstart - now;
          this.timer = setInterval(
            () => {
              if (--this.countdown <= 0) clearInterval(this.timer);
            },
            1000
          );
        }
      };
      ajax(
        "/tournaments",
        "GET",
        {
          data: { id: this.$route.params["id"] },
          success: (res) => {
            this.tournament = res.tournament;
            this.tournament.quit = JSON.parse(res.tournament.quit);
            this.tournament.ban = JSON.parse(res.tournament.ban);
            setSocketVars();
            ajax(
              "/players",
              "GET",
              {
                data: { tid: this.$route.params["id"] },
                success: (res) => {
                  ajax(
                    "/users",
                    "GET",
                    {
                      data: { ids: res.players.map(p => p.uid) },
                      success: (res2) => {
                        // User IDs may not appear in the same order
                        let users = {};
                        res2.users.forEach(u => {
                          users[u.id] = {
                            firstName: u.firstName,
                            lastName: u.lastName,
                            club: u.club
                          };
                        });
                        for (q of this.tournament.quit) users[q].quit = true;
                        for (b of this.tournament.ban) users[b].ban = true;
                        res.players.forEach(p => {
                          this.players[p.uid] =
                            Object.assign(
                              { name: p.name, elo: p.elo },
                              users[p.uid]
                            );
                          if (p.uid == this.st.user.id)
                            this.st.user.name = p.name;
                        });
                      }
                    }
                  );
                }
              }
            );
            if (res.tournament.dtstart > Date.now()) return;
            // Tournament has started (may be finished):
            ajax(
              "/chats",
              "GET",
              {
                data: { tid: this.$route.params["id"] },
                success: (res) => {
                  this.chats = res.chats;
                }
              }
            );
            ajax(
              "/games",
              "GET",
              {
                data: { tid: this.$route.params["id"] },
                success: (res) => {
                  if (res.games.length == 0) return;
                  // Reorganize games data into rounds array.
                  // Final round may have incomplete result.
                  res.games.forEach(g => {
                    if (this.rounds.length <= g.round) {
                      Array.prototoype.push.apply(
                        this.rounds,
                        [...Array(g.round - this.rounds.length + 1)]
                      )
                    }
                    this.rounds[g.round].push({
                      player1: g.player1,
                      player2: g.player2,
                      score: g.score,
                      gameLink: g.gameLink,
                    });
                  });
                  this.exempts = [...Array(this.rounds.length).fill(null)];
                  ajax(
                    "/exempts",
                    "GET",
                    {
                      data: { tid: this.$route.params["id"] },
                      success: (res) => {
                        res.exempts.forEach(e => {
                          this.exempts[e.round] = e.player; //not null
                        });
                      }
                    }
                  );
                }
              }
            );
          }
        }
      );
    },
    sortedPlayers: function() {
      return (
        Object.keys(this.players)
        .map(uid => Object.assign({ uid: uid }, this.players[uid]))
        .sort((p1,p2) => {
          const compL = p2.lastName.localeCompare(p1.lastName);
          if (compL != 0) return compL;
          return p2.firstName.localeCompare(p1.firstName);
        })
      );
    },
    isMyGame: function(g) {
      return [g.player1, g.player2].includes(this.st.user.id);
    },
    setDisplay: function(type, e) {
      this.display = type;
      let elt = (!!e ? e.target : document.getElementById(type));
      elt.classList.add("active");
      const otherType = (type == "players" ? "tournament" : "players");
      document.getElementById(otherType).classList.remove("active");
    },
    joinTournament: function() {
      const newPlayer = {
        elo: this.newElo,
        name: this.newName,
      };
      const error = checkPlayer(newPlayer);
      if (!!error) {
        alert(error);
        return;
      }
      const earlyRegistration =
        (Date.now() < this.tournament.dtstart - CONFIRM_WINDOW);
      ajax(
        "/players",
        "POST",
        {
          data: {
            player: Object.assign({ tid: this.tournament.id }, newPlayer)
          },
          success: (res) => {
            this.players[res.id] =
              Object.assign(
                {
                  firstName: this.st.user.firstName,
                  lastName: this.st.user.lastName,
                  club: this.st.user.club,
                  quit: earlyRegistration
                },
                newPlayer
              );
          }
        }
      );
      if (earlyRegistration) {
        // Before 45 min before tournament start: mark as "quit"
        this.tournament.quit.push(this.st.user.id);
        ajax(
          "/tournaments",
          "PUT",
          {
            data: {
              tid: this.tournament.id,
              quit: this.tournament.quit
            }
          }
        );
      }
    },
    nameAndScore: function(uid) {
      return this.players[uid].name + "[" + this.scores[uid] + "]";
    },
    confirmParticipation: function() {
      this.players[this.st.user.id].quit = false;
      const quitIdx =
        this.tournament.quit.findIndex(q => q == this.st.user.id);
      this.tournament.quit.splice(quitIdx, 1);
      ajax(
        "/tournaments",
        "PUT",
        {
          data: {
            tid: this.tournament.id,
            quit: this.tournament.quit
          }
        }
      );
    },
    tryTogglePlayer: function(p) {
      if (
        this.tournament.completed ||
        Date.now() < this.tournament.dtstart - CONFIRM_WINDOW
      ) {
        // Either too early or too late: no action to perform
        window.open(this.getProfileLink(p.name), "_blank");
      }
      else {
        const admin = params.admin.includes(this.st.user.id);
        if (!admin && p.name != this.st.user.name)
          // Nothing to toggle: just show player's profile
          window.open(this.getProfileLink(p.name), "_blank");
        else {
          let banned = false;
          const initSize = {
            quit: this.tournament.quit.length,
            ban: this.tournament.ban.length
          };
          const banIdx = this.tournament.ban.findIndex(b => b == p.uid);
          if (banIdx >= 0) {
            if (!admin || !confirm("Unban player?")) return;
            this.tournament.ban.splice(banIdx, 1);
            this.players[p.uid].ban = false;
          }
          else if (admin && confirm("Ban player?")) {
            this.tournament.ban.push(p.uid);
            this.players[p.uid].ban = true;
            banned = true;
          }
          if (!banned) {
            const quitIdx = this.tournament.quit.findIndex(q => q == p.uid);
            if (quitIdx >= 0) {
              this.tournament.quit.splice(quitIdx, 1);
              this.players[p.uid].quit = false;
            }
            else {
              this.tournament.quit.push(p.uid);
              this.players[p.uid].quit = true;
            }
          }
          let data = { tid: this.tournament.id };
          if (this.tournament.quit.length != initSize["quit"])
            data.quit = this.tournament.quit;
          if (this.tournament.ban.length != initSize["ban"])
            data.ban = this.tournament.ban;
          ajax(
            "/tournaments",
            "PUT",
            { data: data }
          );
        }
      }
    },
    getProfileLink: function(name) {
      switch (this.tournament.website) {
        case "lichess":
          return "https://lichess.org/@/" + name;
        case "vchess":
          // No profile pages on lichess (just short bio)
          return "#";
      }
    },
    showPairingBtn: function() {
      const L = this.rounds.length;
      return (
        params.admin.includes(this.st.user.id) &&
        (
          L == 0 ||
          this.rounds[L-1].every(g => !!g.score)
        )
      );
    },
    computePairings: function() {
              // pairing = round + exempt
      // TODO: rounds[L-1] is supposed completed,
      // add a column and fill it with new pairing.
      // TODO: need to keep track or recompute current scores.
      //this.scores = ... TODO: compute current scores. (useful for pairing anyway)
    },
    computeFinalGrid: function() {
      const t = this.tournament;
      // 'rounds' array is supposed full
      const n = Object.keys(this.players).length;
      let scores = [...Array(n).fill(0)];
      let gameLink = ArrayFun.init(n, n, "");
      let performance = [...Array(n).fill(0)];
      let tieBreak = [...Array(n).fill(0)];
      let ranking =
        scores.map((s,i) => [s, i])
        .sort((si1,si2) => si2[0] - si1[0])
        .map(si => si[1]);
      // TODO: use ranking here, to reorder (unused in display)
      // + finalGrid.rounds[i][j].url contient les gameLinks (si dispo, sinon pas de lien) [ + .value ]
    },
    send: function(code, obj) {
      if (!!this.conn && this.conn.readyState == 1)
        this.conn.send(JSON.stringify(Object.assign({ code: code }, obj)));
    },
    // NOTE: action if provided is always a closing action
    toggleChat: function(action) {
      if (!action && document.getElementById("modalChat").checked)
        // Entering chat
        document.getElementById("inputChat").focus();
      else
        document.getElementById("chatBtn").classList.remove("somethingnew");
    },
    tryShowModalScore: function(g) {
      if ([g.player1, g.player2].includes(this.st.user.id)) {
        this.curGame = g;
        doClick("modalScore");
      }
    },
    setScore: function(e) {
      const score = e.target.innerHTML;
      this.curGame.score = score;
      ajax(
        "/games",
        "PUT",
        { data: { game: this.curGame } }
      );
      this.curGame = {};
    },
    setGameLink: function() {
      ajax(
        "/games",
        "PUT",
        { data: { game: this.curGame } }
      );
      this.curGame = {};
    },
    setElo(value) {
      this.newElo = value;
    },
    setLinkOrShowGame: function(g) {
      if ([g.player1, g.player2].includes(this.st.user.id)) {
        this.curGame = g;
        doClick("modalGamelink");
      }
      else this.$router.push(g.gameLink);
    },
    viewGameBtn: function(g) {
      if ([g.player1, g.player2].includes(this.st.user.id))
        return "Edit link";
      return "View";
    },
    processChat: function(chat) {
      this.send("newchat", { data: chat });
      ajax(
        "/chats",
        "POST",
        { data: chat }
      );
    },
    clearChat: function() {
      this.chats = [];
      this.$refs["chatcomp"].chats = [];
    },
    socketMessageListener: function(msg) {
      if (!this.conn) return;
      const data = JSON.parse(msg.data);
      switch (data.code) {
        // TODO: several other messages, like "join/quit/ban" ...
        case "pairing": {
          // A pairing is an array of [player1, player2]
          const pairing = data.data;
          this.rounds.push(
            pairing.map(p => {
              return {
                player1: p[0],
                player2: p[1],
                score: "",
                gameLink: ""
              };
            })
          );
          break;
        }
        case "result": {
          const game = data.data;
          const rIdx =
            this.rounds[game.round].findIndex(g => g.player1 == game.player1);
          this.rounds[game.round][rIdx].score = game.score;
          break;
        }
        case "newchat": {
          let chat = data.data;
          this.$refs["chatcomp"].newChat(chat);
          if (!document.getElementById("modalChat").checked)
            document.getElementById("chatBtn").classList.add("somethingnew");
          break;
        }
      }
    }
  }
};
</script>

<style lang="sass" scoped>
#aboveTour
  text-align: center

button
  display: inline-block
  margin: 0
  display: inline-flex
  img
    height: 22px
    display: flex
    @media screen and (max-width: 767px)
      height: 18px

tr.my-pairing > td
  background-color: orange

.somethingnew
  background-color: #D2B4DE
</style>

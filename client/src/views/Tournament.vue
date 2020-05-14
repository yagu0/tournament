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
  input#modalTinfos.modal(type="checkbox")
  div#tinfosWrap(
    role="dialog"
    data-checkbox="modalTinfos"
  )
    .card
      label.modal-close(for="modalTinfos")
      #tournamentInfos
        p {{ st.tr["Website"] }} : {{ website }}
        p {{ st.tr["Cadence"] }} : {{ tournament.cadence }}
        p {{ tournament.nbRounds }} {{ st.tr["rounds"] }}
        p(v-if="tournament.bothcol") st.tr["Round trip"]
  input#modalJoin.modal(type="checkbox")
  div#joinWrap(
    role="dialog"
    data-checkbox="modalJoin"
  )
    .card
      label.modal-close(for="modalJoin")
      fieldset
        label(for="joinName") {{ st.tr["Username"] }}
        input#joinName(type="text" v-model="newPlayer.name")
      fieldset
        label(for="joinElo") {{ st.tr["Known rating"] }}
        input#joinElo(type="number" v-model="newPlayer.elo")
        label(for="joinEstimElo") {{ st.tr["Unknown rating:"] }}
        select#joinEstimElo(v-model="newPlayer.elo")
          option(value="1200") {{ st.tr["Beginner"] }}
          option(value="1500") {{ st.tr["Intermediate"] }}
          option(value="1800") {{ st.tr["Advanced"] }}
          option(value="2100") {{ st.tr["Expert"] }}
          option(value="2400") {{ st.tr["Master"] }}
      fieldset
        button(@click="re_joinTournament()") {{ st.tr["Send"] }}
  input#modalGamelink.modal(type="checkbox")
  div#gamelinkWrap(
    role="dialog"
    data-checkbox="modalGamelink"
  )
    .card
      label.modal-close(for="modalGamelink")
      fieldset
        label(for="gamelink") {{ st.tr["Game link"] }}
        input#gamelink(type="text" v-model="curGame.glink")
        button(@click="setGamelink()") {{ st.tr["Send"] }}
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
      span#tournamentTitle(onClick="window.doClick('modalTinfos')")
        | {{ tournament.title }}
      button#chatBtn(
        onClick="window.doClick('modalChat')"
        aria-label="Chat"
      )
        | Chat
        img(src="../assets/chat.svg")
  .row
    .col-sm-12.col-md-10.col-md-offset-1.col-lg-8.col-lg-offset-2
      .button-group
        button.tabbtn#players(@click="setDisplay('players',$event)")
          | {{ st.tr["Players"] }}
        button.tabbtn#tournament(@click="setDisplay('tournament',$event)")
          | {{ st.tr["Tournament"] }}
      div(v-show="display=='players'")
        button#confirmBtn(
          v-if="showConfirmButton()"
          @click="confirmParticipation()"
        )
          | {{ st.tr["Confirm"] }}
        button#joinBtn(
          v-if="showJoinButton()"
          onClick="window.doClick('modalJoin')"
        )
          | {{ st.tr["Join"] }}
        table
          thead
            tr
              th {{ st.tr["Name"] }}
              th {{ st.tr["Username"] }}
              th ELO ({{ tournament.website }})
              th {{ st.tr["Club"] }}
          tbody
            tr(
              v-for="p in sortedPlayers()"
              @click="tryActionPlayer(p,'quit')"
              @contextmenu="tryShowDeleteBox($event,p)"
              :class="{quit: p.quit, ban: p.ban}"
            )
              td {{ p.lastName.toUpperCase() + " " + p.firstName }}
              td {{ p.name }}
              td {{ p.elo }}
              td {{ p.club }}
      div(v-show="display=='tournament'")
        div(v-if="tournament.completed")
          table(v-if="!!finalGrid")
            thead
              tr
                th Pl
                //th {{ st.tr["Name"] }}
                th {{ st.tr["Username"] }}
                th ELO ({{ tournament.website }})
                th(v-for="(r,i) in rounds") {{ "R" + (i+1) }}
                th {{ st.tr["Score"] }}
                th TB
                th Perf
            tbody
              tr(v-for="(p,i) in finalGrid.ranking")
                td {{ i + 1 }}
                //td {{ p.lastName.toUpperCase() + " " + p.firstName }}
                td {{ p.name }}
                td {{ p.elo }}
                td(v-for="j in rounds.length")
                  a(
                    v-if="!!finalGrid.rounds[p.uid][j-1].url"
                    :href="finalGrid.rounds[p.uid][j-1].url"
                  )
                    | {{ finalGrid.rounds[p.uid][j-1].value || "" }}
                  span(v-else) {{ finalGrid.rounds[p.uid][j-1].value || "" }}
                td {{ scores[p.uid] }}
                td {{ Math.round(100*finalGrid.tieBreak[p.uid]) / 100 }}
                td {{ Math.round(finalGrid.performance[p.uid]) }}
        div(v-else-if="Date.now() > tournament.dtstart")
          table(v-if="rounds.length >= 1")
            thead
              tr
                th {{ st.tr["Player"] }} 1
                th {{ st.tr["Player"] }} 2
                th {{ st.tr["Result"] }}
                th 
            tbody
              tr(
                v-for="g in rounds[rounds.length-1]"
                :class="{ 'my-pairing': isMyGame(g) }"
              )
                td(@click="tryChallengeOpp(g)") {{ nameAndScore(g.player1) }}
                td(@click="tryChallengeOpp(g)") {{ nameAndScore(g.player2) }}
                td(@click="tryShowModalScore(g)") {{ g.score || "*" }}
                td(@click="setLinkOrShowGame(g)")
                  button(:disabled="!g.glink && !isMyGame(g)")
                    | {{ viewGameBtn(g) }}
              tr(v-if="!!exempts[rounds.length-1]")
                td {{ nameAndScore(exempts[rounds.length-1]) }}
                td -
                td X
                td 
          p#checkResults(v-if="roundFinishedNotAdmin()")
            | {{ st.tr["Please check results"] }}
          div(v-if="!tournament.completed && roundCompleted()")
            button(
              v-if="rounds.length > 0 && !tournament.frozen"
              @click="freezeResults()"
            )
              | {{ st.tr["Freeze results"] }}
            button(
              v-else-if="rounds.length < tournament.nbRounds"
              @click="computePairings()"
            )
              | {{ st.tr["Next round"] }}
            button(
              v-else
              @click="finishTournament()"
            )
              | {{ st.tr["Finish tournament"] }}
        div(v-else)
          #centerTime
            p {{ st.tr["Time before start:"] }} 
            p#countdown
</template>

<script>
import Chat from "@/components/Chat.vue";
import { notify } from "@/utils/notifications";
import { ajax } from "@/utils/ajax";
import { getRandString } from "@/utils/alea";
import { ppt } from "@/utils/datetime";
import { ArrayFun } from "@/utils/array";
import { maxWeightMatching } from "@/utils/mwmatching3";
import { checkPlayer } from "@/data/playerCheck";
import { store } from "@/store";
import { processModalClick } from "@/utils/modalClick.js";
import params from "@/parameters";
// Time before a tournament to confirm registration: 45 minutes
const CONFIRM_WINDOW = 45*60*1000;
let countdown = 0;
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
      scores: {}, //current cumulated results
      exempts: [],
      finalGrid: null,
      focus: !document.hidden, //will not always work... TODO
      newPlayer: {},
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
    ["gamelink","score","join","tinfos"].forEach(elt => {
      document.getElementById(elt + "Wrap")
        .addEventListener("click", processModalClick);
    });
    document.getElementById("chatWrap").addEventListener("click", (e) => {
      processModalClick(e, () => {
        this.toggleChat("close")
      });
    });
  },
  beforeDestroy: function() {
    this.cleanBeforeDestroy();
  },
  computed: {
    website: function() {
      switch (this.tournament.website) {
        case "lichess": return "https://lichess.org";
        case "vchess": return "https://vchess.club";
      }
      return ""; //never reached
    }
  },
  methods: {
    showConfirmButton: function() {
      const now = Date.now();
      return (
        now < this.tournament.dtstart &&
        now >= this.tournament.dtstart - CONFIRM_WINDOW &&
        Object.keys(this.players).includes(this.st.user.id) &&
        !!this.players[this.st.user.id].quit
      );
    },
    showJoinButton: function() {
      return (
        Date.now() < this.tournament.dtstart &&
        this.st.user.id > 0 && !!this.st.user.active &&
        !Object.keys(this.players).includes(this.st.user.id.toString())
      );
    },
    cleanBeforeDestroy: function() {
      if (!!this.timer) clearInterval(this.timer);
      if (!!this.conn) {
        clearInterval(this.socketCloseListener);
        document.removeEventListener('visibilitychange', this.visibilityChange);
        window.removeEventListener('focus', this.onFocus);
        window.removeEventListener('blur', this.onBlur);
        this.conn.removeEventListener("message", this.socketMessageListener);
        this.conn = null;
      }
    },
    visibilityChange: function() {
      this.focus = (document.visibilityState == "visible");
    },
    onFocus: function() {
      this.focus = true;
    },
    onBlur: function() {
      this.focus = false;
    },
    atCreation: function() {
      // (Re)Set variables
      let chatComp = this.$refs["chatcomp"];
      if (!!chatComp) chatComp.chats = [];
      this.chats = [];
      const setSocketVars = () => {
        const now = Date.now();
        if (now > this.tournament.dtstart)
          // Tournament running or completed: focus on tournament
          this.display = "tournament";
        if (!this.tournament.completed) {
          if (now < this.tournament.dtstart) {
            countdown = (this.tournament.dtstart - now) / 1000;
            let remainingTime = document.getElementById("countdown");
            remainingTime.innerHTML = ppt(countdown);
            this.timer = setInterval(
              () => {
                if (--countdown <= 0) clearInterval(this.timer);
                else remainingTime.innerHTML = ppt(countdown);
              },
              1000
            );
          }
          // Initialize connection + focus listeners
          const sid = getRandString();
          this.connexionString =
            params.socketUrl + "/?sid=" + sid + "&page=" + this.tournament.id;
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
          document.addEventListener('visibilitychange', this.visibilityChange);
          window.addEventListener('focus', this.onFocus);
          window.addEventListener('blur', this.onBlur);
        }
      };
      let scoresComputed = false;
      let playersRetrieved = false;
      let chatsRetrieved = false;
      const fillChatNames = () => {
        this.chats.forEach(c => {
          if (!!this.players[c.uid]) c.name = this.players[c.uid].name;
        });
        let chatIds = {};
        this.chats.forEach(c => {
          if (!this.players[c.uid]) chatIds[c.uid] = true;
        });
        const uids = Object.keys(chatIds);
        if (uids.length > 0) {
          ajax(
            "/users",
            "GET",
            {
              data: { ids: uids },
              success: (res) => {
                res.users.forEach(u =>
                  chatIds[u.id] = u.firstName + "_" + u.lastName.charAt(0));
                this.chats.forEach(
                  c => { if (!!chatIds[c.uid]) c.name = chatIds[c.uid]; });
                this.$refs["chatcomp"].$forceUpdate();
              }
            }
          );
        }
        else this.$refs["chatcomp"].$forceUpdate();
      };
      ajax(
        "/tournaments",
        "GET",
        {
          data: { id: this.$route.params["id"] },
          success: (res) => {
            this.tournament = res.tournament;
            setSocketVars();
            ajax(
              "/players",
              "GET",
              {
                data: { tid: this.$route.params["id"] },
                success: (res2) => {
                  if (!res2.players || res2.players.length == 0) return;
                  ajax(
                    "/users",
                    "GET",
                    {
                      data: { ids: res2.players.map(p => p.uid) },
                      success: (res3) => {
                        // User IDs may not appear in the same order
                        let users = {};
                        res3.users.forEach(u => {
                          users[u.id] = {
                            firstName: u.firstName,
                            lastName: u.lastName,
                            club: u.club
                          };
                        });
                        res2.players.forEach(p => {
                          this.$set(this.players, p.uid,
                            Object.assign(
                              {
                                name: p.name,
                                elo: p.elo,
                                quit: p.quit,
                                ban: p.ban
                              },
                              users[p.uid]
                            )
                          );
                          if (p.uid == this.st.user.id)
                            this.st.user.name = p.name;
                        });
                        playersRetrieved = true;
                        if (chatsRetrieved) fillChatNames();
                        if (scoresComputed && this.tournament.completed)
                          this.computeFinalGrid();
                      }
                    }
                  );
                }
              }
            );
            ajax(
              "/chats",
              "GET",
              {
                data: { tid: this.$route.params["id"] },
                success: (res2) => {
                  this.chats = res2.chats.sort((c1,c2) => c2.added - c1.added);
                  chatsRetrieved = true;
                  if (playersRetrieved) fillChatNames();
                }
              }
            );
            ajax(
              "/games",
              "GET",
              {
                data: { tid: this.$route.params["id"] },
                success: (res2) => {
                  if (res2.games.length == 0) return;
                  // Reorganize games data into rounds array.
                  // Final round may have incomplete result.
                  const L = Math.max.apply(null, res2.games.map(g => g.round));
                  this.rounds = [...Array(L)].map(r => []);
                  res2.games.forEach(g => {
                    this.rounds[g.round - 1].push({
                      player1: g.player1,
                      player2: g.player2,
                      score: g.score,
                      glink: g.glink,
                    });
                  });
                  this.exempts = [...Array(L).fill(null)];
                  ajax(
                    "/exempts",
                    "GET",
                    {
                      data: { tid: this.$route.params["id"] },
                      success: (res3) => {
                        res3.exempts.forEach(e => {
                          this.exempts[e.round - 1] = e.player; //not null
                        });
                        this.computeScores();
                        scoresComputed = true;
                        if (playersRetrieved && this.tournament.completed)
                          this.computeFinalGrid();
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
      let allButMe =
        Object.keys(this.players)
        .filter(uid => uid != this.st.user.id)
        .map(uid => Object.assign({ uid: uid }, this.players[uid]))
        .sort((p1,p2) => {
          const compL = p1.lastName.localeCompare(p2.lastName);
          if (compL != 0) return compL;
          return p1.firstName.localeCompare(p2.firstName);
        });
      if (!this.st.user.id || !this.players[this.st.user.id])
        // I'm not playing
        return allButMe;
      const me = Object.assign(
        { uid: this.st.user.id },
        this.players[this.st.user.id]
      );
      return [me].concat(allButMe);
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
    re_joinTournament: function() {
      document.getElementById("modalJoin").checked = false;
      if (Object.keys(this.players).some(k => k == this.st.user.id)) {
        // Edit mode: elo and/or (user) name may have changed
        this.$set(this.players, this.st.user.id,
          Object.assign(this.players[this.st.user.id], this.newPlayer));
        ajax(
          "/players",
          "PUT",
          {
            data: {
              player:
                Object.assign({ tid: this.tournament.id }, this.newPlayer)
            }
          }
        );
        this.send(
          "player-update",
          { data: Object.assign({ uid : this.st.user.id }, this.newPlayer) }
        );
        return;
      }
      if (!this.st.user.active) return;
      const earlyRegistration =
        (Date.now() < this.tournament.dtstart - CONFIRM_WINDOW);
      const newPlayer =
        Object.assign({ quit: earlyRegistration }, this.newPlayer);
      const error = checkPlayer(newPlayer);
      if (!!error) {
        alert(this.st.tr[error]);
        return;
      }
      ajax(
        "/players",
        "POST",
        {
          data: {
            player: Object.assign({ tid: this.tournament.id }, newPlayer)
          },
          success: (res) => {
            this.$set(this.players, this.st.user.id,
              Object.assign(
                {
                  firstName: this.st.user.firstName,
                  lastName: this.st.user.lastName,
                  club: this.st.user.club
                },
                newPlayer
              )
            );
          }
        }
      );
      this.send(
        "player-create",
        {
          data:
            Object.assign(
              {
                uid : this.st.user.id,
                firstName: this.st.user.firstName,
                lastName: this.st.user.lastName,
                club: this.st.user.club
              },
              newPlayer
            )
        }
      );
    },
    nameAndScore: function(uid) {
      return (
        // At the beginning players might not be initialized
        !!this.players[uid]
          ? this.players[uid].name + " [" + this.scores[uid] + "]"
          : ""
      );
    },
    confirmParticipation: function() {
      this.$set(this.players, this.st.user.id,
        Object.assign(this.players[this.st.user.id], { quit: false }));
      ajax(
        "/toggle_banquit",
        "PUT",
        {
          data: {
            banQuit: {
              uid: this.st.user.id,
              tid: this.tournament.id,
              quit: false
            }
          }
        }
      );
      this.send(
        "player-update",
        { data: { uid : this.st.user.id, quit: false } }
      );
    },
    tryShowDeleteBox: function(e, p) {
      if (this.st.user.id == p.uid && Date.now() < this.tournament.dtstart) {
        e.preventDefault();
        if (confirm(this.st.tr["Withdraw from tournament?"])) {
          this.$delete(this.players, p.uid);
          ajax(
            "/players",
            "DELETE",
            { data: { tid: this.tournament.id } }
          );
          this.send("player-delete", { data: { uid: p.uid } });
        }
      }
      else if (
        params.admin.includes(this.st.user.id) &&
        p.uid != this.st.user.id
      ) {
        e.preventDefault();
        this.tryActionPlayer(p, 'ban');
      }
    },
    followProfileLink: function(name) {
      switch (this.tournament.website) {
        case "lichess":
          window.open("https://lichess.org/@/" + name, "_blank");
        case "vchess":
          // No profile pages on vchess (just short bio)
          break;
      }
    },
    // TODO: middle click (admin) => follow profile link
    tryActionPlayer: function(p, action) {
      const admin = params.admin.includes(this.st.user.id);
      const targetSelf = (this.st.user.id == p.uid);
      if (this.tournament.completed || (!targetSelf && !admin))
        // Too late, or "unauthorized" user: no action to perform
        this.followProfileLink(p.name);
      else {
        // Allow changes until T - 5min (seems reasonable)
        if (
          Date.now() < this.tournament.dtstart - 5*60*1000 &&
          (!admin || targetSelf)
        ) {
          this.newPlayer = {
            name: p.name,
            elo: p.elo
          };
          doClick("modalJoin");
        }
        else {
          // admin || p.uid == my id, tournament no over
          if (action == "quit") {
            this.$set(this.players, p.uid,
              Object.assign(p, { quit: !p.quit }));
          }
          else if (action == "ban") {
            if (
              !admin ||
              (!p.ban && !confirm(this.st.tr["Ban player?"]))
            ) {
              return;
            }
            this.$set(this.players, p.uid,
              Object.assign(p, { ban: !p.ban }));
          }
          let data = { tid: this.tournament.id, uid: p.uid };
          if (action == "quit") data.quit = p.quit;
          else if (action == "ban") data.ban = p.ban;
          ajax(
            "/toggle_banquit",
            "PUT",
            { data: { banQuit: data } }
          );
          this.send(
            "player-update",
            { data: { uid: data.uid, ban: data.ban, quit: data.quit } }
          );
        }
      }
    },
    tryChallengeOpp: function(g) {
      let opp = null;
      if (g.player1 == this.st.user.id) opp = g.player2;
      else if (g.player2 == this.st.user.id) opp = g.player1;
      if (!!opp) {
        switch (this.tournament.website) {
          case "lichess":
            window.open(
              "https://lichess.org/?user=" +
              this.players[opp].name + "#friend",
              "_blank"
            );
            break;
          case "vchess":
            // No individual challenge link: just redirect to hall
            window.open("https://vchess.club", "_blank");
            break;
        }
      }
    },
    roundCompleted: function() {
      const L = this.rounds.length;
      return (
        params.admin.includes(this.st.user.id) &&
        (L == 0 || this.rounds[L-1].every(g => !!g.score))
      );
    },
    roundFinishedNotAdmin: function() {
      const L = this.rounds.length;
      return (
        this.tournament.frozen &&
        !params.admin.includes(this.st.user.id) &&
        (L >= 1 && this.rounds[L-1].every(g => !!g.score))
      );
    },
    freezeResults: function() {
      this.$set(this.tournament, "frozen", true);
      ajax(
        "/toggle_state",
        "PUT",
        {
          data: {
            tid: this.tournament.id,
            frozen: true
          }
        }
      );
      this.send("tournament-state", { data: { frozen: true } });
    },
    finishTournament: function() {
      this.$set(this.tournament, "frozen", false);
      this.$set(this.tournament, "completed", true);
      ajax(
        "/toggle_state",
        "PUT",
        {
          data: {
            tid: this.tournament.id,
            frozen: false,
            over: true
          }
        }
      );
      this.send("tournament-state", { data: { frozen: false, over: true } });
      this.computeFinalGrid();
    },
    increment: function(obj, field, by) {
      if (by === undefined) by = 1;
      if (!obj[field]) obj[field] = by;
      else obj[field] += by;
    },
    computeScores: function() {
      const scoreSymbToValues = (score) => {
        switch (score) {
          case "1-0": return [1, 0];
          case "1/2": return [0.5, 0.5];
          case "0-1": return [0, 1];
          case "1-F": return [1, 0];
          case "F-1": return [0, 1];
          case "F-F": return [0, 0];
          case "+2": return [2, 0];
          case "+1": return [1.5, 0.5];
          case "=": return [1, 1];
          case "-1": return [0.5, 1.5];
          case "-2": return [0, 2];
        }
        return []; //never reached
      };
      // Use current rounds state to get cumulated scores:
      let L = this.rounds.length;
      if (
        L >= 1 &&
        (this.tournament.frozen || this.rounds[L-1].some(g => !g.score))
      ) {
        L--;
      }
      let scores = {};
      for (let i=0; i<L; i++) {
        if (!!this.exempts[i]) this.increment(scores, this.exempts[i]);
        this.rounds[i].forEach(g => {
          const sc = scoreSymbToValues(g.score);
          this.increment(scores, g.player1, sc[0]);
          this.increment(scores, g.player2, sc[1]);
        });
      }
      Object.keys(this.players).forEach(uid => {
        if (!scores[uid]) scores[uid] = 0;
      });
      this.scores = scores;
    },
    // rounds[L-1] is supposed completed:
    computePairings: function() {
      if (this.tournament.frozen) {
        // The results were frozen: un-freeze first
        this.tournament.frozen = false;
        ajax(
          "/toggle_state",
          "PUT",
          {
            data: {
              tid: this.tournament.id,
              frozen: false
            }
          }
        );
        this.send("tournament-state", { data: { frozen: false } });
      }
      const L = this.rounds.length;
      this.computeScores();
      let activePlayers =
        Object.keys(this.players).filter(k => {
          return (!this.players[k].quit && !this.players[k].ban);
        });
      let n = activePlayers.length;
      let state = {};
      Object.keys(this.players).forEach(k => {
        state[k] = {
          met: {},
          // NOTE: colors are used only if !tournament.bothcol
          colors: { W: 0, B: 0 },
          exempt: 0
        };
      });
      for (let i=0; i<L; i++) {
        if (!!this.exempts[i])
          state[this.exempts[i]].exempt++;
        else {
          this.rounds[i].forEach(g => {
            this.increment(state[g.player1].met, g.player2);
            this.increment(state[g.player2].met, g.player1);
            state[g.player1].colors['W']++;
            state[g.player2].colors['B']++;
          });
        }
      }
      let pairing = { round: [] };
      if (n % 2 == 1) {
        // Determine a player out for this round
        let exempt = -1;
        let minScore = Infinity;
        activePlayers.forEach(k => {
          const scoreE =
            state[k].exempt +
            // Divide by 2(4) * L to work with bothcol == true or not
            this.scores[k] / (2 * (L + 1)) +
            (1 - 1 / this.players[k].elo) / (4 * (L + 1));
          if (scoreE < minScore) {
            minScore = scoreE;
            exempt = k;
          }
        });
        pairing.exempt = exempt;
        const aIdx = activePlayers.findIndex(p => p == exempt);
        activePlayers.splice(aIdx, 1);
        n--;
      }
      // Compute distances (half) matrix for core pairing algorithm
      let edges = [];
      for (let i=0; i < n - 1; i++) {
        const scoreI = this.scores[activePlayers[i]];
        const eloI = this.players[activePlayers[i]].elo;
        for (let j=i+1; j < n; j++) {
          const scoreJ = this.scores[activePlayers[j]];
          const eloJ = this.players[activePlayers[j]].elo;
          const distIJ =
            // 500: arbitrary value (should be greater than number of rounds)
            500 * (state[activePlayers[i]].met[activePlayers[j]] || 0) +
              Math.abs(scoreI - scoreJ) + 1 / (5 + Math.abs(eloI - eloJ));
          // Negative distance, because the algorithm maximize the cost
          edges.push([i, j, -distIJ]);
        }
      }
//      const assignment = maxWeightMatching(edges, true);
      const finishPairings = (assignment) => {
        let alreadyPaired = {};
        let colors = {};
        for (let i=0; i<n; i++) {
          const pI = activePlayers[i];
          if (!alreadyPaired[pI]) {
            // Color assignment: the player who had black the most takes white
            const pJ = activePlayers[assignment[i]];
            let pair = [pI, pJ];
            if (
              state[pJ].colors['B'] > state[pI].colors['B'] ||
              (
                state[pJ].colors['B'] == state[pI].colors['B'] &&
                Math.random() < 0.5
              )
            ) {
              pair.reverse();
            }
            pairing.round.push({
              player1: parseInt(pair[0]),
              player2: parseInt(pair[1])
            });
            alreadyPaired[pI] = true;
            alreadyPaired[pJ] = true;
          }
        }
        this.rounds.push(pairing.round);
        this.exempts.push(pairing.exempt || null);
        // Communicate pairings, to the server and to peers
        ajax(
          "/games",
          "POST",
          {
            data: {
              games: {
                tid: this.tournament.id,
                round: L + 1,
                versus: pairing.round
              }
            }
          }
        );
        if (!!pairing.exempt) {
          ajax(
            "/exempts",
            "POST",
            {
              data: {
                exempt: {
                  tid: this.tournament.id,
                  round: L + 1,
                  player: parseInt(pairing.exempt)
                }
              }
            }
          );
        }
        this.send("pairing", { data: pairing });
      };
      maxWeightMatching(edges, finishPairings);
    },
    computeFinalGrid: function() {
      const scoreToSymbol = (score, c) => {
        switch (score) {
          case "1-0": return (c == 'W' ? '+' : '-');
          case "0-1": return (c == 'W' ? '-' : '+');
          case "1/2": return '=';
          case "+2": return (c == 'W' ? '++' : '--');
          case "+1": return (c == 'W' ? '+=' : '-=');
          case "=": return '=';
          case "-1": return (c == 'W' ? '-=' : '+=');
          case "-2": return (c == 'W' ? '--' : '++');
          case "1-F": return (c == 'W' ? '>' : '<');
          case "F-1": return (c == 'W' ? '<' : '>');
          case "F-F": return '<';
        }
        return ""; //never reached
      };
      this.computeScores();
      const n = Object.keys(this.players).length;
      const L = this.rounds.length;
      let met = {};
      Object.keys(this.players).forEach(uid => met[uid] = {});
      for (let i=0; i<L; i++) {
        this.rounds[i].forEach(g => {
          this.increment(met[g.player1], g.player2);
          this.increment(met[g.player2], g.player1);
        });
      }
      let performance = {},
          tieBreak = {};
      const multFact = (this.tournament.bothcol ? 2 : 1);
      // TODO: 10 here is very arbitrary
      const minP = 1 / (multFact * 10 * this.tournament.nbRounds);
      // Compute perf:
      let success = {};
      Object.keys(this.players).forEach(uid => {
        const pMet = Object.keys(met[uid]);
        if (pMet.length == 0) performance[uid] = 0;
        else {
          // Met at least one oppponent:
          let perf = 0;
          let totGames = 0;
          pMet.forEach(m => {
            perf += met[uid][m] * this.players[m].elo;
            totGames += met[uid][m];
          });
          perf /= totGames;
          const adjustedScore =
            this.scores[uid] - this.exempts.filter(e => e == uid).length;
          success[uid] = adjustedScore / (multFact * totGames);
          if (success[uid] == 0) success[uid] = minP;
          else if (success[uid] == 1) success[uid] = 1 - minP;
          const delta = -400 * Math.log10(1 / success[uid] - 1);
          performance[uid] = perf + delta;
        }
      });
      // Compute tie break:
      Object.keys(this.players).forEach(uid => {
        const pMet = Object.keys(met[uid]);
        if (pMet.length == 0) tieBreak[uid] = 0;
        else {
          let tb = 0;
          let totGames = 0;
          pMet.forEach(m => {
            tb += met[uid][m] * success[m];
            totGames += met[uid][m];
          });
          tieBreak[uid] = tb / totGames;
        }
      });
      // Now rank players and fill variables
      let pids = Object.keys(this.players).sort((p1,p2) => {
        if (!this.scores[p1] && !this.scores[p2]) return 0;
        if (!this.scores[p1]) return 1;
        if (!this.scores[p2]) return -1;
        // Both players have a score, perf and tie-break (usual case)
        if (this.scores[p1] > this.scores[p2]) return -1;
        if (this.scores[p1] < this.scores[p2]) return 1;
        if (performance[p1] > performance[p2]) return -1;
        if (performance[p1] < performance[p2]) return 1;
        if (tieBreak[p1] > tieBreak[p2]) return -1;
        if (tieBreak[p1] < tieBreak[p2]) return 1;
        // At this stage, real ex-aequo: should happen much...
        return 0;
      });
      const ranking = pids.map(uid => {
        return Object.assign({ uid: uid }, this.players[uid]);
      });
      let rounds = {};
      pids.forEach(uid => {
        rounds[uid] = [...Array(L)];
        for (let i=0; i<L; i++) rounds[uid][i] = { url: "", value: "" };
      });
      for (let i=0; i<n; i++) rounds
      let rank = {};
      for (let i=0; i<n; i++) rank[pids[i]] = i + 1;
      for (let i=0; i<L; i++) {
        this.rounds[i].forEach(g => {
          const [p1, p2] = [g.player1, g.player2];
          rounds[p1][i].url = g.glink;
          rounds[p2][i].url = g.glink;
          rounds[p1][i].value = scoreToSymbol(g.score, 'W') + rank[p2];
          if (!this.tournament.bothcol) rounds[p1][i].value += 'W';
          rounds[p2][i].value = scoreToSymbol(g.score, 'B') + rank[p1];
          if (!this.tournament.bothcol) rounds[p2][i].value += 'B';
        });
        if (!!this.exempts[i]) rounds[this.exempts[i]][i].value = "E";
      }
      // Fill rounds with empty values for unplayed games:
      Object.keys(this.players).forEach(uid => {
        for (let i=0; i<L; i++)
          if (!rounds[uid][i]) rounds[uid][i] = {};
      });
      this.finalGrid = {
        ranking: ranking,
        performance: performance,
        tieBreak: tieBreak,
        rounds: rounds
      };
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
      if (
        params.admin.includes(this.st.user.id) ||
        [g.player1, g.player2].includes(this.st.user.id)
      ) {
        this.curGame = g;
        doClick("modalScore");
      }
    },
    setScore: function(e) {
      if (this.tournament.completed) return;
      document.getElementById("modalScore").checked = false;
      if (!params.admin.includes(this.st.user.id) && this.tournament.frozen) {
        alert(this.st.tr["Give the result in chat"]);
        return;
      }
      const score = e.target.innerHTML;
      this.curGame.score = score;
      ajax(
        "/games",
        "PUT",
        {
          data: {
            game: {
              tid: this.tournament.id,
              round: this.rounds.length,
              player1: this.curGame.player1,
              player2: this.curGame.player2,
              score: score
            }
          }
        }
      );
      this.send(
        "game-update",
        { data: { player1: this.curGame.player1, score: score } }
      );
      this.curGame = {};
    },
    // TODO: game links could be modified even after the tournament ends
    // (by anyone ? Just admin ?)
    setGamelink: function() {
      document.getElementById("modalGamelink").checked = false;
      ajax(
        "/games",
        "PUT",
        {
          data: {
            game: {
              tid: this.tournament.id,
              round: this.rounds.length,
              player1: this.curGame.player1,
              player2: this.curGame.player2,
              glink: this.curGame.glink
            }
          }
        }
      );
      this.send(
        "game-update",
        { data: { player1: this.curGame.player1, glink: this.curGame.glink } }
      );
      this.curGame = {};
    },
    setLinkOrShowGame: function(g) {
      if ([g.player1, g.player2].includes(this.st.user.id)) {
        this.curGame = g;
        doClick("modalGamelink");
      }
      else if (!!g.glink) window.open(g.glink, "_blank");
    },
    viewGameBtn: function(g) {
      if ([g.player1, g.player2].includes(this.st.user.id))
        return this.st.tr["Give link"];
      return this.st.tr["View"];
    },
    processChat: function(chat) {
      if (this.st.user.id > 0) {
        this.send("newchat", { data: chat });
        // Store only user IDs, and retrieve names at loading
        ajax(
          "/chats",
          "POST",
          {
            data: {
              tid: this.tournament.id,
              uid: this.st.user.id,
              msg: chat.msg
            }
          }
        );
      }
    },
    clearChat: function() {
      this.chats = [];
      this.$refs["chatcomp"].chats = [];
    },
    socketMessageListener: function(msg) {
      if (!this.conn) return;
      const data = JSON.parse(msg.data);
      switch (data.code) {
        case "player-create":
        case "player-update":
        case "player-delete": {
          let player = data.data;
          const uid = player.uid;
          delete player["uid"];
          if (data.code == "player-create")
            this.$set(this.players, uid, player);
          else if (data.code == "player-update") {
            this.$set(this.players, uid,
              Object.assign(this.players[uid], player));
          }
          else this.$delete(this.players, uid);
          break;
        }
        case "pairing": {
          // A pairing is an array of [player1, player2] + potential exempt
          const pairing = data.data;
          this.rounds.push(pairing.round);
          this.exempts.push(pairing.exempt);
          this.computeScores();
          if (
            this.st.user.id > 0 &&
            Object.keys(this.players).includes(this.st.user.id.toString())
          ) {
            new Audio("../assets/newpairing.flac").play().catch(() => {});
            if (!this.focus) {
              notify(
                "New round starting",
                { body: "Pairings for round " + (this.rounds.length + 1) }
              );
            }
          }
          break;
        }
        case "game-update": {
          let game = data.data;
          const L = this.rounds.length;
          const rIdx =
            this.rounds[L-1].findIndex(g => g.player1 == game.player1);
          delete game["player1"];
          this.$set(this.rounds[L-1], rIdx,
            Object.assign(this.rounds[L-1][rIdx], game));
          break;
        }
        case "newchat": {
          let chat = data.data;
          this.$refs["chatcomp"].newChat(chat);
          if (!document.getElementById("modalChat").checked)
            document.getElementById("chatBtn").classList.add("somethingnew");
          break;
        }
        case "tournament-state": {
          const newState = data.data;
          this.$set(this.tournament, "frozen", !!newState.frozen);
          this.$set(this.tournament, "completed", !!newState.over);
          if (!!newState.over) this.computeFinalGrid();
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

#chatWrap > .card, #joinWrap > .card, #gamelinkWrap > .card, #scoreWrap > .card
  max-width: 768px
  max-height: 100%

table
  max-height: 100%
  td
    border-left: 1px solid darkgrey

#tournamentTitle
  text-decoration: underline
  cursor: pointer

#checkResults
  text-align: center
  font-weight: bold

button
  display: inline-block
  margin: 0

button#joinBtn, button#confirmBtn
  display: block
  margin: 0 auto

#centerTime
  width: 100%
  margin-top: 25px
  & > p
    text-align: center
    //vertical-align: middle

#countdown
  font-size: 3em

button#chatBtn
  display: inline-flex
  justify-content: center
  align-items: center
  margin-left: 10px
  & > img
    margin-left: 5px
    height: 22px
    display: flex
    @media screen and (max-width: 767px)
      height: 18px

tr.my-pairing > td
  background-color: orange

.quit > td
  font-style: italic
  background-color: lightgrey

.ban > td
  font-style: italic
  background-color: grey

.somethingnew
  background-color: #D2B4DE
</style>

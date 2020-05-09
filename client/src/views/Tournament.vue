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
        input#gamelink(type="text" v-model="gameLink")
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
        .button-group#score(@click="setScore($event)")
          button.white-win 1-0
          button.draw 1/2
          button.black-win 0-1
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
        :class="btnTooltipClass()"
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
        table
          thead
            tr
              th Name
              th User name
              th Elo
              th Club
          tbody
            tr(v-for="p in players")
              td {{ p.firstName + " " + p.lastName }}
              // TODO: use 'tournament.website' to link profiles
              td {{ p.name }}
              td {{ p.elo }}
              td {{ p.club }}
        button(@click="doClick('modalJoin')") Join
      div(v-show="display=='tournament'")
        table(v-if="tournament.completed")
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
            tr(v-for="(p,i) in players")
              td {{ i }}
              td {{ p.firstName + " " + p.lastName }}
              td {{ p.name }}
              td {{ p.elo }}
              td {{ p.club }}
              // TODO: with game links
              td(v-for="(r,j) in rounds") {{ finalGrid.rounds[i][j] }}
              td {{ finalGrid.score[i] }}
              td {{ finalGrid.tieBreak[i] }}
              td {{ finalGrid.performance[i] }}
        div(v-else-if="Date.now() > tournament.dtstart")
          table
            thead
              tr
                th Player1
                th Player2
                th Result
                th View
            tbody
              tr(v-for="g in getPairing()")
                td {{ g.player1 }}
                td {{ g.player2 }}
                td(@click="tryShowModalScore(g)") {{ g.score }}
                td(@click="setLinkOrShowGame(g)") {{ viewGameBtn(g) }}
              // + marquer joueurs forfaits absents pour ronde suivante
              // + pour getPairing --> computePairing --> exempt (variables !)
              // this.pairing .......
              // --> quit = vecteur à ajouter à Tournament,
              // bouton detecte si player has Quit, allow join again
              // ==> action sur tournament directement (PUT...)
              // + bouton "join again"
              tr(v-if="exempt") TODO
        div(v-else)
          span {{ countdown }}
</template>

<script>
import Chat from "@/components/Chat.vue";
import { ppt } from "@/utils/datetime";
import { notify } from "@/utils/notifications";
import { ajax } from "@/utils/ajax";
import { getRandString } from "@/utils/alea";
import { ArrayFun } from "@/utils/array";
import params from "@/parameters";
export default {
  name: "my-tournament",
  components: { Chat },
  data: function() {
    return {
      st: store.state,
      tournament: { completed: false },
      players: [],
      chats: [],
      rounds: [],
      finalGrid: null,
      newName: "",
      newElo: 0,
      countdown: 0,
      curGame: null, //for tryShowModalScore(g) "callback"
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
    ["chatWrap","gamelinkWrap","scoreWrap","joinWrap"].forEach(elt => {
      document.getElementById(elt).addEventListener("click", (e) => {
        processModalClick(e, () => {
          this.toggleChat("close")
        });
      });
    });
  },
  beforeDestroy: function() {
    this.cleanBeforeDestroy();
  },
  methods: {
    cleanBeforeDestroy: function() {
      clearInterval(this.socketCloseListener);
      this.conn.removeEventListener("message", this.socketMessageListener);
      this.send("disconnect");
      this.conn = null;
    },
    atCreation: function() {
      // (Re)Set variables
      let chatComp = this.$refs["chatcomp"];
      if (!!chatComp) chatComp.chats = [];
      this.chats = [];
      const setSocketVars = () => {
        const now = Date.now();
        if (!this.tournament.completed && now < this.tournament.dtstart)
          this.countdown = this.tournament.dtstart - now;
        // Initialize connection
        const sid = getRandString();
        this.connexionString = params.socketUrl + "/?sid=" + sid;
        this.conn = new WebSocket(this.connexionString);
        this.conn.addEventListener("message", this.socketMessageListener);
        this.socketCloseListener = setInterval(
          () => {
            if (this.conn.readyState == 3) {
              this.conn.removeEventListener(
                "message", this.socketMessageListener);
              this.conn = new WebSocket(this.connexionString);
              this.conn.addEventListener("message", this.socketMessageListener);
            }
          },
          1000
        );
      };
      ajax(
        "/tournaments",
        "GET",
        {
          data: { id: this.$route.params["id"] },
          success: (res) => {
            if (res.tournament.completed)
              this.computeFinalGrid(res.tournament);
            this.tournament = res.tournament;
            setSocketVars();
          }
        }
      );
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
                  let userIds = {};
                  res2.users.forEach(u => {
                    userIds[u.id] = {
                      firstName: u.firstName,
                      lastName: u.lastName,
                      club: u.club
                    };
                  });
                  this.players = res.players;
                  this.players.forEach(p => {
                    p.firstName = userIds[p.uid].firstName;
                    p.lastName = userIds[p.uid].lastName;
                    p.club = userIds[p.uid].club;
                    if (p.uid == this.st.user.id) this.st.user.name = p.name;
                  });
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
            // Reorganize games data into rounds array.
            // Final round may have incomplete result.
            res.games.forEach(g => {
              if (this.rounds.length <= g.round) {
                Array.prototoype.push.apply(
                  this.rounds, [...Array(g.round - this.rounds.length + 1)])
              }
              this.rounds[g.round].push({
                player1: g.player1,
                player2: g.player2,
                score: g.score,
                gameLink: g.gameLink,
              });
            });
          }
        }
      );
    },
    joinTournament: function() {
      const newPlayer = {
        elo: this.newELo,
        name: this.newName,
      };
      ajax(
        "/players",
        "POST",
        {
          data: {
            player: Object.assign({ tid: this.tournament.id }, newPlayer)
          },
          success: (res) => {
            this.players.push(
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
    },
    computeFinalGrid: function(t) {
      // 'rounds' array is supposed full
      const n = this.players.length;
      let scores = [...Array(n).fill(0)];
      let gameLink = ArrayFun.init(n, n, "");
      let performance = [...Array(n).fill(0)];
      let tieBreak = [...Array(n).fill(0)];
      let ranking =
        scores.map((s,i) => [s, i])
        .sort((si1,si2) => si2[0] - si1[0])
        .map(si => si[1]);
      // TODO: use ranking here, to reorder (unused in display)
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
      else {
        document.getElementById("chatBtn").classList.remove("somethingnew");
        if (!!this.game.mycolor) {
          // Update "chatRead" variable either on server or locally
          if (this.game.type == "corr")
            this.updateCorrGame({ chatRead: this.game.mycolor });
          else if (this.game.type == "live")
            GameStorage.update(this.gameRef, { chatRead: true });
        }
      }
    },
    tryShowModalScore: function(g) {
      if ([g.player1, g.player2].includes(this.st.user.id)) {
        this.curGame = g;
        doClick("modalScore");
      }
    },
    setScore(e) {
      const score = e.target.innerHTML;
      this.curGame.score = score;
      ajax(
        "/games",
        "PUT",
        { data: { game: this.curGame } }
      );
      this.curGame = null; //in case of
    },
    setElo(value) {
      this.newElo = value;
    },
    setLinkOrShowGame: function(g) {
      if ([g.player1, g.player2].includes(this.st.user.id))
        doClick("modalGamelink");
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
    },
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

.somethingnew
  background-color: #D2B4DE
</style>

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
        label(for="joinName") {{ st.tr["User name"] }}
        input#joinName(type="text" v-model="newPlayer.name")
      fieldset
        label(for="joinElo") {{ st.tr["Known rating"] }}
        input#joinElo(type="number" v-model="newPlayer.elo")
        label(for="joinEstimElo") {{ st.tr["Unknown rating:"] }}
        select#joinEstimElo(v-model="newPlayer.elo")
          option(value="1200") Beginner
          option(value="1500") Intermediate
          option(value="1800") Good player
          option(value="2100") Expert
          option(value="2400") Master
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
        input#gamelink(type="text" v-model="curGame.gameLink")
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
      span.clickable(onClick="window.doClick('modalTinfos')")
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
          | {{ Confirm }}
        button#joinBtn(
          v-if="showJoinButton()"
          onClick="window.doClick('modalJoin')"
        )
          | {{ st.tr["Join"] }}
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
              @click="tryActionPlayer(p)"
              @contextmenu="tryShowDeleteBox(p)"
              :class="{quit: p.quit}"
            )
              td {{ p.firstName + " " + p.lastName }}
              td {{ p.name }}
              td {{ p.elo }}
              td {{ p.club }}
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
                td {{ nameAndScore(exempts[rounds.length-1]) }}
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
            span#countdown
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
      scores: {}, //current results
      exempts: [],
      finalGrid: null,
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
        this.st.user.id > 0 &&
        !Object.keys(this.players).includes(this.st.user.id.toString())
      );
    },
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
          countdown = this.tournament.dtstart - now;
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
                success: (res) => {
                  if (!res.players || res.players.length == 0) return;
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
                        res.players.forEach(p => {
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
        return;
      }
      const earlyRegistration =
        (Date.now() < this.tournament.dtstart - CONFIRM_WINDOW);
      const newPlayer =
        Object.assign({ quit: earlyRegistration }, this.newPlayer);
      const error = checkPlayer(newPlayer);
      if (!!error) {
        alert(error);
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
            uid: this.st.user.id,
            tid: this.tournament.id,
            quit: JSON.stringify(this.tournament.quit)
          }
        }
      );
    },
    tryShowDeleteBox: function(e, p) {
      if (this.st.user.id == p.uid) {
        e.preventDefault();
        if (confirm(this.st.tr["Withdraw from tournament?"])) {
          ajax(
            "/players",
            "DELETE",
            {
              data: { tid: this.tournament.id }
            }
          );
        }
      }
    },
    tryActionPlayer: function(p) {
      const admin = params.admin.includes(this.st.user.id);
      const targetSelf = (this.st.user.id == p.uid);
      if (this.tournament.completed || (!targetSelf && !admin)) {
        // Too late, or "unauthorized" user: no action to perform
        window.open(this.getProfileLink(p.name), "_blank");
      }
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
          let changeBan = false,
              changeQuit = false;
          if (p.ban) {
            if (!admin || !confirm("Unban player?")) return;
            p.ban = false;
            changeBan = true;
          }
          else if (admin && confirm("Ban player?")) {
            p.ban = true;
            changeBan = true;
          }
          if (!changeBan) {
            this.$set(this.players, p.uid,
              Object.assign(p, { quit: !p.quit }));
            changeQuit = true;
          }
          let data = { tid: this.tournament.id, uid: p.uid };
          if (changeQuit) data.quit = p.quit;
          if (changeBan) data.ban = p.ban;
          ajax(
            "/toggle",
            "PUT",
            { data: { banQuit: data } }
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
    scoreSymbToValues: function(score) {
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
    },
    increment: function(obj, field) {
      if (!obj[field]) obj[field] = 1;
      else obj[field]++;
    },
    // rounds[L-1] is supposed completed:
    computePairings: function() {
      let activePlayers =
        Object.keys(this.players).filter(k => this.players[k].active);
      let n = activePlayers.length;
      const L = this.rounds.length;
      let state = {};
      activePlayers.forEach(k => {
        state[k] = {
          met: {},
          score: 0,
          // NOTE: colors are used only if !tournament.bothcol
          colors: { W: 0, B: 0 },
          exempt: 0
        };
      });
      for (let i=0; i<L; i++) {
        if (!!this.exempts[i]) {
          state[this.exempts[i]].exempt++;
          state[this.exempts[i]].score++;
        }
        else {
          this.rounds[i].forEach(g => {
            const scores = this.scoreSymbToValues(g.score);
            state[g.player1].score += scores[0];
            state[g.player2].score += scores[1];
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
        activePlayers.forEach(p => {
          const scoreE =
            state[p.uid].exempt +
            // Divide by 2(4) * L to work with bothcol == true or not
            state[p.uid].score / (2 * L) +
            (1 - 1 / this.players[p.uid].elo) / (4 * L);
          if (scoreE < minScore) {
            minScore = scoreE;
            exempt = p.uid;
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
        const scoreI = state[activePlayers[i]].score;
        const eloI = this.players[activePlayers[i]].elo;
        for (let j=i+1; j < n; j++) {
          const scoreJ = state[activePlayers[j]].score;
          const eloJ = this.players[activePlayers[j]].elo;
          const distIJ =
            // 500: arbitrary value (should be greater than number of rounds)
            500 * state[activePlayers[i]].met[activePlayers[j]] +
              Math.abs(scoreI - scoreJ) + 1 / (5 + Math.abs(eloI - eloJ));
          // Negative distance, because the algorithm maximize the cost
          edges.push([i, j, -distIJ]);
        }
      }
      const assignment = mwmatching3(edges, maxcardinality=true);

      // TODO: translate final part (adapt?)
//      assignment <- findPairing(distances)
//      assignment <- activePlayers[assignment]
//      pairing <- ""
//      alreadyPaired <- rep(F, n)
//      colors <- rep('B', n)
//      for (i in seq_along(assignment)) {
//        if (!alreadyPaired[activePlayers[i]]) {
//          # Color assignment: the player who had black the most takes white.
//          # In case of equality: random choice.
//          ordering <- c(activePlayers[i], assignment[i])
//          if (
//            state[[activePlayers[i]]]$colors[["N"]] <
//            state[[assignment[i]]]$colors[["N"]]
//          ) {
//            ordering <- c(assignment[i], activePlayers[i])
//          }
//          else if (
//            state[[activePlayers[i]]]$colors[["N"]] ==
//            state[[assignment[i]]]$colors[["N"]]
//          ) {
//            if (sample(2, 1) == 2) ordering <- c(assignment[i], activePlayers[i])
//          }
//          alreadyPaired[ordering[1]] <- T
//          alreadyPaired[ordering[2]] <- T
//          pairing <- paste0(
//            pairing,
//            tournament[ordering[1],"id"],
//            "[",
//            state[[ordering[1]]]$score,
//            "]",
//            " vs. ",
//            tournament[ordering[2],"id"],
//            "[",
//            state[[ordering[2]]]$score,
//            "]",
//            "\n"
//          )
//          if (ordering[1] == activePlayers[i]) colors[assignment[i]] <- 'N'
//          else colors[activePlayers[i]] <- 'N'
//        }
//      }
//      if (exempt >= 1) {
//        pairing <- paste0(
//          pairing,
//          tournament[exempt,"id"],
//          "[",
//          state[[exempt]]$score,
//          "] exempt\n"
//        )
//      }
//      # Print pairings
//      cat(pairing)
//      # Also output the permutation in a human+machine readable way
//      if (exempt >= 1) {
//        activePlayers <- c(activePlayers, exempt)
//        assignment <- c(assignment, exempt)
//      }
//      list(cbind(activePlayers, assignment), colors[activePlayers])

      this.rounds.push(pairing.round);
      this.exempts.push(pairing.exempt || null);
    },
    // TODO:
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
      // + finalGrid.rounds[i][j].url contient les gameLinks
      // (si dispo, sinon pas de lien) [ + .value ]
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
      if (this.st.user.id > 0) {
        this.send("newchat", { data: chat });
        ajax(
          "/chats",
          "POST",
          { data: chat }
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

button#joinBtn, button#confirmBtn
  display: block
  margin: 0 auto

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

.somethingnew
  background-color: #D2B4DE
</style>

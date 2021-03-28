<template lang="pug">
main
  input#modalTinfos.modal(type="checkbox")
  div#tinfosWrap(
    role="dialog"
    data-checkbox="modalTinfos"
  )
    .card
      label.modal-close(for="modalTinfos")
      #tournamentInfos
        p {{ st.tr["Variant"] }} : {{ tournament.variant }}
        p {{ st.tr["Cadence"] }} : {{ tournament.cadence }}
        p {{ tournament.nbRounds }} {{ st.tr["rounds"] }}
        p(v-if="tournament.allRounds") {{ st.tr["All rounds"] }}
        p(v-if="tournament.bothcol") {{ st.tr["Round trip"] }}
  input#modalJoin.modal(type="checkbox")
  div#joinWrap(
    role="dialog"
    data-checkbox="modalJoin"
  )
    .card
      label.modal-close(for="modalJoin")
      fieldset
        label(for="joinElo") {{ st.tr["Known rating"] }}
        input#joinElo(
          type="number"
          v-model="newPlayer.elo"
          @keyup.enter="re_joinTournament()")
        label(for="joinEstimElo") {{ st.tr["Unknown rating:"] }}
        select#joinEstimElo(v-model="newPlayer.elo")
          option(value="1200") {{ st.tr["Beginner"] }}
          option(value="1500") {{ st.tr["Intermediate"] }}
          option(value="1800") {{ st.tr["Advanced"] }}
          option(value="2100") {{ st.tr["Expert"] }}
          option(value="2400") {{ st.tr["Master"] }}
      fieldset
        button.center-btn(@click="re_joinTournament()") {{ st.tr["Send"] }}
  input#modalGamelink.modal(type="checkbox")
  div#gamelinkWrap(
    role="dialog"
    data-checkbox="modalGamelink"
  )
    .card
      label.modal-close(for="modalGamelink")
      fieldset
        label(for="gamelink") {{ st.tr["Game link"] }}
        input#gamelink(
          type="text"
          v-model="curGame.glink"
          @keyup.enter="setGamelink()")
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
          button.white-win(v-if="!tournament.bothcol") 1-F
          button.white-win(v-else) 2-F
          button.draw F-F
          button.black-win(v-if="!tournament.bothcol") F-1
          button.black-win(v-else) F-2
  .row
    #aboveTour.col-sm-12
      h4#tournamentTitle(onClick="window.doClick('modalTinfos')")
        | {{ tournament.title }}
      button#chatBtn(
        @click="chatBtnClick"
        aria-label="Chat"
      )
        | Chat
        img(src="../assets/chat.svg")
  .row
    .left(v-show="chatVisible")
      Chat(
        ref="chatcomp"
        :pastChats="chats"
        @mychat="processChat"
        @chatcleared="chats = []")
    .right(:class="{fullwidth: !chatVisible}")
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
              th {{ st.tr["Username"] }}
              th Elo
          tbody
            tr(
              v-for="p in sortedPlayers()"
              @click.left="tryActionPlayer(p,'quit')"
              @click.middle="tryAdminEdit($event,p)"
              @contextmenu="tryShowDeleteBox($event,p)"
              :class="{quit: p.quit, ban: p.ban}"
            )
              td {{ p.name }}
              td {{ p.elo }}
      div(v-show="display=='tournament'")
        div(v-if="tournament.stage == 4")
          table(v-if="!!finalGrid")
            thead
              tr
                th Pl
                th {{ st.tr["Username"] }}
                th Elo
                th(v-for="(r,i) in rounds") {{ "R" + (i+1) }}
                th {{ st.tr["Score"] }}
                th TB
                th Perf
            tbody
              tr(v-for="(p,i) in finalGrid.ranking")
                td {{ i + 1 }}
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
        div(v-else-if="tournament.stage == 3")
          h3(v-if="rounds.length >= 1")
            | {{ st.tr["Round"] + " " + rounds.length }}
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
                // TODO: should be "challengeOpp", not "try",
                // checking if "isMyGame" first (and our line appear on top?)
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
          div#endRoundAction(v-if="tournament.stage == 3 && roundCompleted()")
            button(
              v-if="rounds.length > 0 && !tournament.frozen"
              @click="freezeResults()"
            )
              | {{ st.tr["Freeze results"] }}
            div(v-else-if="rounds.length < tournament.nbRounds")
              button(@click="computePairings()")
                | {{ st.tr["Next round"] }}
              fieldset
                label(for="nextVariant") {{ st.tr["Variant"] }}
                input#nextVariant(
                  type="text"
                  v-model="nextValues.variant")
                br
                label(for="nextCadence") {{ st.tr["Cadence"] }}
                input#nextCadence(
                  type="text"
                  v-model="nextValues.cadence")
                br
                label(for="nextBothcol") {{ st.tr["Two games"] }}
                input#nextBothcol(
                  type="checkbox"
                  v-model="nextValues.bothcol")
            button(
              v-if="rounds.length > 0 && tournament.frozen"
              @click="finishTournament()"
            )
              | {{ st.tr["Finish tournament"] }}
        div(v-else)
          button#nextStageBtn(
            v-if="tournament.stage <= 2 && isAdmin"
            @click="gotoNextStage()"
          )
            | {{ st.tr[nextStageText()] }}
          #centerTime(v-if="Date.now() / 1000 < tournament.dtstart")
            p {{ st.tr["Estimated time before start:"] }}
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
let countdown = 0;
export default {
  name: "my-tournament",
  components: { Chat },
  data: function() {
    return {
      st: store.state,
      tournament: {},
      nextValues: {},
      players: {},
      chats: [],
      chatVisible: true,
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
      if (to.path.lastIndexOf('/') != from.path.lastIndexOf('/'))
        // Page change
        this.cleanBeforeDestroy();
      else if (from.params["id"] != to.params["id"]) {
        // Change everything:
        this.cleanBeforeDestroy();
        this.atCreation();
      }
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
  },
  beforeDestroy: function() {
    this.cleanBeforeDestroy();
  },
  computed: {
    isAdmin: function() {
      return params.admin.includes(this.st.user.id);
    }
  },
  methods: {
    showConfirmButton: function() {
      return (
        this.st.user.id > 0 &&
        Object.keys(this.players).includes(this.st.user.id.toString()) &&
        !!this.players[this.st.user.id].quit &&
        this.tournament.stage == 1
      );
    },
    showJoinButton: function() {
      return (
        this.st.user.id > 0 &&
        !Object.keys(this.players).includes(this.st.user.id.toString()) &&
        (
          !this.tournament.allRounds ||
          Object.values(this.players).filter(v => !v.ban).length
            <= this.tournament.nbRounds
        )
        && this.tournament.stage <= 3
      );
    },
    chatBtnClick: function() {
      this.chatVisible = !this.chatVisible;
      if (this.chatVisible) {
        // Entering chat
        this.$nextTick(() => document.getElementById("inputChat").focus());
        document.getElementById("chatBtn").classList.remove("somethingnew");
      }
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
    nextStageText: function() {
      switch (this.tournament.stage) {
        case 0: return "Start pointing";
        case 1: return "End pointing";
        case 2: return "Start tournament";
      }
      return ""; //never reached
    },
    gotoNextStage: function() {
      this.$set(this.tournament, "stage", this.tournament.stage + 1);
      if (this.tournament.stage == 3) {
        this.computePairings();
        this.setDisplay('tournament');
      }
      ajax(
        "/toggle_state",
        "PUT",
        {
          data: {
            tid: this.tournament.id,
            stage: this.tournament.stage
          }
        }
      );
      this.send(
        "tournament-state", { data: { stage: this.tournament.stage } });
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
        if (this.tournament.stage >= 3)
          // Tournament running or completed: focus on tournament
          this.display = "tournament";
        const now = Math.round(Date.now() / 1000);
        if (this.tournament.stage <= 2 && now < this.tournament.dtstart) {
          this.$nextTick(
            () => {
              countdown = this.tournament.dtstart - now;
              let remainingTime = document.getElementById("countdown");
              remainingTime.innerHTML = ppt(countdown, this.st.tr);
              this.timer = setInterval(
                () => {
                  if (--countdown <= 0) clearInterval(this.timer);
                  else remainingTime.innerHTML = ppt(countdown, this.st.tr);
                },
                1000
              );
            }
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
                res.users.forEach(u => chatIds[u.id] = u.name);
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
            this.nextValues = {
              variant: res.tournament.variant,
              cadence: res.tournament.cadence,
              bothcol: res.tournament.bothcol
            };
            if (res.tournament.stage == 4) this.chatVisible = false;
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
                        res3.users.forEach(u => { users[u.id] = u.name; });
                        res2.players.forEach(p => {
                          this.$set(this.players, p.uid,
                            {
                              name: users[p.uid],
                              elo: p.elo,
                              quit: p.quit,
                              ban: p.ban
                            }
                          );
                        });
                        playersRetrieved = true;
                        if (chatsRetrieved) fillChatNames();
                        if (scoresComputed && this.tournament.stage == 4)
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
                        if (playersRetrieved && this.tournament.stage == 4)
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
        .sort((p1,p2) => { p1.name.localeCompare(p2.name); });
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
      const error = checkPlayer(this.newPlayer);
      if (!!error) {
        alert(this.st.tr[error]);
        return;
      }
      document.getElementById("modalJoin").checked = false;
      this.newPlayer.id  = this.newPlayer.uid || this.st.user.id;
      if (Object.keys(this.players).some(k => k == this.newPlayer.id)) {
        // Edit mode: elo may have changed
        this.$set(this.players, this.newPlayer.id,
          Object.assign(this.players[this.newPlayer.id], this.newPlayer));
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
      // NOTE: redundant check, in case of.
      if (
        this.tournament.allRounds &&
        Object.values(this.players).filter(v => !v.ban).length
          == this.tournament.nbRounds + 1
      ) {
        return;
      }
      const earlyRegistration = (this.tournament.stage == 0);
      const lateRegistration = (this.tournament.stage >= 2);
      const newPlayer = Object.assign(
        { quit: earlyRegistration, ban: lateRegistration }, this.newPlayer);
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
                { name: this.st.user.name },
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
                name: this.st.user.name
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
    tryAdminEdit: function(e, p) {
      e.preventDefault();
      if (
        this.tournament.stage < 3 &&
        params.admin.includes(this.st.user.id)
      ) {
        // No need for player name: already in this.players
        this.newPlayer = {
          uid: p.uid,
          elo: p.elo
        };
        doClick("modalJoin");
      }
    },
    tryShowDeleteBox: function(e, p) {
      if (this.st.user.id == p.uid && this.tournament.stage <= 1) {
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
    tryActionPlayer: function(p, action) {
      const admin = params.admin.includes(this.st.user.id);
      const targetSelf = (this.st.user.id == p.uid);
      if (this.tournament.stage == 4 || (!targetSelf && !admin))
        // Tournament is over, or unauthorized
        return;
      if (this.tournament.stage <= 1 && targetSelf) {
        // No need for name: self join
        this.newPlayer = { elo: p.elo };
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
    },
    tryChallengeOpp: function(g) {
      let opp = null,
          color = '';
      if (g.player1 == this.st.user.id) {
        opp = this.players[g.player2].name;
        color = 'w';
      }
      else if (g.player2 == this.st.user.id) {
        opp = this.players[g.player1].name;
        color = 'b';
      }
      if (!!opp) {
        const queryString =
          "challenge=" + opp + "&" +
          "color=" + color + "&" +
          "variant=" + this.tournament.variant + "&" +
          "cadence=" + this.tournament.cadence.replace('+', '%2B');
        window.open("https://vchess.club/#/?" + queryString, "_blank");
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
      if (this.rounds.length < this.tournament.nbRounds) {
        if (!confirm("End tournament?")) return;
        // Early stop: adjust nbRounds on server:
        ajax(
          "/early_end",
          "PUT",
          {
            data: {
              tid: this.tournament.id,
              nbRounds: this.rounds.length
            }
          }
        );
        this.$set(this.tournament, "nbRounds", this.rounds.length);
      }
      this.$set(this.tournament, "frozen", false);
      this.$set(this.tournament, "stage", 4);
      ajax(
        "/toggle_state",
        "PUT",
        {
          data: {
            tid: this.tournament.id,
            frozen: false,
            stage: 4
          }
        }
      );
      this.send("tournament-state", { data: { frozen: false, stage: 4 } });
      this.computeFinalGrid();
    },
    increment: function(obj, field, by) {
      if (by === undefined) by = 1;
      if (!obj[field]) obj[field] = by;
      else obj[field] += by;
    },
    scoreSymbToValues: function(score) {
      switch (score) {
        case "1-0": return [1, 0];
        case "1/2": return [0.5, 0.5];
        case "0-1": return [0, 1];
        case "1-F": return [1, 0];
        case "F-1": return [0, 1];
        case "2-F": return [2, 0];
        case "F-2": return [0, 2];
        case "F-F": return [0, 0];
        case "+2": return [2, 0];
        case "+1": return [1.5, 0.5];
        case "=": return [1, 1];
        case "-1": return [0.5, 1.5];
        case "-2": return [0, 2];
      }
      return []; //never reached
    },
    computeScores: function() {
      // Use current rounds state to get cumulated scores:
      let L = this.rounds.length;
      if (
        L >= 1 &&
        (this.tournament.frozen || this.rounds[L-1].some(g => !g.score))
      ) {
        L--;
      }
      let maxPoints = 0;
      if (L > 0) {
        // Preliminary computation: how many points maximum?
        for (const g of this.rounds[L-1]) {
          maxPoints = this.score2TotalPoints(g.score);
          if (maxPoints >= 1) break;
        }
      }
      let scores = {};
      for (let i=0; i<L; i++) {
        if (!!this.exempts[i])
          this.increment(scores, this.exempts[i], maxPoints);
        this.rounds[i].forEach(g => {
          const sc = this.scoreSymbToValues(g.score);
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
      let activePlayers =
        Object.keys(this.players).filter(k => {
          return (
            (!this.players[k].quit || this.tournament.allRounds) &&
            !this.players[k].ban
          );
        });
      let n = activePlayers.length;
      if (n <= 1) {
        alert(this.st.tr["Not enough players"]);
        return;
      }
      let objDiff = {};
      Object.keys(this.nextValues).forEach(val => {
        if (this.nextValues[val] != this.tournament[val])
          objDiff[val] = this.nextValues[val];
      });
      if (Object.keys(objDiff).length > 0) {
        ajax(
          "/light_tupdate",
          "PUT",
          {
            data: {
              tid: this.tournament.id,
              tupdate: objDiff
            }
          }
        );
        this.send("tournament-update", { data: objDiff });
      }
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
        if (!!this.exempts[i]) state[this.exempts[i]].exempt++;
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
        if (this.tournament.allRounds) exempt = L - 1;
        else {
          let minScore = Infinity;
          activePlayers.forEach(k => {
            const scoreE =
              state[k].exempt +
              (this.scores[k] + 1 - 1 / this.players[k].elo) / (2 * L + 1);
            if (scoreE < minScore) {
              minScore = scoreE;
              exempt = k;
            }
          });
        }
        pairing.exempt = exempt;
        const aIdx = activePlayers.findIndex(p => p == exempt);
        activePlayers.splice(aIdx, 1);
        n--;
      }
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
              player1: parseInt(pair[0], 10),
              player2: parseInt(pair[1], 10)
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
                  player: parseInt(pairing.exempt, 10)
                }
              }
            }
          );
        }
        this.send("pairing", { data: pairing });
      };
      // Compute distances (half) matrix for core pairing algorithm
      let edges = [];
      for (let i=0; i < n - 1; i++) {
        const scoreI = this.scores[activePlayers[i]];
        const eloI = this.players[activePlayers[i]].elo;
        for (let j=i+1; j < n; j++) {
          if (
            this.tournament.allRounds &&
            !!state[activePlayers[i]].met[activePlayers[j]]
          ) {
            // If allRounds, each player meets exactly once every other
            continue;
          }
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
      //const assignment = maxWeightMatching(edges, true);
      maxWeightMatching(edges, finishPairings);
    },
    score2TotalPoints: function(score) {
      if (score == "F-F") return 0;
      if (["1-0", "0-1", "1/2", "1-F", "F-1"].includes(score)) return 1;
      return 2;
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
          case "2-F": return (c == 'W' ? '>>' : '<<');
          case "F-2": return (c == 'W' ? '<<' : '>>');
          case "F-F": return '<>';
        }
        return ""; //never reached
      };
      this.computeScores();
      const n = Object.keys(this.players).length;
      const L = this.rounds.length;
      let met = {};
      Object.keys(this.players).forEach(uid => met[uid] = {});
      let totalPoints = 0;
      let totPoints = []; //per round (may be variable)
      for (let i=0; i<L; i++) {
        let points = -1;
        this.rounds[i].forEach(g => {
          // Forfeit doesn't count:
          if (g.score.indexOf('F') == -1) {
            this.increment(met[g.player1], g.player2);
            this.increment(met[g.player2], g.player1);
          }
          if (points <= 0) points = this.score2TotalPoints(g.score);
        });
        totPoints.push(points);
        totalPoints += points;
      }
      let performance = {},
          tieBreak = {};
      // TODO: 10 here is very arbitrary
      const minP = 1 / (10 * totalPoints);
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
          const exPts =
            this.exempts.map((e,i) => e == uid ? totPoints[i] : 0)
            .reduce((x1, x2) => x1 + x2)
          success[uid] = (this.scores[uid] - exPts) / (totalPoints - exPts);
          if (success[uid] == 0) success[uid] = minP;
          else if (success[uid] == 1) success[uid] = 1 - minP;
          const delta = -400 * Math.log10(1 / success[uid] - 1);
          performance[uid] = perf + delta;
        }
      });
      // Compute tie break:
      let totGames = {};
      Object.keys(this.players).forEach(uid => {
        const pMet = Object.keys(met[uid]);
        totGames[uid] = 0;
        if (pMet.length == 0) tieBreak[uid] = 0;
        else {
          let tb = 0;
          pMet.forEach(m => {
            tb += met[uid][m] * success[m];
            totGames[uid] += met[uid][m];
          });
          tieBreak[uid] = tb / totGames[uid];
        }
      });
      // Now add winning rate (useful if round-robin)
      for (let i=0; i<L; i++) {
        this.rounds[i].forEach(g => {
          const scVal = this.scoreSymbToValues(g.score);
          const avgPts = totPoints[i] / 2;
          if (scVal[0] > avgPts)
            tieBreak[g.player1] += 1.0 / totGames[g.player1];
          else if (scVal[1] > avgPts)
            tieBreak[g.player2] += 1.0 / totGames[g.player2];
        });
      }
      // Now rank players and fill variables
      let pids = Object.keys(this.players).sort((p1,p2) => {
        if (
          [null, undefined].includes(this.scores[p1]) &&
          [null, undefined].includes(this.scores[p2])
        ) {
          return 0;
        }
        if ([null, undefined].includes(this.scores[p1])) return 1;
        if ([null, undefined].includes(this.scores[p2])) return -1;
        // Both players have a score, perf and tie-break (usual case)
        if (this.scores[p1] > this.scores[p2]) return -1;
        if (this.scores[p1] < this.scores[p2]) return 1;
        if (tieBreak[p1] > tieBreak[p2]) return -1;
        if (tieBreak[p1] < tieBreak[p2]) return 1;
        if (performance[p1] > performance[p2]) return -1;
        if (performance[p1] < performance[p2]) return 1;
        // At this stage, real ex-aequo: shouldn't happen much...
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
      let rank = {};
      for (let i=0; i<n; i++) rank[pids[i]] = i + 1;
      for (let i=0; i<L; i++) {
        this.rounds[i].forEach(g => {
          const [p1, p2] = [g.player1, g.player2];
          rounds[p1][i].url = g.glink;
          rounds[p2][i].url = g.glink;
          rounds[p1][i].value = scoreToSymbol(g.score, 'W') + rank[p2];
          if (totPoints[i] == 1) rounds[p1][i].value += 'W';
          rounds[p2][i].value = scoreToSymbol(g.score, 'B') + rank[p1];
          if (totPoints[i] == 1) rounds[p2][i].value += 'B';
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
                { body: "Pairings for round " + this.rounds.length }
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
          if (!this.chatVisible)
            document.getElementById("chatBtn").classList.add("somethingnew");
          break;
        }
        case "tournament-state": {
          const newState = data.data;
          if (newState.frozen !== undefined)
            this.$set(this.tournament, "frozen", newState.frozen);
          if (newState.stage !== undefined)
            this.$set(this.tournament, "stage", newState.stage);
          if (this.tournament.stage == 3) this.setDisplay('tournament');
          else if (this.tournament.stage == 4) this.computeFinalGrid();
          break;
        }
        case "tournament-update": {
          const newState = data.data;
          if (newState.variant !== undefined)
            this.$set(this.tournament, "variant", newState.variant);
          if (newState.cadence !== undefined)
            this.$set(this.tournament, "cadence", newState.cadence);
          if (newState.bothcol !== undefined)
            this.$set(this.tournament, "bothcol", newState.bothcol);
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

h3, h4
  text-align: center

h4
  display: inline-block
  font-weight: bold
  color: darkred

.left
  float: left
  background-color: var(--card-back-color)
  width: 25%
  @media screen and (max-width: 767px)
    width: 100%

.right
  float: left
  width: 75%
  @media screen and (max-width: 767px)
    width: 100%

.fullwidth
  width: 100%
  @media screen and (min-width: 768px)
    margin-left: 10%
    width: 80%

.center-btn
  display: block
  margin: 0 auto

#endRoundAction
  text-align: center
  margin-top: 5px

#nextStageBtn
  display: block
  margin: 15px auto

#joinWrap > .card, #gamelinkWrap > .card, #scoreWrap > .card
  max-width: 768px
  max-height: 100%

table
  //margin-bottom: 10px
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

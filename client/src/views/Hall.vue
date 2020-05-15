<template lang="pug">
main
  input#modalNewtour.modal(type="checkbox")
  #newtourDiv(
    role="dialog"
    data-checkbox="modalNewtour"
  )
    .card
      label.modal-close(for="modalNewtour")
      h3.section {{ st.tr["New tournament"] }}
      div(@keyup.enter="onSubmit()")
        fieldset
          label(for="t_dtstart") {{ st.tr["Start time"] }}
          input#t_dtstart(
            type="datetime-local"
            v-model="newtour.dtstart"
          )
        fieldset
          label(for="t_title") {{ st.tr["Title"] }}
          input#t_title(
            type="text"
            v-model="newtour.title"
          )
        fieldset
          label(for="t_website") {{ st.tr["Platform"] }}
          select#t_website(v-model="newtour.website")
            option(value="lichess") lichess.org
            option(value="vchess") vchess.club
        fieldset
          label(for="t_bothcol") {{ st.tr["Two games"] }}
          input#t_bothcol(
            type="checkbox"
            v-model="newtour.bothcol"
          )
        fieldset
          label(for="t_cadence") {{ st.tr["Cadence"] }}
          input#t_cadence(
            type="text"
            v-model="newtour.cadence"
          )
        fieldset
          label(for="t_nbRounds") {{ st.tr["Rounds count"] }}
          input#t_nbRounds(
            type="number"
            v-model="newtour.nbRounds"
          )
      button#submitBtn(@click="onSubmit()")
        | {{ st.tr["Send"] }}
  .row
    .col-sm-12.col-md-10.col-md-offset-1.col-lg-8.col-lg-offset-2
      .button-group
        button.tabbtn#pastTournaments(@click="setDisplay('past',$event)")
          | {{ st.tr["Finished tournaments"] }}
        button.tabbtn#currTournaments(@click="setDisplay('curr',$event)")
          | {{ st.tr["Tournaments in progress"] }}
        button.tabbtn#nextTournaments(@click="setDisplay('next',$event)")
          | {{ st.tr["Upcoming tournaments"] }}
      button#newTournamentBtn(
        v-if="isAdmin"
        @click="showNewTournamentModal()"
      )
        | {{ st.tr["New tournament"] }}
      TournamentList(
        v-show="display=='past'"
        :tournaments="pastTournaments"
      )
      // TODO: delete + edit options if admin, for current and next tournaments
      TournamentList(
        v-show="display=='curr'"
        :tournaments="currTournaments"
      )
      TournamentList(
        v-show="display=='next'"
        :tournaments="nextTournaments"
      )
      button#loadMoreBtn(
        v-show="hasMore"
        @click="loadMore()"
      )
        | {{ st.tr["Load more"] }}
</template>

<script>
import { store } from "@/store";
import { ajax } from "@/utils/ajax";
import { checkTournament } from "@/data/tournamentCheck";
import { processModalClick } from "@/utils/modalClick.js";
import params from "@/parameters";
import { getRandString } from "@/utils/alea";
import TournamentList from "@/components/TournamentList.vue";
export default {
  name: "my-hall",
  components: { TournamentList },
  data: function() {
    return {
      st: store.state,
      display: "",
      newtour: {},
      pastTournaments: [],
      currTournaments: [],
      nextTournaments: [],
      // timestamp of last showed (oldest) tournament:
      cursor: Number.MAX_SAFE_INTEGER,
      // hasMore == TRUE: a priori there could be more tournaments to load
      hasMore: true
    };
  },
  watch: {
    $route: function(to, from) {
      if (to.path != "/") this.cleanBeforeDestroy();
    }
  },
  computed: {
    isAdmin: function() {
      return params.admin.includes(this.st.user.id);
    },
  },
  created: function() {
    window.addEventListener("beforeunload", this.cleanBeforeDestroy);
  },
  mounted: function() {
    this.setDisplay(localStorage.getItem("disp-hall") || "curr");
    document.getElementById("newtourDiv")
      .addEventListener("click", processModalClick);
    ajax(
      "/tournaments",
      "GET",
      {
        success: (res) => {
          res.tournaments.forEach(t => {
            if (t.stage <= 1) this.nextTournaments.push(t);
            else this.currTournaments.push(t);
          });
        }
      }
    );
    // And past tournaments as well:
    this.loadMore();
  },
  beforeDestroy: function() {
    this.cleanBeforeDestroy();
  },
  methods: {
    cleanBeforeDestroy: function() {
      window.removeEventListener("beforeunload", this.cleanBeforeDestroy);
    },
    setDisplay: function(type, e) {
      this.display = type;
      localStorage.setItem("disp-hall", type);
      let elt =
        (!!e ? e.target : document.getElementById(type + "Tournaments"));
      elt.classList.add("active");
      for (let t of ["past","curr","next"]) {
        if (t != type) {
          document.getElementById(t + "Tournaments")
            .classList.remove("active");
        }
      }
    },
    showNewTournamentModal: function() {
      this.newtour = {
        dtstart: new Date().toISOString().slice(0, -8),
        title: "Tournament title",
        website: "lichess",
        bothcol: false,
        cadence: "3+2",
        nbRounds: 7
      };
      doClick("modalNewtour");
    },
    onSubmit: function() {
      let newTour = JSON.parse(JSON.stringify(this.newtour));
      newTour.dtstart = Date.parse(newTour.dtstart);
      const error = checkTournament(newTour);
      if (!!error) {
        alert(this.st.tr[error]);
        return;
      }
      else {
        ajax(
          "/tournaments",
          "POST",
          {
            data: { tournament: newTour },
            success: (ret) => {
              newTour.id = ret.id;
              this.nextTournaments.push(newTour);
              this.newtour = {};
              document.getElementById("modalNewtour").checked = false;
            }
          }
        );
      }
    },
    loadMore: function() {
      ajax(
        "/tournaments",
        "GET",
        {
          data: { cursor: this.cursor },
          success: (res) => {
            const L = res.tournaments.length;
            if (L > 0) {
              this.cursor = res.tournaments[L - 1].dtstart;
              this.pastTournaments =
                this.pastTournaments.concat(res.tournaments);
            }
            else this.hasMore = false;
          }
        }
      );
    }
  }
};
</script>

<style lang="sass" scoped>
[type="checkbox"].modal+div .card
  max-width: 500px
  max-height: 100%

.active
  color: #388e3c

.tabbtn
  background-color: #f9faee

button#loadMoreBtn, button#newTournamentBtn
  display: block
  margin: 0 auto
</style>

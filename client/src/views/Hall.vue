<template lang="pug">
main
  .row
    .col-sm-12.col-md-10.col-md-offset-1.col-lg-8.col-lg-offset-2
      .button-group
        button.tabbtn#pastTournaments(@click="setDisplay('past',$event)")
          | {{ st.tr["Pas tournaments"] }}
        button.tabbtn#currTournaments(@click="setDisplay('curr',$event)")
          | {{ st.tr["Running tournaments"] }}
        button.tabbtn#nextTournaments(@click="setDisplay('next',$event)")
          | {{ st.tr["Upcoming tournaments"] }}
      TournamentList(
        v-show="display=='past'"
        :tournaments="pastTournaments"
      )
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
  created: function() {
    window.addEventListener("beforeunload", this.cleanBeforeDestroy);
  },
  mounted: function() {
    this.display = localStorage.getItem("disp-hall") || "curr";
    ajax(
      "/tournaments",
      "GET",
      {
        success: (res) => {
          const now = Date.now();
          this.pasTournaments = [];
          res.tournaments.forEach(t => {
            if (t.dtstart < now) {
              if (t.completed) {
                this.pastTournaments.push(t);
                if (t.dtstart < this.cursor) this.cursor = t.dtstart;
              }
              else this.currTournaments.push(t);
            }
            else this.nextTournaments.push(t);
          });
        }
      }
    );
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
      let elt = (!!e ? e.target : document.getElementById(type + "Games"));
      elt.classList.add("active");
      for (let t of ["past","curr","next"]) {
        if (t != type)
          document.getElementById(t + "Tournaments").classList.remove("active");
      }
    },
    loadMore: function(type, cb) {
      ajax(
        "/tournaments",
        "GET",
        {
          data: { cursor: this.cursor },
          success: (res) => {
            const L = res.tournaments.length;
            if (L > 0) {
              this.cursor = res.tournaments[L - 1].dtstart;
              this.pastTournaments = this.pastTournaments.concat(res.tournaments);
            }
            else this.hasMore = false;
            if (!!cb) cb();
          }
        }
      );
    }
  }
};
</script>

<style lang="sass" scoped>
.active
  color: #388e3c

.tabbtn
  background-color: #f9faee

button#loadMoreBtn
  display: block
  margin: 0 auto
</style>

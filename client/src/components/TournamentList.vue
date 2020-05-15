<template lang="pug">
div
  table(v-if="tournaments.length > 0")
    thead
      tr
        th {{ st.tr["Title"] }}
        th {{ st.tr["Cadence"] }}
        th {{ st.tr["Length"] }}
        th {{ st.tr["Start"] }}
    tbody
      tr(
        v-for="t in sortedTournaments()"
        @click="showTournament(t)"
      )
        td {{ t.title }}
        td {{ t.cadence }}
        td {{ t.nbRounds }}
        td {{ timestamp2datetime(t.dtstart) }}
  p(v-else)
    | {{ st.tr["No tournaments found :("] }}
</template>

<script>
import { store } from "@/store";
import { ajax } from "@/utils/ajax";
export default {
  name: "my-tournament-list",
  props: ["tournaments"],
  data: function() {
    return {
      st: store.state
    };
  },
  methods: {
    showTournament: function(t) {
      this.$router.push("/" + t.id);
    },
    sortedTournaments: function() {
      // Show in start time order:
      return (
        this.tournaments
        // "map" to avoid altering property (=> infinite loop)
        .map(t => t)
        .sort((t1, t2) => t2.dtstart - t1.dtstart)
      );
    },
    timestamp2datetime: function(ts) {
      return new Date(ts).toLocaleString();
      // Or next line (also replace regexp "\..*$" by "")
      //return new Date(ts).toISOString().replace("T"," ");
    }
  }
};
</script>

<style lang="sass" scoped>
table
  max-height: 100%

p
  text-align: center
  font-weight: bold
</style>

<template lang="pug">
div
  table(v-if="tournaments.length > 0")
    thead
      tr
        th {{ st.tr["Title"] }}
        th {{ st.tr["Variant"] }}
        th {{ st.tr["Cadence"] }}
        th {{ st.tr["Start time"] }}
    tbody
      tr(
        v-for="t in sortedTournaments()"
        @click.left="showTournament(t)"
        @click.middle="tryEmitEdit($event, t.id)"
        @contextmenu="tryEmitDelete($event, t.id)"
      )
        td {{ t.title }}
        td {{ t.variant }}
        td {{ t.cadence }}
        td {{ timestamp2datetime(t.dtstart) }}
  p(v-else)
    | {{ st.tr["No tournaments found :("] }}
</template>

<script>
import { store } from "@/store";
import { ajax } from "@/utils/ajax";
import params from "@/parameters";
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
    tryEmitEdit: function(e, tid) {
      if (!params.admin.includes(this.st.user.id)) return;
      e.preventDefault();
      this.$emit('edit-tour', tid);
    },
    tryEmitDelete: function(e, tid) {
      if (!params.admin.includes(this.st.user.id)) return;
      e.preventDefault();
      this.$emit('delete-tour', tid);
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
      return new Date(ts * 1000).toLocaleString();
      // Or next line (also replace regexp "\..*$" by "")
      //return new Date(ts * 1000).toISOString().replace("T"," ");
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

<template lang="pug">
div
  table(v-if="users.length > 0")
    thead
      tr
        th {{ st.tr["Last name"] }}
        th {{ st.tr["First name"] }}
        th {{ st.tr["License"] }}
        th {{ st.tr["Club"] }}
    tbody
      tr(
        v-for="u in sortedUsers()"
        @click="showActions(u)"
      )
        td {{ u.lastName }}
        td {{ u.firstName }}
        td {{ u.license }}
        td {{ u.club }}
  p(v-else)
    | {{ st.tr["No users found :("] }}
</template>

<script>
import { store } from "@/store";
import params from "@/parameters";
export default {
  name: "my-users",
  data: function() {
    return {
      st: store.state
    };
  },
  computed: {
    sortedUsers: function() {
      return (
        this.users
        .filter(u => u.active)
        .sort((u1, u2) => {
          if (u1.lname == u2.lname)
            return u1.firstName.localeCompare(u2.firstName);
          return u1.lastName.localeCompare(u2.lastName);
        })
      );
    }
  },
  methods: {
    showActions: function(u) {
      if (!(params.admin.includes(this.st.user.id))) return;
      // TODO: allow edit, delete, activate: re-using Upsertuser from App (how?)
    }
  }
};
</script>

<style lang="sass" scoped>
// TODO
</style>

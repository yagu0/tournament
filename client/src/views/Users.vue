<template lang="pug">
main
  .col-sm-12.col-md-8.col-md-offset-2.col-lg-6.col-lg-offset-3
    table(v-if="users.length > 0")
      thead
        tr
          th {{ st.tr["Last name"] }}
          th {{ st.tr["First name"] }}
          //th {{ st.tr["License"] }}
          th {{ st.tr["Club"] }}
      tbody
        tr(
          v-for="u in sortedUsers"
          @click="tryToggleActive(u)"
        )
          td {{ u.lastName }}
          td {{ u.firstName }}
          //td {{ u.license }}
          td {{ u.club }}
    p(v-else)
      | {{ st.tr["No users found :("] }}
</template>

<script>
import { store } from "@/store";
import { ajax } from "@/utils/ajax";
import params from "@/parameters";
export default {
  name: "my-users",
  data: function() {
    return {
      users: [],
      st: store.state
    };
  },
  mounted: function() {
    ajax(
      "/users",
      "GET",
      {
        success: (res) => {
          this.users = res.users;
        }
      }
    );
  },
  computed: {
    sortedUsers: function() {
      const admin = params.admin.includes(this.st.user.id);
      return (
        this.users
        .filter(u => admin || u.active)
        .sort((u1, u2) => {
          if (u1.lname == u2.lname)
            return u1.firstName.localeCompare(u2.firstName);
          return u1.lastName.localeCompare(u2.lastName);
        })
      );
    }
  },
  methods: {
    tryToggleActive: function(u) {
      if (
        !(params.admin.includes(this.st.user.id)) ||
        params.admin.includes(u.id)
      ) {
        return;
      }
      u.active = !u.active;
      ajax(
        "/de_activate",
        "PUT",
        {
          data: {
            id: u.id,
            active: u.active
          }
        }
      );
    }
  }
};
</script>

<style lang="sass" scoped>
// TODO
</style>

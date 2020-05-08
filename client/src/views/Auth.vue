<template lang="pug">
main
  .row
    .col-sm-12.col-md-10.col-md-offset-1.col-lg-8.col-lg-offset-2
      div(v-if="authOk")
        p {{ st.tr["Authentication successful!"] }}
</template>

<script>
import { store } from "@/store";
import { ajax } from "@/utils/ajax";
export default {
  name: "my-auth",
  data: function() {
    return {
      st: store.state,
      authOk: false
    };
  },
  created: function() {
    ajax(
      "/authenticate",
      "GET",
      {
        credentials: true,
        data: { token: this.$route.params["token"] },
        success: (res) => {
          this.authOk = true;
          this.st.user.id = res.id;
          this.st.user.firstName = res.firstName;
          this.st.user.lastName = res.lastName;
          this.st.user.email = res.email;
          this.st.user.notify = res.notify;
          this.st.user.active = res.active;
          if (!res.active) {
            alert(
              this.st.tr["Account not activated yet: please wait a few hours"]
            );
          }
          localStorage["myname"] = res.name;
          localStorage["myid"] = res.id;
        }
      }
    );
  }
};
</script>

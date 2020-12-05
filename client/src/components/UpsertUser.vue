<template lang="pug">
div
  input#modalUser.modal(
    type="checkbox"
    @change="trySetEnterTime($event)"
  )
  #upsertDiv(
    role="dialog"
    data-checkbox="modalUser"
  )
    .card
      label.modal-close(for="modalUser")
      h3.section
        span.title {{ st.tr[stage] }}
        span.link(
          v-if="stage=='Update'"
          @click="doLogout()"
        )
          | {{ st.tr["Logout"] }}
          img(src="../assets/rightArrow.svg")
      div(@keyup.enter="onSubmit()")
        fieldset
          label(for="u_useremail") {{ st.tr["Email"] }} *
          input#u_useremail(
            type="email"
            v-model="user.email"
          )
        fieldset(v-show="stage=='Update'")
          label(for="notifyNew") {{ st.tr["Notifications by email"] }}
          input#notifyNew(
            type="checkbox"
            v-model="user.notify"
          )
      button#submitBtn(@click="onSubmit()")
        | {{ st.tr[submitMessage] }}
      #dialog.text-center {{ st.tr[infoMsg] }}
</template>

<script>
import { store } from "@/store";
import { checkEmail } from "@/data/userCheck";
import { ajax } from "@/utils/ajax";
import { processModalClick } from "@/utils/modalClick.js";
export default {
  name: "my-upsert-user",
  data: function() {
    return {
      logStage: "Login", //or Update
      infoMsg: "",
      st: store.state,
      user: {}
    };
  },
  mounted: function() {
    document.getElementById("upsertDiv")
      .addEventListener("click", processModalClick);
  },
  computed: {
    submitMessage: function() {
      switch (this.stage) {
        case "Login":
          return "Go";
        case "Update":
          return "Apply";
      }
      return "Never reached";
    },
    stage: function() {
      return this.st.user.id > 0 ? "Update" : this.logStage;
    }
  },
  methods: {
    trySetEnterTime: function(event) {
      if (event.target.checked) {
        this.infoMsg = "";
        document.getElementById("u_useremail").focus();
        this.user = JSON.parse(JSON.stringify(this.st.user));
      }
    },
    ajaxUrl: function() {
      switch (this.stage) {
        case "Login":
          return "/sendtoken";
        case "Update":
          return "/update";
      }
      return "Never reached";
    },
    ajaxMethod: function() {
      switch (this.stage) {
        case "Login":
          return "GET";
        case "Update":
          return "PUT";
      }
      return "Never reached";
    },
    infoMessage: function() {
      switch (this.stage) {
        case "Login":
          return "Connection token sent. Check your emails!";
        case "Update":
          return "Modifications applied!";
      }
      return "Never reached";
    },
    onSubmit: function() {
      let error = checkEmail(this.user.email);
      if (error) {
        alert(this.st.tr[error]);
        return;
      }
      this.infoMsg = "Processing... Please wait";
      ajax(
        this.ajaxUrl(),
        this.ajaxMethod(),
        {
          credentials: true,
          data: (
            this.stage == "Login"
              ? { email: this.user.email }
              : { user: this.user }
          ),
          success: () => {
            this.infoMsg = this.infoMessage();
            if (this.stage == "Login") this.user = {};
            else this.st.user = JSON.parse(JSON.stringify(this.user));
          },
          error: (err) => {
            this.infoMsg = "";
            alert(err);
          }
        }
      );
    },
    doLogout: function() {
      document.getElementById("modalUser").checked = false;
      this.$router.push("/logout");
    }
  }
};
</script>

<style lang="sass" scoped>
[type="checkbox"].modal+div .card
  max-width: 450px
  max-height: 100%

h3.section
  span.title
    padding-right: 10px
  span.link
    color: darkred
    font-size: 0.8em
    text-decoration: underline
    cursor: pointer
    img
      height: 1em
      padding-left: 5px

#submitBtn
  width: 50%
  margin: 0 auto

#dialog
  padding: 5px
  color: blue
</style>

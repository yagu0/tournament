<template lang="pug">
#app
  UpsertUser
  Language
  .container
    .row
      .col-sm-12.col-md-10.col-md-offset-1.col-lg-8.col-lg-offset-2
        // Menu (top of page):
        // Left: tournaments(hall), users
        // Right: usermenu
        nav
          label.drawer-toggle(for="drawerControl")
          input#drawerControl.drawer(type="checkbox")
          #menuBar(@click="hideDrawer($event)")
            label.drawer-close(for="drawerControl")
            #leftMenu
              router-link(to="/")
                | {{ st.tr["Tournaments"] }}
              router-link(to="/users")
                | {{ st.tr["Users"] }}
            #rightMenu
              .clickable(onClick="window.doClick('modalUser')") {{ userName }}
              .clickable(onClick="doClick('modalLang')")
                | {{ st.tr["Language"] }}
    router-view
  .row
    .col-sm-12.col-md-10.col-md-offset-1.col-lg-8.col-lg-offset-2
      footer
        router-link.menuitem(to="/faq") F.A.Q.
        a.menuitem(href="https://github.com/yagu0/tournament")
          span {{ st.tr["Code"] }}
          img(src="./assets/github.svg")
</template>

<script>
import UpsertUser from "@/components/UpsertUser.vue";
import Language from "@/components/Language.vue";
import { store } from "@/store.js";
import { ajax } from "@/utils/ajax.js";
export default {
  components: {
    UpsertUser,
    Language
  },
  data: function() {
    return {
      st: store.state
    };
  },
  computed: {
    userName: function() {
      return (
        this.st.user.id > 0
          ? this.st.user.firstName + " " + this.st.user.lastName
          : "Login"
      );
    }
  },
  methods: {
    hideDrawer: function(e) {
      e.preventDefault(); //TODO: why is this needed?
      document.getElementsByClassName("drawer")[0].checked = false;
    }
  }
};
</script>

<style lang="sass">
html, *
  font-family: "Open Sans", Arial, sans-serif
  --a-link-color: darkred
  --a-visited-color: darkred
  --card-back-color: #f4f6f6
  --button-back-color: #d1d5d5
  --table-body-back-color: #f8f8f8

body
  padding: 0
  min-width: 320px
  --fore-color: #1c1e10 //#2c3e50
  //--back-color: #f2f2f2
  background-image: radial-gradient(white, #e6e6ff) //lavender)

#app
  -webkit-font-smoothing: antialiased
  -moz-osx-font-smoothing: grayscale

.container
  // 45px is footer height
  min-height: calc(100vh - 45px)
  overflow: hidden
  padding: 0
  margin: 0

.row > div
  padding: 0

a
  text-decoration: underline

header
  width: 100%
  display: flex
  align-items: center
  justify-content: center
  margin: 0 auto

.clickable
  cursor: pointer

.text-center
  text-align: center

.bold
  font-weight: bold

.clearer
  clear: both

.button-group
  margin: 0

input[type="checkbox"]:focus
  outline: 0

input[type=checkbox]:checked:before
  top: -5px
  height: 18px

table
  display: block
  padding: 0
  tr > td
    cursor: pointer
  th, td
    padding: 5px

@media screen and (max-width: 767px)
  table
    tr > th, td
      font-size: 14px

nav
  width: 100%
  margin: 0
  padding: 0
  & > #menuBar
    width: 100%
    padding: 0
    @media screen and (min-width: 768px)
      & > #leftMenu
        padding: 0
        width: 50%
        display: inline-flex
        align-items: center
        justify-content: flex-start
        & > a
          display: inline-block
          text-decoration: none
          color: #2c3e50
          &.router-link-exact-active
            color: #388e3c
      & > #rightMenu
        padding: 0
        width: 50%
        display: inline-flex
        align-items: center
        justify-content: flex-end
        & > div
          display: inline-block
    @media screen and (max-width: 767px)
      & > #leftMenu
        margin-top: 42px
        padding-bottom: 5px
        & > a
          text-decoration: none
          color: #2c3e50
          &.router-link-exact-active
            color: #388e3c
      & > #rightMenu
        padding-top: 5px
        border-top: 1px solid darkgrey

@media screen and (max-width: 767px)
  nav
    height: 42px
    border: none
    & > label.drawer-toggle
      cursor: pointer
      position: absolute
      top: 0
      left: 5px
      line-height: 42px
      height: 42px
      padding: 0
    & > label.drawer-toggle:before
      font-size: 42px
    & > #menuBar
      z-index: 5000 //to hide currently selected piece if any

[type="checkbox"].drawer+*
  right: -767px

[type=checkbox].drawer+* .drawer-close
  top: 0
  left: 5px
  padding: 0
  height: 50px
  width: 50px
  line-height: 50px

[type=checkbox].drawer+* .drawer-close:before
  font-size: 50px

@media screen and (max-width: 767px)
  .button-group
    flex-direction: row
    button:not(:first-child)
      border-left: 1px solid var(--button-group-border-color)
      border-top: 0

footer
  display: inline-flex
  justify-content: center
  align-items: center
  height: 45px
  border: 1px solid #ddd
  box-sizing: border-box
  //background-color: #000033
  font-size: 1rem
  width: 100%
  padding: 0
  & > .menuitem
    margin: 0 12px
    display: inline-flex
    align-self: center
    &:link
      color: #2c3e50
      text-decoration: none
    &:visited, &:hover
      color: #2c3e50
      text-decoration: none
    & > img
      display: inline-block
      height: 1.3em
      margin: 0 5px
    &.router-link-exact-active
      color: #388e3c

@media screen and (max-width: 767px)
  footer
    border: none
</style>

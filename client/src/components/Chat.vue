<template lang="pug">
div
  input#inputChat(
    type="text"
    :placeholder="st.tr['Chat here']"
    @keyup.enter="sendChat()"
    @contextmenu="confirmClear($event)"
  )
  p(v-for="chat in chats.concat(pastChats)")
    span.name {{ chat.name }} :&nbsp;
    span(
      :class="classObject(chat)"
      v-html="chat.msg"
    )
</template>

<script>
import { store } from "@/store";
export default {
  name: "my-chat",
  // Prop pastChats for stored chats on server
  props: ["pastChats"],
  data: function() {
    return {
      st: store.state,
      chats: [] //chat messages after human game
    };
  },
  methods: {
    classObject: function(chat) {
      return {
        "my-chatmsg": !!this.st.user.name && chat.name == this.st.user.name
      };
    },
    sendChat: function() {
      if (!this.st.user.name) {
        alert("Only registered users can chat");
        return;
      }
      let chatInput = document.getElementById("inputChat");
      const chatTxt = chatInput.value.trim();
      chatInput.focus(); //required on smartphones
      if (chatTxt == "") return; //nothing to send
      chatInput.value = "";
      const chat = {
        msg: chatTxt,
        name: this.st.user.name
      };
      this.$emit("mychat", chat);
      this.chats.unshift(chat);
    },
    newChat: function(chat) {
      if (chat.msg != "") this.chats.unshift(chat);
    },
    confirmClear: function(e) {
      e.preventDefault();
      if (confirm(this.st.tr["Clear history"])) {
        this.chats = [];
        this.$emit("chatcleared");
      }
    }
  }
};
</script>

<style lang="sass" scoped>
#inputChat
  display: block
  margin: 0
  width: 100%

.name
  color: #839192

.my-chatmsg
  color: #6c3483
</style>

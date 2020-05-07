import Vue from "vue";
import App from "./App.vue";
import router from "./router";
import { store } from "./store";

Vue.config.productionTip = false;

new Vue({
  router,
  render: function(h) {
    return h(App);
  },
  created: function() {
    // Several interactions on clicks on elements:
    window.doClick = elemId => {
      document.getElementById(elemId).click();
    };
    // Esc key can close some modals:
    document.addEventListener("keydown", e => {
      if (e.code === "Escape") {
        let modalBoxes = document.querySelectorAll("[id^='modal']");
        modalBoxes.forEach(m => {
          if (
            m.checked &&
            !["modalAccept", "modalConfirm", "modalChat", "modalPeople"]
              .includes(m.id)
          ) {
            m.checked = false;
          }
        });
      }
    });
    store.initialize();
  }
}).$mount("#app");

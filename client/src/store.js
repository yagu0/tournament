// NOTE: do not use ajax() here because ajax.js requires the store
import params from "./parameters"; //for server URL

// Global store: see
// https://medium.com/fullstackio/managing-state-in-vue-js-23a0352b1c87
export const store = {
  state: {
    tr: {},
    user: {},
    lang: ""
  },
  initialize() {
    const headers = {
      "Content-Type": "application/json;charset=UTF-8",
      "X-Requested-With": "XMLHttpRequest"
    };
    // Quick user setup using local storage:
    const userStr = localStorage.getItem("user");
    this.state.user = (!!userStr ? JSON.parse(userStr) : {});
    // Slow verification through the server:
    // NOTE: still superficial identity usurpation possible, but difficult.
    fetch(
      params.serverUrl + "/whoami",
      {
        method: "GET",
        headers: headers,
        credentials: params.credentials
      }
    )
    .then(res => res.json())
    .then(json => {
      if (!json.id) localStorage.removeItem("user");
      else localStorage.setItem("user", JSON.stringify(json));
    });
    const supportedLangs = ["en", "es", "fr"];
    const navLanguage = navigator.language.substr(0, 2);
    this.state.lang =
      localStorage["lang"] ||
      (supportedLangs.includes(navLanguage) ? navLanguage : "en");
    this.setTranslations();
  },
  setTranslations: async function() {
    // Import translations from "./translations/$lang.js"
    const tModule = await import("@/translations/" + this.state.lang + ".js");
    this.state.tr = tModule.translations;
  },
  setLanguage(lang) {
    this.state.lang = lang;
    this.setTranslations();
  }
};

<template lang="pug">
div
  -
    var langName = {
      "en": "English",
      "es": "Español",
      "fr": "Français",
    };
  input#modalLang.modal(type="checkbox")
  #languageDiv(
    role="dialog"
    data-checkbox="modalLang"
  )
    .card
      label.modal-close(for="modalLang")
      fieldset
        label(for="langSelect") {{ st.tr["Language"] }}
        select#langSelect(@change="setLanguage($event)")
          each language,langCode in langName
            option(value=langCode selected=(lang==langCode))
              =language
</template>

<script>
import { store } from "@/store";
import { processModalClick } from "@/utils/modalClick.js";
export default {
  name: "my-language",
  data: function() {
    return {
      st: store.state
    };
  },
  mounted: function() {
    document.getElementById("languageDiv")
      .addEventListener("click", processModalClick);
  },
  methods: {
    setLanguage: function(e) {
      localStorage["lang"] = e.target.value;
      store.setLanguage(e.target.value);
    },
  }
};
</script>

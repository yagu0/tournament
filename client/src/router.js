import Vue from "vue";
import Router from "vue-router";

Vue.use(Router);

function loadView(view) {
  return () =>
    import(/* webpackChunkName: "view-[request]" */ `@/views/${view}.vue`);
}

const router = new Router({
  routes: [
    {
      path: "/",
      name: "hall",
      component: loadView("Hall")
    },
    {
      path: "/:id([0-9]+)",
      name: "tournament",
      component: loadView("Tournament")
    },
    {
      path: "/authenticate/:token",
      name: "authenticate",
      component: loadView("Auth")
    },
    {
      path: "/logout",
      name: "logout",
      component: loadView("Logout")
    },
    {
      path: "/faq",
      name: "faq",
      component: loadView("Faq")
    }
  ]
});

export default router;

import Vue from 'vue';
import Router from 'vue-router';
import Home from '@/components/home';
import Login from '@/components/login';
import assessments from '@/components/assessment/assessments';
import assessment from '@/components/assessment/view';
import ask from '@/components/assessment/ask';
import support from '@/components/assessment/support';
import About from '@/components/about';
import store from '@/store/index';

Vue.use(Router);

const router = new Router({
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home,
      meta: { Auth: false },
    },
    {
      path: '/signin',
      name: 'signin',
      component: Login,
      meta: { Auth: false },
    },
    {
      path: '/assessments',
      name: 'assessments',
      component: assessments,
      meta: { Auth: true },
    },
    {
      path: '/assessments/:id',
      name: 'view',
      component: assessment,
      meta: { Auth: true },
    },
    {
      path: '/ask',
      name: 'ask',
      component: ask,
      meta: { Auth: true },
    },
    {
      path: '/support/:id',
      name: 'support',
      component: support,
      meta: { Auth: true },
    },
    {
      path: '/about',
      name: 'about',
      component: About,
      meta: { Auth: false },
    },
  ],
});

router.beforeResolve((to, from, next) => {
  // if (to.name) {
  //   store.dispatch('loading', true);
  // }
  next();
});
router.afterEach((to, from) => {
  // store.dispatch('loading', false);
});

// router.beforeEach((to, from, next) => {
//   if (to.matched.some(record => record.meta.Auth)) {
//     // this route requires auth, check if logged in
//     // if not, redirect to login page.
//     store.dispatch('auth/checkAuth');
//     if (!store.getters['auth/isUserAuthenticated']) {
//       next({
//         path: '/signin',
//       });
//     } else {
//       next();
//     }
//   } else {
//     if (store.getters['auth/isUserAuthenticated'] && to.path === '/signin') {
//       next({
//         path: '/',
//       });
//     }
//     next(); // make sure to always call next()!
//   }
// });

export default router;

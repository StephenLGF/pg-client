import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'home', component: () => import('./views/Home.vue') },
    {
      path: '/connection/:connectionId',
      component: () => import('./views/ServerLayout.vue'),
      children: [
        { path: '', name: 'server', component: () => import('./views/Query.vue') },
        {
          path: 'database/:database',
          component: () => import('./views/DatabaseLayout.vue'),
          children: [
            { path: '', name: 'database', component: () => import('./views/Query.vue') },
            { path: 'schema/:schema', name: 'schema', component: () => import('./views/Query.vue') },
            { path: 'schema/:schema/table/:table', name: 'table', component: () => import('./views/Query.vue') },
            {
              path: 'table/:table',
              redirect: (to) => ({
                name: 'table',
                params: { ...to.params, schema: 'public' },
              }),
            },
          ],
        },
      ],
    },
  ],
})

export default router

import { createRouter, createWebHistory } from 'vue-router';
import { api } from './api';

export enum Routes {
  Main = '/',
  AuthLogin = '/auth/login',
  AuthRegister = '/auth/register',
}

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: Routes.Main,
      component: () => import('./layouts/DefaultLayout.vue'),
      meta: { requiresAuth: true },
      children: [{ path: '', component: () => import('./pages/MainPage.vue') }],
    },
    {
      path: '/auth',
      component: () => import('./layouts/AuthLayout.vue'),
      children: [
        { path: 'login', component: () => import('./pages/LoginPage.vue') },
        { path: 'register', component: () => import('./pages/RegisterPage.vue') },
      ],
    },
  ],
});

router.beforeEach(async (to) => {
  let user = null;

  try {
    user = await api.get('/auth/me');
  } catch {
    user = null;
  }

  if (to.meta.requiresAuth && !user) {
    return Routes.AuthLogin;
  }

  if (to.path.startsWith('/auth') && user) {
    return Routes.Main;
  }
});

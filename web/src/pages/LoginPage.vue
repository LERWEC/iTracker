<script setup lang="ts">
import { reactive } from 'vue';

const form = reactive({
  email: '',
  password: '',
});

const handleLogin = async () => {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(form),
    });

    console.log(res);
  } catch {
    console.error('Failed to login');
  }
};

const logout = async () => {
  try {
    const res = await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
    console.log(res);
  } catch {
    console.error('Failed to logout');
  }
};
</script>

<template>
  <p>Вход</p>
  <input type="email" v-model="form.email" placeholder="Email" />
  <input type="password" v-model="form.password" placeholder="Password" />
  <button @click="logout">Войти</button>
</template>

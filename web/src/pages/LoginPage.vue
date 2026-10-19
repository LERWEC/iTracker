<script setup lang="ts">
import { reactive } from 'vue';
import { api } from '../api';

const form = reactive({
  email: '',
  password: '',
});

const handleLogin = async () => {
  try {
    const user = await api.post('/auth/login', form);
    console.log(user);
  } catch {
    console.error('Failed to login');
  }
};

const logout = async () => {
  try {
    const result = await api.post('/auth/logout');
    console.log(result);
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


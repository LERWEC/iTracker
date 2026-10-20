<script setup lang="ts">
import { useRouter } from 'vue-router';
import { api } from '../api';
import { Routes } from '../router';
import type { User } from '../types';
import { onMounted, ref } from 'vue';

const router = useRouter();

const user = ref<User | null>(null);

const logout = async () => {
  await api.post('/auth/logout');

  router.push(Routes.AuthLogin);
};

onMounted(async () => {
  try {
    const response = await api.get('/auth/me');
    user.value = response;
  } catch (error) {
    console.error(error);
  }
});
</script>

<template>
  <div class="h-full flex flex-col overflow-hidden bg-background">
    <header class="shrink-0 bg-white flex justify-between items-center p-2 border-b border-primary">
      <RouterLink to="/">
        <div class="flex items-center gap-2">
          <img src="/logo.png" alt="Logo" class="w-10 h-10" />
          <h1 class="text-2xl font-bold">iTracker</h1>
        </div>
      </RouterLink>

      <div class="flex items-center gap-2">
        <p class="text-sm">{{ user?.name }}</p>
        <UIButton variant="outline" @click="logout">Выйти</UIButton>
      </div>
    </header>

    <main class="flex-1 min-h-0 overflow-auto p-2">
      <div class="h-full w-full border border-primary rounded-xl bg-white p-2">
        <RouterView />
      </div>
    </main>
  </div>
</template>

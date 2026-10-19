<script setup lang="ts">
import { useRouter } from 'vue-router';
import { api, ApiPath } from '../api';
import { Routes } from '../router';

const router = useRouter();

const logout = async () => {
  await api.post(ApiPath.AuthLogout);

  router.push(Routes.AuthLogin);
};
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

      <UIButton variant="outline" @click="logout">Выйти</UIButton>
    </header>

    <main class="flex-1 min-h-0 overflow-auto p-2">
      <div class="min-h-full w-full border border-primary rounded-xl bg-white p-2">
        <RouterView />
      </div>
    </main>
  </div>
</template>

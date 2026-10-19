<script setup lang="ts">
import { reactive, ref } from 'vue';
import { api, ApiPath } from '../api';
import { useRouter } from 'vue-router';
import { Routes } from '../router';

const router = useRouter();

const showErrorMessage = ref(false);

const form = reactive({
  email: '',
  password: '',
});

const handleLogin = async () => {
  try {
    await api.post(ApiPath.AuthLogin, form);
    await router.push(Routes.Main);
  } catch (error) {
    showErrorMessage.value = true;
    console.error(error);
  }
};
</script>

<template>
  <div class="flex flex-col gap-2 items-center">
    <h2 class="text-2xl">Вход</h2>
    <p v-if="showErrorMessage" class="text-sm text-error">Неверный email или пароль</p>
    <form @submit.prevent="handleLogin" class="flex flex-col gap-4 w-full">
      <UIInput v-model="form.email" placeholder="Email" name="email" label="Email" />
      <UIInputPassword
        v-model="form.password"
        placeholder="Password"
        name="password"
        label="Password" />
      <RouterLink :to="Routes.AuthRegister">
        <UIButton class="w-full" variant="outline">Зарегистрироваться</UIButton>
      </RouterLink>
      <UIButton class="w-full" type="submit">Войти</UIButton>
    </form>
  </div>
</template>

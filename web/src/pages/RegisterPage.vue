<script setup lang="ts">
import { reactive, ref } from 'vue';
import { api } from '../api';
import { useRouter } from 'vue-router';
import { Routes } from '../router';

const router = useRouter();

const showErrorMessage = ref(false);

const form = reactive({
  email: '',
  password: '',
  name: '',
});

const handleRegister = async () => {
  try {
    await api.post('/auth/register', form);
    await router.push(Routes.Main);
  } catch (error) {
    showErrorMessage.value = true;
    console.error(error);
  }
};
</script>

<template>
  <div class="flex flex-col gap-2 items-center">
    <h2 class="text-2xl">Регистрация</h2>
    <p v-if="showErrorMessage" class="text-sm text-error">Невалидные данные</p>
    <form @submit.prevent="handleRegister" class="flex flex-col gap-4 w-full">
      <UIInput v-model="form.email" placeholder="Email" name="email" label="Email" />
      <UIInput v-model="form.name" placeholder="Name" name="name" label="Name" />
      <UIInputPassword
        v-model="form.password"
        placeholder="Password"
        name="password"
        label="Password" />
      <RouterLink :to="Routes.AuthLogin">
        <UIButton class="w-full" variant="outline">Войти</UIButton>
      </RouterLink>
      <UIButton class="w-full" type="submit">Зарегистрироваться</UIButton>
    </form>
  </div>
</template>

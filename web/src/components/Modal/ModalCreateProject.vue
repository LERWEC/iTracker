<script setup lang="ts">
import { ref } from 'vue';
import { api } from '../../api';

const emit = defineEmits<{
  (e: 'success'): void;
}>();

const showModal = defineModel<boolean>({ required: true });

const loading = ref(false);
const showErrorMessage = ref(false);

const form = ref({
  key: '',
  name: '',
});

const submit = async () => {
  showErrorMessage.value = false;
  try {
    loading.value = true;
    await api.post('/projects', form.value);
    emit('success');
    form.value = {
      key: '',
      name: '',
    };
    showModal.value = false;
  } catch (error) {
    showErrorMessage.value = true;
    console.error(error);
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <UIModal v-model="showModal" title="Создать проект">
    <div class="flex flex-col gap-4 py-4">
      <div v-if="showErrorMessage" class="text-error">
        <h3>Ошибка</h3>
        <p>Произошла ошибка при создании проекта</p>
      </div>
      <form v-if="!loading" @submit.prevent="submit" class="flex flex-col gap-4">
        <UIInput v-model="form.key" placeholder="Ключ проекта" />
        <UIInput v-model="form.name" placeholder="Название проекта" />
        <UIButton type="submit">Создать проект</UIButton>
      </form>
      <UISpiner v-else />
    </div>
  </UIModal>
</template>

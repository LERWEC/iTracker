<script setup lang="ts">
import { computed, ref } from 'vue';

interface Props {
  placeholder?: string;
  name?: string;
  label?: string;
}

const { placeholder = '', name = '', label = '' } = defineProps<Props>();
const model = defineModel<string>({ required: true });

const showPassword = ref(false);

const toggleShowPassword = () => {
  showPassword.value = !showPassword.value;
};

const eyeIcon = computed(() => {
  return showPassword.value ? '/eye.svg' : '/eye-off.svg';
});
</script>

<template>
  <div class="flex flex-col gap-0.5 w-full">
    <label v-if="label" :for="name" class="text-sm font-medium">{{ label }}</label>
    <div class="w-full relative">
      <input
        :id="name"
        :type="showPassword ? 'text' : 'password'"
        v-model="model"
        :placeholder="placeholder"
        class="w-full border border-gray-300 rounded-md p-2 pr-8 focus:outline-none focus:ring-2 focus:ring-primary" />
      <img
        :src="eyeIcon"
        alt="Show password"
        class="w-4 h-4 cursor-pointer absolute right-2 top-1/2 -translate-y-1/2"
        @click="toggleShowPassword" />
    </div>
  </div>
</template>

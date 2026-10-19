<script setup lang="ts">
interface Props {
  placeholder?: string;
  name?: string;
  label?: string;
}

const { placeholder = '', name = '', label = '' } = defineProps<Props>();
const model = defineModel<string>({ required: true });
</script>

<template>
  <div class="flex flex-col gap-0.5 w-full">
    <label v-if="label" :for="name" class="text-sm font-medium">{{ label }}</label>
    <input
      :id="name"
      type="text"
      v-model="model"
      :placeholder="placeholder"
      class="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary"
    />
  </div>
</template>

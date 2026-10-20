<script setup lang="ts">
interface Props {
  placeholder?: string;
  name?: string;
  label?: string;
  options: { value: string; label: string }[];
}

const { placeholder = '', name = '', label = '', options } = defineProps<Props>();
const model = defineModel<string>({ required: true });
</script>

<template>
  <div class="flex flex-col gap-0.5 w-full">
    <label v-if="label" :for="name" class="text-sm font-medium">{{ label }}</label>
    <select
      :id="name"
      v-model="model"
      :placeholder="placeholder"
      class="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary"
    >
      <option v-for="option in options" :key="option.value" :value="option.value">
        {{ option.label }}
      </option>
    </select>
  </div>
</template>

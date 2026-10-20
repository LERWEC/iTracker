<script setup lang="ts">
const props = defineProps<{
  title: string;
}>();

const model = defineModel<boolean>({ required: true });
</script>

<template>
  <div v-if="model" class="fixed inset-0 bg-black/50 flex justify-center items-center">
    <div class="bg-white rounded-xl p-4 border border-primary w-full max-w-2xl">
      <div class="flex items-center justify-between">
        <h3 class="text-2xl font-bold">{{ title }}</h3>
        <UIButton
          variant="outline"
          size="sm"
          color="secondary"
          class="px-2.25 rounded-full pb-0.75"
          @click="model = false"
        >
          x
        </UIButton>
      </div>
      <slot />
    </div>
  </div>
</template>

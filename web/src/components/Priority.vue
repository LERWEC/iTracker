<script setup lang="ts">
import { IssuePriority } from '../types';

const PRIORITY = {
  [IssuePriority.Low]: 'Низкий',
  [IssuePriority.Medium]: 'Средний',
  [IssuePriority.High]: 'Высокий',
  [IssuePriority.Critical]: 'Критический',
};

defineProps<{
  priority: IssuePriority;
}>();
</script>

<template>
  <p
    :class="{
      'text-info': priority === IssuePriority.Low,
      'text-success': priority === IssuePriority.Medium,
      'text-primary': priority === IssuePriority.High,
      'text-error': priority === IssuePriority.Critical,
    }"
  >
    {{ PRIORITY[priority] }}
  </p>
</template>

<script setup lang="ts">
import type { Color } from '../../types';

interface Props {
  color?: Color;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'outline' | 'filled';
  type?: 'button' | 'submit';
}

const {
  color = 'primary',
  size = 'md',
  variant = 'filled',
  type = 'button',
} = defineProps<Props>();
</script>

<template>
  <button
    :type="type"
    class="rounded-md transition-colors duration-200 cursor-pointer"
    :class="{
      'text-white bg-error hover:bg-error/75': color === 'error' && variant === 'filled',
      'text-white bg-secondary hover:bg-secondary/75':
        color === 'secondary' && variant === 'filled',
      'text-white bg-success hover:bg-success/75': color === 'success' && variant === 'filled',
      'text-white bg-info hover:bg-info/75': color === 'info' && variant === 'filled',
      'text-white bg-primary hover:bg-primary/75': color === 'primary' && variant === 'filled',
      'border border-error hover:border-error/75': color === 'error' && variant === 'outline',
      'border border-secondary hover:border-secondary/75':
        color === 'secondary' && variant === 'outline',
      'border border-success hover:border-success/75': color === 'success' && variant === 'outline',
      'border border-info hover:border-info/75': color === 'info' && variant === 'outline',
      'border border-primary': color === 'primary' && variant === 'outline',
      'text-sm py-0.5 px-1': size === 'sm',
      'text-md py-1 px-2': size === 'md',
      'text-lg py-1.5 px-3': size === 'lg',
    }">
    <slot />
  </button>
</template>

<template>
  <div
    class="flex flex-col items-center justify-center h-full w-full overflow-hidden bg-background"
  >
    <div
      class="w-1/3 rounded-xl p-4 bg-white border border-primary flex flex-col items-center justify-center gap-4"
    >
      <div class="flex items-center gap-2">
        <img src="/logo.png" alt="Logo" class="w-10 h-10" />
        <h1 class="text-2xl font-bold">iTracker</h1>
      </div>
      <div class="w-full">
        <RouterView />
      </div>
    </div>
  </div>
</template>

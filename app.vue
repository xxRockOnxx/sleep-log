<template>
  <UApp>
    <div class="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900 text-white flex flex-col font-sans">
      <SplashScreen :show="showSplash" />
      <NuxtLayout v-if="!showSplash">
        <NuxtPage />
      </NuxtLayout>
    </div>
  </UApp>
</template>

<script setup>
const showSplash = ref(true);

// Hide splash screen after everything is properly hydrated
onMounted(async () => {
  const startTime = Date.now();

  // 1.5 seconds minimum for better UX
  const minimumDelay = 1500;

  // Wait a tick to ensure Vue hydration is complete
  await nextTick();

  // Wait for store state to be available (check for persistence restoration)
  // We'll wait until the store has been initialized with persisted data
  let attempts = 0;

  // 5 seconds max wait
  const maxAttempts = 50;

  while (attempts < maxAttempts) {
    // Check if the persistence plugin has finished loading
    if (import.meta.client && window.localStorage) {
      // Small delay to ensure persistence plugin has time to load
      await new Promise((resolve) => setTimeout(resolve, 100));
      break;
    }
    attempts++;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  // Ensure minimum delay for better UX
  const elapsed = Date.now() - startTime;
  const remainingDelay = Math.max(0, minimumDelay - elapsed);

  setTimeout(() => {
    showSplash.value = false;
  }, remainingDelay);
});
</script>

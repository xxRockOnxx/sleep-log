<template>
  <div
    v-if="show"
    class="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900"
  >
    <!-- Stars background -->
    <div class="absolute inset-0 overflow-hidden">
      <div class="star star-1" />
      <div class="star star-2" />
      <div class="star star-3" />
      <div class="star star-4" />
      <div class="star star-5" />
    </div>

    <!-- Main content -->
    <div class="relative z-10 flex flex-col items-center text-white">
      <!-- Moon icon -->
      <div class="mb-8 animate-bounce">
        <UIcon name="i-heroicons-moon" class="w-24 h-24 text-yellow-200" />
      </div>

      <!-- App title -->
      <h1 class="text-4xl md:text-6xl font-bold mb-2 text-center animate-fade-in">
        LittleSleeper
      </h1>

      <!-- Subtitle -->
      <p class="text-lg md:text-xl text-gray-300 mb-8 text-center animate-fade-in-delay">
        Track your baby's peaceful dreams
      </p>

      <!-- Loading indicator -->
      <div class="flex items-center space-x-2">
        <div class="loading-dot" />
        <div class="loading-dot delay-100" />
        <div class="loading-dot delay-200" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  show?: boolean;
}

withDefaults(defineProps<Props>(), {
  show: true,
});
</script>

<style scoped>
@keyframes twinkle {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes loadingDot {
  0%, 80%, 100% { opacity: 0.3; }
  40% { opacity: 1; }
}

.star {
  position: absolute;
  background: white;
  border-radius: 50%;
  animation: twinkle 2s infinite;
}

.star-1 {
  width: 2px;
  height: 2px;
  top: 20%;
  left: 20%;
  animation-delay: 0s;
}

.star-2 {
  width: 3px;
  height: 3px;
  top: 30%;
  right: 25%;
  animation-delay: 0.5s;
}

.star-3 {
  width: 2px;
  height: 2px;
  bottom: 30%;
  left: 30%;
  animation-delay: 1s;
}

.star-4 {
  width: 1px;
  height: 1px;
  top: 60%;
  right: 40%;
  animation-delay: 1.5s;
}

.star-5 {
  width: 2px;
  height: 2px;
  bottom: 20%;
  right: 20%;
  animation-delay: 2s;
}

.animate-fade-in {
  animation: fadeIn 1s ease-out;
}

.animate-fade-in-delay {
  animation: fadeIn 1s ease-out 0.5s both;
}

.loading-dot {
  width: 8px;
  height: 8px;
  background-color: white;
  border-radius: 50%;
  animation: loadingDot 1.4s infinite ease-in-out;
}

.loading-dot.delay-100 {
  animation-delay: 0.16s;
}

.loading-dot.delay-200 {
  animation-delay: 0.32s;
}
</style>

<template>
  <div class="min-h-screen flex flex-col">
    <!-- Stars background -->
    <div class="absolute inset-0 overflow-hidden">
      <div class="star star-1" />
      <div class="star star-2" />
      <div class="star star-3" />
      <div class="star star-4" />
      <div class="star star-5" />
    </div>

    <header class="py-4 relative z-10">
      <h1 class="text-2xl font-bold text-center text-yellow-200">LittleSleeper</h1>
      <nav class="mt-4">
        <ul class="flex justify-center space-x-8">
          <li><NuxtLink to="/" class="text-base hover:text-blue-200 transition-colors duration-200" active-class="text-yellow-200 font-semibold">Sleep Log</NuxtLink></li>
          <li><NuxtLink to="/timer" class="text-base hover:text-blue-200 transition-colors duration-200" active-class="text-yellow-200 font-semibold">Timer</NuxtLink></li>
        </ul>
      </nav>
    </header>

    <main class="relative z-10 flex-1">
      <slot />
    </main>

    <footer class="mt-8 py-4 text-center text-xs text-blue-200 relative z-10">
      <p>&copy; {{ new Date().getFullYear() }} LittleSleeper. Sweet dreams for little ones.</p>
    </footer>
  </div>
</template>

<style scoped>
@keyframes twinkle {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; }
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
</style>

<template>
  <div class="flex flex-col items-center px-4 sm:px-6 lg:px-8 pt-4 pb-6 selection:bg-yellow-200/20 selection:text-white min-h-0">
    <div class="w-full max-w-md sm:max-w-lg">
      <!-- Manual Time Entry - Always Visible -->
      <div class="mb-8">
        <div class="space-y-4 bg-black/20 backdrop-blur-sm border border-white/10 rounded-lg p-6">
          <div class="flex items-center justify-between">
            <label for="start-time" class="text-sm font-medium text-blue-200">Start Time</label>
            <!-- Start time now always editable -->
            <input
              id="start-time"
              type="datetime-local"
              :value="manualStartTime"
              class="w-40 px-2 py-1 bg-white/10 border border-white/30 rounded-md text-white placeholder-gray-400 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 font-mono text-sm"
              @input="updateManualStartTime"
              :max="currentDateTime"
            >
          </div>
          <div class="flex items-center justify-between">
            <label for="end-time" class="text-sm font-medium text-blue-200">End Time</label>
            <!-- End time disabled only if timer is actively running -->
            <input
              id="end-time"
              type="datetime-local"
              :value="manualEndTime"
              :disabled="sleepStore.isTimerRunning"
              :min="manualStartTime"
              :max="currentDateTime"
              class="w-40 px-2 py-1 bg-white/10 border border-white/30 rounded-md text-white placeholder-gray-400 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed font-mono text-sm"
              @input="updateManualEndTime"
            >
          </div>
        </div>
      </div>

      <!-- Timer Display -->
      <div class="my-8 text-center">
        <p class="text-4xl sm:text-5xl font-bold tabular-nums text-white transition-colors duration-300 drop-shadow-lg font-mono">
          {{ formattedDuration }}
        </p>
        <!-- Status messages - always present to prevent layout shift -->
        <p class="text-sm text-blue-200 mt-3 transition-colors duration-300 h-5">
          <span v-if="!sleepStore.isTimerRunning && sleepStore.timerStartTime && sleepStore.timerEndTime">
            Paused
          </span>
          <span v-else-if="!sleepStore.isTimerRunning && !sleepStore.timerStartTime">
            Ready to track sleep
          </span>
          <span v-else-if="sleepStore.isTimerRunning">
            Sleep tracking active
          </span>
        </p>
      </div>

      <!-- Primary Action Button Area -->
      <div class="flex justify-center items-center h-28 mb-8">
        <!-- Single Button that changes based on state -->
        <button
          class="w-20 h-20 rounded-full shadow-xl transform hover:scale-105 transition-all duration-200 ease-out"
          :class="{
            'bg-green-600 hover:bg-green-700 border-green-500': !sleepStore.isTimerRunning && !sleepStore.timerStartTime,
            'bg-yellow-600 hover:bg-yellow-700 border-yellow-500': sleepStore.isTimerRunning,
            'bg-blue-600 hover:bg-blue-700 border-blue-500': !sleepStore.isTimerRunning && sleepStore.timerStartTime && sleepStore.timerEndTime
          }"
          :aria-label="!sleepStore.isTimerRunning && !sleepStore.timerStartTime ? 'Start Timer' : sleepStore.isTimerRunning ? 'Pause Timer' : 'Resume Timer'"
          @click="!sleepStore.isTimerRunning && !sleepStore.timerStartTime ? handleStart() : sleepStore.isTimerRunning ? handleStop() : handleResume()"
        >
          <UIcon
            v-if="sleepStore.isTimerRunning"
            name="i-heroicons-pause-solid"
            class="size-10 text-white"
          />
          <UIcon
            v-else
            name="i-heroicons-play-solid"
            class="size-10 text-white"
          />
        </button>
      </div>

      <!-- Save & Reset Buttons (Conditional & Stacked) -->
      <div class="space-y-4 mb-6">
        <UButton
          v-if="!sleepStore.isTimerRunning && sleepStore.timerStartTime && sleepStore.timerEndTime"
          icon="i-heroicons-check-circle-solid"
          block
          size="lg"
          class="shadow-md bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 border-indigo-500 text-white py-3"
          @click="handleSave"
        >
          Save Sleep Session
        </UButton>
        <UButton
            v-if="!sleepStore.isTimerRunning && (sleepStore.timerStartTime || sleepStore.timerEndTime || currentDisplayTime > 0)"
            icon="i-heroicons-arrow-path-solid"
            block
            size="md"
            variant="outline"
            class="border-white/30 text-blue-200 hover:bg-white/10 py-2"
            @click="handleResetTimer"
          >
            Reset Current Timer
        </UButton>
      </div>

      <UAlert
        v-if="saveError"
        color="error"
        variant="soft"
        :title="saveError"
        class="text-sm mt-4"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { formatDateTimeToInputValue, useSleepStore } from "~/stores/sleep";

const sleepStore = useSleepStore();
const router = useRouter();
const toast = useToast();

useHead({
  title: "Sleep Timer - LittleSleeper",
});

const saveError = ref<string | null>(null);
let timerInterval: NodeJS.Timeout | null = null;
const currentDisplayTime = ref(0); // in seconds

// Initialize with store values since hydration is handled at app level
const manualStartTime = ref(
  sleepStore.timerStartTime
    ? formatDateTimeToInputValue(sleepStore.timerStartTime)
    : "",
);
const manualEndTime = ref(
  sleepStore.timerEndTime
    ? formatDateTimeToInputValue(sleepStore.timerEndTime)
    : "",
);

// Computed property for current date/time to prevent future dates
const currentDateTime = computed(() => {
  const now = new Date();
  const timeZoneOffset = now.getTimezoneOffset() * 60000;
  const localDate = new Date(now.getTime() - timeZoneOffset);
  return localDate.toISOString().slice(0, 16);
});

const updateTimerDisplay = () => {
  if (sleepStore.isTimerRunning && sleepStore.timerStartTime) {
    currentDisplayTime.value = Math.floor(
      (Date.now() - sleepStore.timerStartTime) / 1000,
    );
  } else if (sleepStore.timerStartTime && sleepStore.timerEndTime) {
    currentDisplayTime.value = Math.floor(
      (sleepStore.timerEndTime - sleepStore.timerStartTime) / 1000,
    );
  } else {
    currentDisplayTime.value = 0;
  }
};

watch(
  () => sleepStore.timerStartTime,
  (newVal) => {
    manualStartTime.value = newVal ? formatDateTimeToInputValue(newVal) : "";
    updateTimerDisplay();
  },
);

watch(
  () => sleepStore.timerEndTime,
  (newVal) => {
    manualEndTime.value = newVal ? formatDateTimeToInputValue(newVal) : "";
    updateTimerDisplay();
  },
);

watch(
  () => sleepStore.isTimerRunning,
  (isRunning) => {
    if (isRunning) {
      updateTimerDisplay(); // Initial update
      if (timerInterval) clearInterval(timerInterval);
      timerInterval = setInterval(updateTimerDisplay, 1000);
    } else {
      if (timerInterval) clearInterval(timerInterval);
      timerInterval = null;
      updateTimerDisplay(); // Final update when stopped/paused
    }
  },
  { immediate: true },
);

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval);
});

const formattedDuration = computed(() => {
  const totalSeconds = currentDisplayTime.value;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  // Always show HH:MM:SS
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
});

const updateManualStartTime = (event: Event) => {
  const target = event.target as HTMLInputElement;
  manualStartTime.value = target.value;
  if (target.value) {
    // Parse datetime-local input value
    const startTime = new Date(target.value);
    sleepStore.timerStartTime = startTime.getTime();
  }
};

const updateManualEndTime = (event: Event) => {
  const target = event.target as HTMLInputElement;
  manualEndTime.value = target.value;
  if (target.value) {
    // Parse datetime-local input value
    const endTime = new Date(target.value);
    sleepStore.timerEndTime = endTime.getTime();
  }
};

const handleStart = () => {
  saveError.value = null;
  sleepStore.isTimerRunning = true;
  sleepStore.timerStartTime = Date.now();
};

const handleStop = () => {
  saveError.value = null;
  sleepStore.isTimerRunning = false;
  sleepStore.timerEndTime = Date.now();
};

const handleResume = () => {
  saveError.value = null;
  const pausedDuration = sleepStore.timerEndTime! - sleepStore.timerStartTime!;
  sleepStore.timerStartTime = Date.now() - pausedDuration;
  sleepStore.timerEndTime = null;
  sleepStore.isTimerRunning = true;
};

const handleSave = () => {
  saveError.value = null;
  if (!sleepStore.timerStartTime || !sleepStore.timerEndTime) {
    saveError.value = "Cannot save, start or end time is missing.";
    toast.add({ title: "Error", description: saveError.value, color: "error" });
    return;
  }
  if (sleepStore.timerEndTime <= sleepStore.timerStartTime) {
    saveError.value = "End time must be after start time to save.";
    toast.add({ title: "Error", description: saveError.value, color: "error" });
    return;
  }

  // Create new sleep entry directly since the method doesn't exist
  const newEntry = {
    id: Date.now().toString(),
    startTime: new Date(sleepStore.timerStartTime),
    endTime: new Date(sleepStore.timerEndTime),
    durationMinutes: Math.floor(
      (sleepStore.timerEndTime - sleepStore.timerStartTime) / 60000,
    ),
  };

  sleepStore.entries.push(newEntry);
  sleepStore.lastEditedEntryId = newEntry.id;

  // Reset timer
  sleepStore.isTimerRunning = false;
  sleepStore.timerStartTime = null;
  sleepStore.timerEndTime = null;
  router.push("/");
};

const handleResetTimer = () => {
  saveError.value = null;
  sleepStore.isTimerRunning = false;
  sleepStore.timerStartTime = null;
  sleepStore.timerEndTime = null;
  manualStartTime.value = "";
  manualEndTime.value = "";
  currentDisplayTime.value = 0;
};
</script>

<style scoped>
.tabular-nums {
  font-variant-numeric: tabular-nums;
}
</style>

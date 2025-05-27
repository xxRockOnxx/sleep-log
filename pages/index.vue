<template>
  <div class="flex flex-col items-center px-4 sm:px-6 lg:px-8 pt-4 pb-6 space-y-6">
    <div class="w-full max-w-md sm:max-w-lg">
      <div class="bg-black/20 backdrop-blur-sm border border-white/10 rounded-lg p-6 shadow-xl">
        <div class="flex items-center space-x-3 mb-4">
          <UIcon name="i-heroicons-moon" class="text-xl text-yellow-200" />
          <h2 class="text-lg font-semibold text-white">Sleep Overview</h2>
        </div>
        <div class="space-y-4">
          <!-- Sleep Status -->
          <ClientOnly>
            <div v-if="hydrated && lastSleepEntry?.endTime" class="flex items-start space-x-3">
              <UIcon name="i-heroicons-check-circle" class="text-xl text-green-400 mt-0.5" />
              <div>
                <p class="text-sm text-blue-200">Last sleep ended:</p>
                <p class="text-base font-semibold text-white font-mono">{{ timeSinceLastSleep }}</p>
              </div>
            </div>
            <div v-else-if="hydrated && lastSleepEntry?.startTime && !lastSleepEntry?.endTime" class="flex items-start space-x-3">
              <UIcon name="i-heroicons-moon" class="text-xl text-purple-400 mt-0.5" />
              <div>
                <p class="text-sm text-blue-200">Currently sleeping since:</p>
                <p class="text-base font-semibold text-white font-mono">{{ formatTime(lastSleepEntry.startTime) }}</p>
              </div>
            </div>
            <div v-else-if="hydrated" class="flex items-start space-x-3">
              <UIcon name="i-heroicons-information-circle" class="text-xl text-gray-400 mt-0.5" />
              <div>
                <p class="text-sm text-blue-200">Status:</p>
                <p class="text-base font-semibold text-white">No sleep recorded yet.</p>
              </div>
            </div>
            <template #fallback>
              <div class="flex items-start space-x-3">
                <UIcon name="i-heroicons-information-circle" class="text-xl text-gray-400 mt-0.5" />
                <div>
                  <p class="text-sm text-blue-200">Status:</p>
                  <p class="text-base font-semibold text-white">Loading...</p>
                </div>
              </div>
            </template>
          </ClientOnly>

          <!-- Duration -->
          <ClientOnly>
            <div v-if="hydrated && lastSleepEntry?.durationMinutes" class="flex items-start space-x-3 pt-3 mt-3 border-t border-white/20">
              <UIcon name="i-heroicons-clock" class="text-xl text-blue-300 mt-0.5" />
              <div>
                <p class="text-sm text-blue-200">Last Duration:</p>
                <p class="text-base font-semibold text-white font-mono">{{ lastSleepEntry.durationMinutes }} minutes</p>
              </div>
            </div>
          </ClientOnly>

          <!-- Timer -->
          <ClientOnly>
            <div v-if="hydrated && (sleepStore.isTimerRunning || (sleepStore.timerStartTime && sleepStore.timerEndTime))" class="flex items-start space-x-3 pt-3 border-t border-white/20 mt-3">
              <UIcon name="i-heroicons-clock" class="text-xl text-yellow-200 mt-0.5" />
              <div>
                <p class="text-sm text-blue-200">Active Timer:</p>
                <p class="text-base font-semibold text-white font-mono">{{ realtimeTimerDisplay }}</p>
              </div>
            </div>
          </ClientOnly>
        </div>
      </div>

      <div class="mt-10">
        <div class="flex justify-between items-center mb-8">
          <div class="flex items-center space-x-3">
            <UIcon name="i-heroicons-list-bullet" class="text-xl text-blue-200" />
            <h2 class="text-lg font-semibold text-white">Sleep Log</h2>
          </div>
          <NuxtLink
            to="/timer"
            class="flex items-center px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 border-indigo-500 shadow-md hover:shadow-lg transition-all duration-200 text-sm font-medium rounded-lg"
          >
            <UIcon name="i-heroicons-plus-circle" class="text-lg mr-2" />
            Add New Sleep
          </NuxtLink>
        </div>

        <!-- Weekly Tabs -->
        <ClientOnly>
          <div v-if="hydrated && weeklyGroups.length > 0" class="mb-6">
            <div class="w-full overflow-x-auto">
              <div class="flex space-x-1 min-w-full">
                <button
                  v-for="(week, index) in weeklyGroups"
                  :key="week.label"
                  class="flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 whitespace-nowrap border"
                  :class="activeWeekIndex === index
                    ? 'bg-white/10 text-white border-white/30'
                    : 'bg-transparent text-blue-200 border-white/10 hover:bg-white/5 hover:border-white/20'"
                  @click="activeWeekIndex = index"
                >
                  {{ week.label }}
                </button>
              </div>
            </div>
          </div>
        </ClientOnly>

        <ClientOnly>
          <div v-if="hydrated && sortedEntries.length === 0" class="text-center py-8">
            <UIcon name="i-heroicons-moon" class="text-5xl mb-4 text-yellow-200" />
            <p class="text-lg font-semibold text-white mb-3">No Sleep Entries Yet</p>
            <p class="text-sm text-blue-200 mb-2">Time to log your baby's sleep session!</p>
            <p class="text-sm text-blue-200">Use the "Add New Sleep" button or go to the Timer page.</p>
          </div>
          <div v-else-if="hydrated && activeWeekEntries.length === 0" class="text-center py-8">
            <UIcon name="i-heroicons-moon" class="text-4xl mb-3 text-yellow-200" />
            <p class="text-base font-semibold text-white mb-2">No entries for this week</p>
            <p class="text-sm text-blue-200">Try selecting a different week or add a new entry.</p>
          </div>
          <div v-else-if="hydrated" class="space-y-6">
            <!-- Date Groups -->
            <div v-for="dateGroup in dailyGroupsForActiveWeek" :key="dateGroup.date" class="space-y-3">
              <h3 class="text-sm font-medium text-blue-200 px-2">
                {{ formatDateHeader(dateGroup.date) }}
              </h3>
              <div class="space-y-3">
                <SleepEntryItem
                  v-for="entry in dateGroup.entries"
                  :id="entry.id"
                  :key="entry.id"
                  :entry="entry"
                />
              </div>
            </div>
          </div>
          <template #fallback>
            <div class="text-center py-8">
              <p class="text-base text-blue-200">Loading sleep entries...</p>
            </div>
          </template>
        </ClientOnly>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import SleepEntryItem from "~/components/SleepEntryItem.vue";
import { useSleepStore } from "~/stores/sleep";

const sleepStore = useSleepStore();
let timerInterval: NodeJS.Timeout | null = null;

// Add hydrated state to prevent hydration mismatch
const hydrated = ref(false);

useHead({
  title: "LittleSleeper - Track your baby's peaceful dreams",
});

const formatTime = (date: Date | string | number | null): string => {
  if (!date) return "";
  return new Date(date).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Create our own reactive timer display
const currentTime = ref(Date.now());

// Update current time every second for realtime display
const setupTimerInterval = () => {
  if (sleepStore.isTimerRunning) {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      currentTime.value = Date.now();
    }, 1000);
  } else {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = null;
  }
};

// Computed for realtime timer display
const realtimeTimerDisplay = computed(() => {
  let totalSeconds: number | null = null;

  if (sleepStore.isTimerRunning && sleepStore.timerStartTime) {
    totalSeconds = Math.floor(
      (currentTime.value - sleepStore.timerStartTime) / 1000,
    );
  } else if (
    !sleepStore.isTimerRunning &&
    sleepStore.timerStartTime &&
    sleepStore.timerEndTime
  ) {
    totalSeconds = Math.floor(
      (sleepStore.timerEndTime - sleepStore.timerStartTime) / 1000,
    );
  }

  if (totalSeconds === null || totalSeconds < 0) {
    return "00:00:00";
  }

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
});

// Watch for timer state changes
watch(() => sleepStore.isTimerRunning, setupTimerInterval, { immediate: true });

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval);
});

// Computed for sorted entries
const sortedEntries = computed(() => {
  const entriesWithActualDates = sleepStore.entries.map((entry) => ({
    ...entry,
    startTime: entry.startTime ? new Date(entry.startTime) : null,
    endTime: entry.endTime ? new Date(entry.endTime) : null,
  }));

  return entriesWithActualDates.sort((a, b) => {
    if (a.startTime && b.startTime) {
      return b.startTime.getTime() - a.startTime.getTime();
    }
    if (a.startTime) return -1;
    if (b.startTime) return 1;
    return 0;
  });
});

const lastSleepEntry = computed(() => {
  return sortedEntries.value.length > 0 ? sortedEntries.value[0] : null;
});

const timeSinceLastSleep = computed(() => {
  if (!lastSleepEntry.value || !lastSleepEntry.value.endTime) {
    return "No sleep recorded yet";
  }
  const now = new Date();
  const diffMs =
    now.getTime() - new Date(lastSleepEntry.value.endTime).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  const diffHours = Math.floor(diffMins / 60);
  return `${diffHours}h ${diffMins % 60}m ago`;
});

// Scroll to and highlight the last edited/added entry
const scrollToEntry = (entryId: string | null) => {
  if (entryId) {
    const element = document.getElementById(entryId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      // Reset lastEditedEntryId after a short delay to remove highlight
      setTimeout(() => {
        sleepStore.lastEditedEntryId = null;
      }, 2000); // Highlight for 2 seconds
    }
  }
};

onMounted(() => {
  hydrated.value = true;
  scrollToEntry(sleepStore.lastEditedEntryId);
});

// Watch for changes to lastEditedEntryId to handle new entries after component is mounted
watch(
  () => sleepStore.lastEditedEntryId,
  (newId) => {
    scrollToEntry(newId);
  },
);

const activeWeekIndex = ref(0);

// Helper function to get week start (Monday)
const getWeekStart = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  return new Date(d.setDate(diff));
};

// Helper function to get week end (Sunday)
const getWeekEnd = (date: Date): Date => {
  const weekStart = getWeekStart(date);
  return new Date(
    weekStart.getFullYear(),
    weekStart.getMonth(),
    weekStart.getDate() + 6,
  );
};

// Helper function to format week label
const formatWeekLabel = (startDate: Date, endDate: Date): string => {
  const startMonth = startDate.toLocaleDateString([], { month: "short" });
  const endMonth = endDate.toLocaleDateString([], { month: "short" });

  if (startMonth === endMonth) {
    return `${startMonth} ${startDate.getDate()}-${endDate.getDate()}`;
  }
  return `${startMonth} ${startDate.getDate()} - ${endMonth} ${endDate.getDate()}`;
};

// Helper function to format date header
const formatDateHeader = (dateStr: string): string => {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

  if (date.toDateString() === today.toDateString()) {
    return "Today";
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  }
  return date.toLocaleDateString([], {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
};

// Group entries by weeks
const weeklyGroups = computed(() => {
  if (sortedEntries.value.length === 0) return [];

  const weeks = new Map<
    string,
    { entries: any[]; startDate: Date; endDate: Date }
  >();

  for (const entry of sortedEntries.value) {
    if (!entry.startTime) continue;

    const entryDate = new Date(entry.startTime);
    const weekStart = getWeekStart(entryDate);
    const weekEnd = getWeekEnd(entryDate);
    const weekKey = weekStart.toISOString().split("T")[0];

    if (!weeks.has(weekKey)) {
      weeks.set(weekKey, {
        entries: [],
        startDate: weekStart,
        endDate: weekEnd,
      });
    }
    weeks.get(weekKey)?.entries.push(entry);
  }

  return Array.from(weeks.values())
    .sort((a, b) => b.startDate.getTime() - a.startDate.getTime())
    .map((week) => ({
      ...week,
      label: formatWeekLabel(week.startDate, week.endDate),
    }));
});

// Get entries for the active week
const activeWeekEntries = computed(() => {
  if (
    weeklyGroups.value.length === 0 ||
    activeWeekIndex.value >= weeklyGroups.value.length
  ) {
    return [];
  }
  return weeklyGroups.value[activeWeekIndex.value].entries;
});

// Group active week entries by date
const dailyGroupsForActiveWeek = computed(() => {
  const groups = new Map<string, any[]>();

  for (const entry of activeWeekEntries.value) {
    if (!entry.startTime) continue;

    const dateKey = new Date(entry.startTime).toISOString().split("T")[0];
    if (!groups.has(dateKey)) {
      groups.set(dateKey, []);
    }
    groups.get(dateKey)?.push(entry);
  }

  return Array.from(groups.entries())
    .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
    .map(([date, entries]) => ({
      date,
      entries: entries.sort((a, b) => {
        if (a.startTime && b.startTime) {
          return (
            new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
          );
        }
        return 0;
      }),
    }));
});
</script>

<style scoped>
/* You can add any page-specific styles here if needed, though Tailwind should cover most cases. */
</style>

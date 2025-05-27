<template>
  <div class="px-6 py-4 rounded-lg shadow-sm border-white/10 bg-black/20 backdrop-blur-sm">
    <div v-if="!isEditing">
      <div class="flex items-start justify-between">
        <div class="flex-1 min-w-0 text-left pr-4">
          <p class="text-sm font-semibold text-gray-900 dark:text-white font-mono">
            Slept {{ formatDuration(entry.durationMinutes) }}
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1 font-mono">
            {{ entry.startTime ? formatTime(entry.startTime) : 'N/A' }} -
            {{ entry.endTime ? formatTime(entry.endTime) : (entry.startTime ? 'Ongoing' : 'N/A') }}
          </p>
        </div>
        <div class="ml-4 flex-shrink-0">
          <UButtonGroup>
            <UButton
              aria-label="Edit sleep entry"
              size="md"
              color="neutral"
              variant="ghost"
              class="p-2 hover:bg-white/10"
              @click="startEditing"
            >
              <UIcon name="i-heroicons-pencil-square" class="text-lg" />
            </UButton>
            <UButton
              aria-label="Delete sleep entry"
              size="md"
              color="neutral"
              variant="ghost"
              class="p-2 hover:bg-white/10 hover:text-red-400"
              @click="confirmDelete"
            >
              <UIcon name="i-heroicons-trash" class="text-lg" />
            </UButton>
          </UButtonGroup>
        </div>
      </div>
    </div>

    <div v-else class="space-y-4">
      <h3 class="text-base font-medium leading-6 text-gray-900 dark:text-white mb-4">
        Edit Sleep Entry
      </h3>

      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <label for="edit-start-time" class="text-sm font-medium text-blue-200">Start Time</label>
          <input
            id="edit-start-time"
            v-model="editableStartTime"
            type="datetime-local"
            :max="currentDateTime"
            class="w-40 px-2 py-1 bg-white/10 border border-white/30 rounded-md text-white placeholder-gray-400 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 font-mono text-sm"
          >
        </div>

        <div class="flex items-center justify-between">
          <label for="edit-end-time" class="text-sm font-medium text-blue-200">End Time</label>
          <input
            id="edit-end-time"
            v-model="editableEndTime"
            type="datetime-local"
            :min="editableStartTime"
            :max="currentDateTime"
            class="w-40 px-2 py-1 bg-white/10 border border-white/30 rounded-md text-white placeholder-gray-400 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 font-mono text-sm"
          >
        </div>
      </div>

      <div class="flex items-center justify-end space-x-3 pt-4 mt-4 border-t border-white/20">
        <button type="button" @click="cancelEdit">
          Cancel
        </button>
        <button type="button" @click="saveEdit">
          Save
        </button>
      </div>

      <UAlert
        v-if="editError"
        color="error"
        variant="soft"
        :title="editError"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { type SleepEntry, useSleepStore } from "~/stores/sleep";

const props = defineProps({
  entry: {
    type: Object as PropType<SleepEntry>,
    required: true,
  },
});

const sleepStore = useSleepStore();
const toast = useToast();

const isEditing = ref(false);
const editableStartTime = ref("");
const editableEndTime = ref("");
const editError = ref<string | null>(null);

const formatTime = (date: Date | string | null): string => {
  if (!date) return "";
  return new Date(date).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDuration = (minutes: number | null): string => {
  if (minutes === null || minutes < 0) return "N/A";
  if (minutes === 0) return "0m";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;

  if (h > 0 && m > 0) {
    return `${h}h ${m}m`;
  }
  if (h > 0) {
    return `${h}h`;
  }
  return `${m}m`;
};

// Helper to format Date to yyyy-MM-ddTHH:mm for datetime-local input
const toDatetimeLocal = (date: Date | null): string => {
  if (!date) return "";
  const d = new Date(date);
  // Adjust for timezone offset to display local time correctly in input
  const timeZoneOffset = d.getTimezoneOffset() * 60000;
  const localDate = new Date(d.getTime() - timeZoneOffset);
  return localDate.toISOString().slice(0, 16);
};

// Computed property for current date/time to prevent future dates
const currentDateTime = computed(() => {
  const now = new Date();
  const timeZoneOffset = now.getTimezoneOffset() * 60000;
  const localDate = new Date(now.getTime() - timeZoneOffset);
  return localDate.toISOString().slice(0, 16);
});

const startEditing = () => {
  isEditing.value = true;
  editError.value = null;
  editableStartTime.value = props.entry.startTime
    ? toDatetimeLocal(new Date(props.entry.startTime))
    : "";
  editableEndTime.value = props.entry.endTime
    ? toDatetimeLocal(new Date(props.entry.endTime))
    : "";
};

const cancelEdit = () => {
  isEditing.value = false;
  editError.value = null;
};

const saveEdit = () => {
  editError.value = null;
  if (!editableStartTime.value || !editableEndTime.value) {
    editError.value = "Both start and end times are required.";
    toast.add({ title: "Error", description: editError.value, color: "error" });
    return;
  }
  const newStartTime = new Date(editableStartTime.value);
  const newEndTime = new Date(editableEndTime.value);

  if (newEndTime < newStartTime) {
    editError.value = "End time cannot be before start time.";
    toast.add({ title: "Error", description: editError.value, color: "error" });
    return;
  }
  if (newEndTime.getTime() === newStartTime.getTime()) {
    editError.value = "Start and end times cannot be the same.";
    toast.add({ title: "Error", description: editError.value, color: "error" });
    return;
  }

  // Manually update the entry in the store since the method isn't recognized
  const index = sleepStore.entries.findIndex(
    (entry) => entry.id === props.entry.id,
  );
  if (index !== -1) {
    const updatedEntry = {
      ...props.entry,
      startTime: newStartTime,
      endTime: newEndTime,
      durationMinutes: Math.floor(
        (newEndTime.getTime() - newStartTime.getTime()) / 60000,
      ),
    };
    sleepStore.entries[index] = updatedEntry;
    sleepStore.lastEditedEntryId = props.entry.id;
  }

  toast.add({
    title: "Success",
    description: "Sleep entry updated.",
    color: "success",
  });
  isEditing.value = false;
};

const confirmDelete = () => {
  if (window.confirm("Are you sure you want to delete this sleep entry?")) {
    // Manually delete from the store since the method isn't recognized
    sleepStore.entries = sleepStore.entries.filter(
      (entry) => entry.id !== props.entry.id,
    );
    if (sleepStore.lastEditedEntryId === props.entry.id) {
      sleepStore.lastEditedEntryId = null;
    }
    toast.add({
      title: "Success",
      description: "Sleep entry deleted.",
      color: "success",
    });
  }
};
</script>

<style scoped>
/* Optional: Add any component-specific styles here if needed */
</style>

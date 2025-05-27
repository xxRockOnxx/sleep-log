import { defineStore } from "pinia";

export interface SleepEntry {
  id: string;
  startTime: Date | null;
  endTime: Date | null;
  durationMinutes: number | null;
}

interface SleepState {
  entries: SleepEntry[];
  timerStartTime: number | null;
  timerEndTime: number | null;
  isTimerRunning: boolean;
  lastEditedEntryId: string | null;
}

export const useSleepStore = defineStore("sleep", {
  state: (): SleepState => ({
    entries: [],
    timerStartTime: null,
    timerEndTime: null,
    isTimerRunning: false,
    lastEditedEntryId: null,
  }),

  getters: {
    sortedEntries(state): SleepEntry[] {
      const entriesWithActualDates = state.entries.map((entry) => ({
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
    },
    lastSleepEntry(): SleepEntry | null {
      return this.sortedEntries.length > 0 ? this.sortedEntries[0] : null;
    },
    timeSinceLastSleep(): string {
      if (!this.lastSleepEntry || !this.lastSleepEntry.endTime) {
        return "No sleep recorded yet";
      }
      const now = new Date();
      const diffMs =
        now.getTime() - new Date(this.lastSleepEntry.endTime).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins} min ago`;
      const diffHours = Math.floor(diffMins / 60);
      return `${diffHours}h ${diffMins % 60}m ago`;
    },
    currentTimerDuration(state): number | null {
      if (!state.isTimerRunning && state.timerStartTime && state.timerEndTime) {
        return Math.floor((state.timerEndTime - state.timerStartTime) / 60000);
      }
      if (state.isTimerRunning && state.timerStartTime) {
        return Math.floor((Date.now() - state.timerStartTime) / 60000);
      }
      return null;
    },
    formattedTimerStartTime(state): string | null {
      return state.timerStartTime
        ? new Date(state.timerStartTime).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })
        : null;
    },
    formattedTimerEndTime(state): string | null {
      return state.timerEndTime
        ? new Date(state.timerEndTime).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })
        : null;
    },
    formattedTimerDuration(state): string {
      let totalSeconds: number | null = null;

      if (state.isTimerRunning && state.timerStartTime) {
        totalSeconds = Math.floor((Date.now() - state.timerStartTime) / 1000);
      } else if (
        !state.isTimerRunning &&
        state.timerStartTime &&
        state.timerEndTime
      ) {
        totalSeconds = Math.floor(
          (state.timerEndTime - state.timerStartTime) / 1000,
        );
      }

      if (totalSeconds === null || totalSeconds < 0) {
        return "00:00:00";
      }

      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    },
  },

  actions: {
    startTimer() {
      if (this.isTimerRunning) return;
      this.timerStartTime = Date.now();
      this.timerEndTime = null;
      this.isTimerRunning = true;
    },
    stopTimer() {
      if (!this.isTimerRunning) return;
      this.timerEndTime = Date.now();
      this.isTimerRunning = false;
    },
    resumeTimer() {
      if (this.isTimerRunning || !this.timerStartTime) return;
      this.timerEndTime = null;
      this.isTimerRunning = true;
    },
    resetTimer() {
      this.timerStartTime = null;
      this.timerEndTime = null;
      this.isTimerRunning = false;
    },
    setManualStartTime(time: string) {
      const [hours, minutes] = time.split(":").map(Number);
      const newStartTime = new Date();
      newStartTime.setHours(hours, minutes, 0, 0);
      this.timerStartTime = newStartTime.getTime();
      if (this.timerEndTime && this.timerEndTime < this.timerStartTime) {
        this.timerEndTime = this.timerStartTime;
      }
      this.isTimerRunning = false;
    },
    setManualEndTime(time: string) {
      const [hours, minutes] = time.split(":").map(Number);
      const newEndTime = new Date();
      newEndTime.setHours(hours, minutes, 0, 0);
      this.timerEndTime = newEndTime.getTime();
      if (this.timerStartTime && this.timerEndTime < this.timerStartTime) {
        this.timerStartTime = this.timerEndTime;
      }
      this.isTimerRunning = false;
    },
    saveSleepEntry(entryToSave?: {
      startTime: number | null;
      endTime: number | null;
    }) {
      const start = entryToSave?.startTime || this.timerStartTime;
      const end = entryToSave?.endTime || this.timerEndTime;

      if (!start || !end || end < start) {
        console.error("Invalid start or end time for saving entry.");
        return;
      }
      const durationMinutes = Math.floor((end - start) / 60000);
      if (durationMinutes <= 0) {
        console.error("Sleep duration must be positive.");
        return;
      }
      const newEntry: SleepEntry = {
        id: `sleep-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        startTime: new Date(start),
        endTime: new Date(end),
        durationMinutes,
      };
      this.entries.push(newEntry);
      this.lastEditedEntryId = newEntry.id;

      // Reset timer fields after saving
      this.timerStartTime = null;
      this.timerEndTime = null;
      this.isTimerRunning = false;
    },
    updateSleepEntry(updatedEntry: SleepEntry) {
      const index = this.entries.findIndex(
        (entry) => entry.id === updatedEntry.id,
      );
      if (
        index !== -1 &&
        updatedEntry.startTime &&
        updatedEntry.endTime &&
        updatedEntry.endTime >= updatedEntry.startTime
      ) {
        updatedEntry.durationMinutes = Math.floor(
          (new Date(updatedEntry.endTime).getTime() -
            new Date(updatedEntry.startTime).getTime()) /
            60000,
        );
        if (updatedEntry.durationMinutes > 0) {
          this.entries[index] = {
            ...updatedEntry,
            startTime: new Date(updatedEntry.startTime),
            endTime: new Date(updatedEntry.endTime),
          };
          this.lastEditedEntryId = updatedEntry.id;
        } else {
          console.error("Updated duration must be positive.");
        }
      }
    },
    deleteSleepEntry(entryId: string) {
      this.entries = this.entries.filter((entry) => entry.id !== entryId);
      if (this.lastEditedEntryId === entryId) {
        this.lastEditedEntryId = null;
      }
    },
  },

  persist: {
    paths: [
      "entries",
      "timerStartTime",
      "timerEndTime",
      "isTimerRunning",
      "lastEditedEntryId",
    ],
  },
});

export function formatTimeToInputValue(date: Date | null | number): string {
  if (!date) return "";
  const d = new Date(date);
  const hours = d.getHours().toString().padStart(2, "0");
  const minutes = d.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function formatDateTimeToInputValue(date: Date | null | number): string {
  if (!date) return "";
  const d = new Date(date);
  // Adjust for timezone offset to display local time correctly in input
  const timeZoneOffset = d.getTimezoneOffset() * 60000;
  const localDate = new Date(d.getTime() - timeZoneOffset);
  return localDate.toISOString().slice(0, 16);
}

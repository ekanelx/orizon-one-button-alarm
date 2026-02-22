import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';

// Safe storage wrapper to prevent Brave Desktop crashes when Shields block localStorage
const safeStorage: StateStorage = {
    getItem: (name: string): string | null => {
        try {
            return localStorage.getItem(name);
        } catch (err) {
            return null;
        }
    },
    setItem: (name: string, value: string): void => {
        try {
            localStorage.setItem(name, value);
        } catch (err) {
            // ignore
        }
    },
    removeItem: (name: string): void => {
        try {
            localStorage.removeItem(name);
        } catch (err) {
            // ignore
        }
    },
};

export type AppMode =
    | 'CLOCK'
    | 'ALARM'
    | 'SET_ALARM_HH'
    | 'SET_ALARM_MM'
    | 'SET_TIME_HH'
    | 'SET_TIME_MM'
    | 'RINGING';

export type BannerType =
    | 'ALARM_ENABLED'
    | 'ALARM_DISABLED'
    | 'ALARM_SAVED'
    | 'TIME_SAVED'
    | 'SNOOZED'
    | 'STOPPED'
    | null;

interface TimeValue {
    h: number;
    m: number;
}

interface AppState {
    // Core State
    mode: AppMode;
    alarmTime: TimeValue;
    currentTimeOffset: TimeValue; // Optional offset for "set time" demo
    isEnabled: boolean;
    snoozeTime: Date | null;
    banner: BannerType;
    coachmarkShown: boolean;

    // Actions
    setMode: (mode: AppMode) => void;
    setAlarmTime: (time: TimeValue) => void;
    incrementAlarmHour: () => void;
    incrementAlarmMinute: () => void;
    setCurrentTimeOffset: (offset: TimeValue) => void;
    incrementCurrentTimeHour: () => void;
    incrementCurrentTimeMinute: () => void;
    toggleAlarm: () => void;
    setSnoozeTime: (date: Date | null) => void;
    showBanner: (banner: BannerType) => void;
    hideBanner: () => void;
    markCoachmarkShown: () => void;
}

export const useAppStore = create<AppState>()(
    persist(
        (set) => ({
            mode: 'CLOCK',
            alarmTime: { h: 7, m: 0 },
            currentTimeOffset: { h: 0, m: 0 }, // Represents added offset to Date.now()
            isEnabled: false,
            snoozeTime: null,
            banner: null,
            coachmarkShown: false,

            setMode: (mode) => set({ mode }),
            setAlarmTime: (time) => set({ alarmTime: time }),

            incrementAlarmHour: () => set((state) => ({
                alarmTime: { ...state.alarmTime, h: (state.alarmTime.h + 1) % 24 }
            })),

            incrementAlarmMinute: () => set((state) => ({
                alarmTime: { ...state.alarmTime, m: (state.alarmTime.m + 1) % 60 }
            })),

            setCurrentTimeOffset: (offset) => set({ currentTimeOffset: offset }),

            incrementCurrentTimeHour: () => set((state) => ({
                currentTimeOffset: { ...state.currentTimeOffset, h: (state.currentTimeOffset.h + 1) % 24 }
            })),

            incrementCurrentTimeMinute: () => set((state) => ({
                currentTimeOffset: { ...state.currentTimeOffset, m: (state.currentTimeOffset.m + 1) % 60 }
            })),

            toggleAlarm: () => set((state) => {
                const nextState = !state.isEnabled;
                return {
                    isEnabled: nextState,
                    banner: nextState ? 'ALARM_ENABLED' : 'ALARM_DISABLED',
                    coachmarkShown: true, // Hide coachmark after first toggle
                    snoozeTime: nextState ? state.snoozeTime : null
                };
            }),

            setSnoozeTime: (date) => set({ snoozeTime: date }),

            showBanner: (banner) => set({ banner }),

            hideBanner: () => set({ banner: null }),

            markCoachmarkShown: () => set({ coachmarkShown: true })
        }),
        {
            name: 'one-button-alarm-storage',
            storage: createJSONStorage(() => safeStorage),
            partialize: (state) => ({
                alarmTime: state.alarmTime,
                isEnabled: state.isEnabled,
                coachmarkShown: state.coachmarkShown
            })
        }
    )
);

import { useEffect, useRef } from 'react';
import { useAppStore } from '../store/appStore';

/**
 * Hook to manage the 5s auto-save timeout in 'SET_ALARM_HH', 'SET_ALARM_MM',
 * 'SET_TIME_HH', and 'SET_TIME_MM' modes.
 */
export function useAutoSaveTimeout() {
    const { mode, setMode, showBanner, alarmTime } = useAppStore();
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // We only track inactivity when in these specific modes
    const isEditingMode = ['SET_ALARM_HH', 'SET_ALARM_MM', 'SET_TIME_HH', 'SET_TIME_MM'].includes(mode);

    const resetTimeout = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        if (isEditingMode) {
            timeoutRef.current = setTimeout(() => {
                // 5s of inactivity reached

                // Haptic double-beep stub
                if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
                    window.navigator.vibrate([20, 100, 20]);
                }

                if (mode.startsWith('SET_ALARM')) {
                    setMode('ALARM');
                    showBanner('ALARM_SAVED');
                } else if (mode.startsWith('SET_TIME')) {
                    setMode('CLOCK');
                    showBanner('TIME_SAVED');
                }

            }, 5000); // 5 seconds PRD auto-save
        }
    };

    // Run on mount, or when mode/alarm time changes
    useEffect(() => {
        resetTimeout();
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [mode, alarmTime]);

    return resetTimeout;
}

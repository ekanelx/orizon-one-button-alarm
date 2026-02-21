import { useAppStore } from '../store/appStore';
import { clsx } from 'clsx';
import { Bell, MinusCircle } from 'lucide-react';

export function StatusChip() {
    const { isEnabled, mode, snoozeTime, coachmarkShown } = useAppStore();

    // Don't show chip in set time or set alarm modes
    if (mode.startsWith('SET_')) return null;

    return (
        <div className="flex flex-col items-center mt-[-8px] h-[48px]">
            <div
                className={clsx(
                    "flex items-center justify-center space-x-1.5 px-[12px] py-[3px] rounded-full border text-[14px] tracking-[-0.28px] font-bold transition-colors duration-300",
                    isEnabled
                        ? "border-[rgba(255,255,255,0.5)] bg-transparent text-white" // ON State
                        : "border-[rgba(255,255,255,0.3)] bg-transparent text-[rgba(255,255,255,0.6)]" // OFF State
                )}
            >
                {isEnabled ? <Bell className="w-[14px] h-[14px]" /> : <MinusCircle className="w-[14px] h-[14px]" />}
                <span>{isEnabled ? 'Alarm ON' : 'Alarm OFF'}</span>
            </div>

            {/* Coachmark below the pill */}
            {mode === 'ALARM' && !isEnabled && !coachmarkShown && (
                <div className="mt-3 text-[18px] text-white font-normal tracking-[-0.36px]">
                    Double-tap to toggle
                </div>
            )}

            {/* Snooze Indicator (Only if SNOOZED and Alarm is ON) */}
            {snoozeTime && isEnabled && (
                <div className="mt-4 text-[16px] text-white font-normal tracking-[-0.32px]">
                    Next alarm {snoozeTime.getHours().toString().padStart(2, '0')}:{snoozeTime.getMinutes().toString().padStart(2, '0')}
                </div>
            )}
        </div>
    );
}

import { useAppStore } from '../store/appStore';
import { clsx } from 'clsx';
import { useAutoSaveTimeout } from '../hooks/useAutoSaveTimeout';

interface TimeDisplayProps {
    time: { h: number; m: number };
}

export function TimeDisplay({ time }: TimeDisplayProps) {
    const { mode } = useAppStore();

    // This hook will manage the auto-save if we are in an editing mode
    useAutoSaveTimeout();

    const isEditingHH = mode === 'SET_ALARM_HH' || mode === 'SET_TIME_HH';
    const isEditingMM = mode === 'SET_ALARM_MM' || mode === 'SET_TIME_MM';

    const hText = time.h.toString().padStart(2, '0');
    const mText = time.m.toString().padStart(2, '0');

    return (
        <div className="flex flex-col items-center justify-center mt-8 mb-6">
            <div className="flex items-start text-[100px] font-bold leading-none tracking-[-2px] tabular-nums">

                {/* Hours Box */}
                <div className="relative flex flex-col items-center">
                    <span className={clsx(
                        "transition-opacity duration-200",
                        (isEditingMM) ? "opacity-30" : "opacity-100"
                    )}>
                        {hText}
                    </span>
                    {/* Active indicator line */}
                    {isEditingHH && (
                        <div className="absolute -bottom-4 left-2 right-2 h-1 bg-white rounded-full animate-pulse" />
                    )}
                    {/* Label */}
                    {isEditingHH && (
                        <span className="absolute -bottom-10 text-[13px] text-gray-400 font-medium tracking-wide">
                            Hours
                        </span>
                    )}
                </div>

                {/* Separator */}
                <span className={clsx(
                    "mx-1 pb-2 transition-opacity duration-200",
                    (isEditingHH || isEditingMM) ? "opacity-30" : "opacity-100"
                )}>
                    :
                </span>

                {/* Minutes Box */}
                <div className="relative flex flex-col items-center">
                    <span className={clsx(
                        "transition-opacity duration-200",
                        (isEditingHH) ? "opacity-30" : "opacity-100"
                    )}>
                        {mText}
                    </span>
                    {/* Active indicator line */}
                    {isEditingMM && (
                        <div className="absolute -bottom-4 left-2 right-2 h-1 bg-white rounded-full animate-pulse" />
                    )}
                    {/* Label */}
                    {isEditingMM && (
                        <span className="absolute -bottom-10 text-[13px] text-gray-400 font-medium tracking-wide">
                            Minutes
                        </span>
                    )}
                </div>

            </div>
        </div>
    );
}

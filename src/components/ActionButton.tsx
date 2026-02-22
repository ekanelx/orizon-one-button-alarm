import { useAppStore } from '../store/appStore';
import { useGestures } from '../hooks/useGestures';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface ActionButtonProps {
    onTap?: () => void;
    onDoubleTap?: () => void;
    onHold?: () => void;
    hintText: string;
}

export function ActionButton({ onTap, onDoubleTap, onHold, hintText }: ActionButtonProps) {
    const { mode } = useAppStore();
    const gestureHandlers = useGestures({ onTap, onDoubleTap, onHold });

    const isRinging = mode === 'RINGING';

    return (
        <div className="absolute bottom-[96px] left-0 right-0 w-full px-4 flex flex-col items-center">
            {/* Action Button Pill */}
            <button
                {...gestureHandlers}
                className={cn(
                    "h-[88px] w-full max-w-[386px] rounded-[44px] font-[700] text-[40px] tracking-[-0.8px] transition-all duration-200 backdrop-blur-md",
                    "active:scale-95 touch-none", // prevent default zoom/scroll on touch
                    isRinging
                        ? "bg-[#FF453A] text-white shadow-[0_0_20px_rgba(255,69,58,0.5)] animate-pulse" // Ringing variant
                        : "bg-[rgba(255,255,255,0.15)] text-white hover:bg-[rgba(255,255,255,0.25)] border border-[rgba(255,255,255,0.1)]" // Glass variant
                )}
            >
                Action
            </button>

            {/* Contextual Hint Text */}
            <div className="mt-4 text-[16px] text-white font-bold tracking-[-0.32px]">
                {hintText}
            </div>
        </div>
    );
}

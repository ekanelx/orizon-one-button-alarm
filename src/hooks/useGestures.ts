import { useRef, useCallback } from 'react';

interface GestureHandlers {
    onTap?: () => void;
    onDoubleTap?: () => void;
    onHold?: () => void;
}

export function useGestures({ onTap, onDoubleTap, onHold }: GestureHandlers) {
    const tapCount = useRef(0);
    const tapTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const holdTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isHolding = useRef(false);
    const isDown = useRef(false);

    // Tunable parameters
    const DOUBLE_TAP_DELAY = 300; // ms
    const HOLD_DELAY = 1000; // ms (>=1s per PRD)

    const clearTimeouts = () => {
        if (tapTimeout.current) clearTimeout(tapTimeout.current);
        if (holdTimeout.current) clearTimeout(holdTimeout.current);
    };

    const startInteraction = useCallback((e: React.TouchEvent | React.MouseEvent) => {
        // Only process primary interactions
        if ('button' in e && e.button !== 0) return;

        // Prevent default on touch to stop browser gestures (scroll, swipe-to-back, zoom)
        // We only prevent default if it's cancelable to avoid console warnings
        if ('touches' in e && e.cancelable) {
            e.preventDefault();
        }

        isDown.current = true;
        isHolding.current = false;

        // Clear previous hold timeout if starting a new one
        if (holdTimeout.current) clearTimeout(holdTimeout.current);

        holdTimeout.current = setTimeout(() => {
            if (isDown.current) {
                isHolding.current = true;
                if (onHold) {
                    // Haptic feedback stub
                    if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
                        window.navigator.vibrate(50); // Stronger haptic for Hold
                    }
                    onHold();
                }
            }
        }, HOLD_DELAY);
    }, [onHold]);

    const endInteraction = useCallback((e: React.TouchEvent | React.MouseEvent) => {
        if ('button' in e && e.button !== 0) return;
        if (!isDown.current) return;

        isDown.current = false;

        if (holdTimeout.current) clearTimeout(holdTimeout.current);

        // If we held the button, don't trigger tap/double-tap logic
        if (isHolding.current) {
            isHolding.current = false;
            return;
        }

        // It was a short press, handle tap logic
        tapCount.current += 1;

        if (tapCount.current === 1) {
            // Start waiting for a potential second tap
            tapTimeout.current = setTimeout(() => {
                // Timeout expired, so it's a single tap
                tapCount.current = 0;
                if (onTap) {
                    // Haptic feedback stub
                    if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
                        window.navigator.vibrate(10); // Light haptic for Tap
                    }
                    onTap();
                }
            }, DOUBLE_TAP_DELAY);
        } else if (tapCount.current === 2) {
            // Second tap arrived before timeout!
            clearTimeouts();
            tapCount.current = 0;
            if (onDoubleTap) {
                // Haptic feedback stub
                if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
                    window.navigator.vibrate([10, 50, 10]); // Distinct haptic
                }
                onDoubleTap();
            } else if (onTap) {
                // If double-tap is not implemented in this context, gracefully fallback to two single taps
                onTap();
                onTap();
            }
        }
    }, [onTap, onDoubleTap]);

    const abortInteraction = useCallback(() => {
        if (!isDown.current) return;
        isDown.current = false;
        if (holdTimeout.current) clearTimeout(holdTimeout.current);
        isHolding.current = false;
    }, []);

    return {
        onTouchStart: startInteraction,
        onTouchEnd: endInteraction,
        onTouchCancel: abortInteraction,
        onMouseDown: startInteraction,
        onMouseUp: endInteraction,
        onMouseLeave: abortInteraction,
    };
}

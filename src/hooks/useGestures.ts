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

    // For deduplication
    const lastTouchTime = useRef(0);
    const lastTapProcessed = useRef<{ at: number; pointerType: string } | null>(null);
    const lastTapAt = useRef<number | null>(null);

    const DOUBLE_TAP_DELAY = 300;
    const HOLD_DELAY = 1000;
    const EMULATED_MOUSE_SUPPRESSION_MS = 700;
    const DUPLICATE_TAP_SUPPRESSION_MS = 120;
    const MIN_DOUBLE_TAP_INTERVAL_MS = 140;

    // Helper to abstract pointer type detection for standard Mouse/Touch events
    const getPointerType = (e: React.TouchEvent | React.MouseEvent) => {
        return 'touches' in e ? 'touch' : 'mouse';
    };

    const shouldIgnoreEvent = (e: React.TouchEvent | React.MouseEvent) => {
        const type = getPointerType(e);
        const now = Date.now();

        if (type === 'touch') {
            lastTouchTime.current = now;
            return false;
        }

        // Ignore synthetic mouse events fired by mobile browsers shortly after touches
        if (type === 'mouse' && now - lastTouchTime.current < EMULATED_MOUSE_SUPPRESSION_MS) {
            return true;
        }

        return false;
    };

    const clearTimeouts = () => {
        if (tapTimeout.current) clearTimeout(tapTimeout.current);
        if (holdTimeout.current) clearTimeout(holdTimeout.current);
    };

    const startInteraction = useCallback((e: React.TouchEvent | React.MouseEvent) => {
        if (shouldIgnoreEvent(e)) return;

        // Only process primary interactions
        if ('button' in e && e.button !== 0) return;

        // Force stop propagation so touches on the button don't bubble to the background
        e.stopPropagation();

        // Critically: stop browser default gestures like swipe-to-back
        // This relies on React TouchEvents (PointerEvents don't support preventDefault like this reliably)
        if ('touches' in e && e.cancelable) {
            e.preventDefault();
        }

        isDown.current = true;
        isHolding.current = false;

        if (holdTimeout.current) clearTimeout(holdTimeout.current);

        holdTimeout.current = setTimeout(() => {
            if (isDown.current) {
                isHolding.current = true;
                if (onHold) {
                    try {
                        if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
                            window.navigator.vibrate(50);
                        }
                    } catch (err) { /* ignore Brave strict shield errors */ }
                    onHold();
                }
            }
        }, HOLD_DELAY);
    }, [onHold]);

    const endInteraction = useCallback((e: React.TouchEvent | React.MouseEvent) => {
        if (shouldIgnoreEvent(e)) return;
        if ('button' in e && e.button !== 0) return;
        if (!isDown.current) return;

        e.stopPropagation();

        isDown.current = false;

        if (holdTimeout.current) clearTimeout(holdTimeout.current);

        if (isHolding.current) {
            isHolding.current = false;
            return;
        }

        const type = getPointerType(e);
        const now = Date.now();

        // Suppress bounce / physical duplicate events
        if (
            lastTapProcessed.current &&
            lastTapProcessed.current.pointerType === type &&
            now - lastTapProcessed.current.at < DUPLICATE_TAP_SUPPRESSION_MS
        ) {
            return;
        }
        lastTapProcessed.current = { at: now, pointerType: type };

        tapCount.current += 1;

        if (tapCount.current === 2 && lastTapAt.current !== null && now - lastTapAt.current < MIN_DOUBLE_TAP_INTERVAL_MS) {
            // Too fast to be a deliberate second tap; treat as duplicated signal.
            tapCount.current = 1;
            return;
        }

        lastTapAt.current = now;

        if (tapCount.current === 1) {
            tapTimeout.current = setTimeout(() => {
                tapCount.current = 0;
                if (onTap) {
                    try {
                        if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
                            window.navigator.vibrate(10);
                        }
                    } catch (err) { /* ignore */ }
                    onTap();
                }
            }, DOUBLE_TAP_DELAY);
        } else if (tapCount.current === 2) {
            clearTimeouts();
            tapCount.current = 0;
            if (onDoubleTap) {
                try {
                    if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
                        window.navigator.vibrate([10, 50, 10]);
                    }
                } catch (err) { /* ignore */ }
                onDoubleTap();
            } else if (onTap) {
                onTap();
                onTap();
            }
        }
    }, [onTap, onDoubleTap]);

    const abortInteraction = useCallback((e?: React.TouchEvent | React.MouseEvent) => {
        if (e && shouldIgnoreEvent(e)) return;
        if (e && 'button' in e && e.button !== 0) return;

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

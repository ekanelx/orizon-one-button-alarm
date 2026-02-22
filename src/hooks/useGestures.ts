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
    const activePointerId = useRef<number | null>(null);
    const lastTouchTime = useRef(0);
    const lastTapProcessed = useRef<{ at: number; pointerType: string } | null>(null);
    const lastTapAt = useRef<number | null>(null);

    // Tunable parameters
    const DOUBLE_TAP_DELAY = 300; // ms
    const HOLD_DELAY = 1000; // ms (>=1s per PRD)
    const EMULATED_MOUSE_SUPPRESSION_MS = 700; // ignore synthetic mouse events after touch
    const DUPLICATE_TAP_SUPPRESSION_MS = 120; // ignore accidental duplicated pointerup for same tap
    const MIN_DOUBLE_TAP_INTERVAL_MS = 140; // avoid classifying one physical tap as double-tap

    const shouldIgnoreEvent = (e: React.PointerEvent) => {
        const now = Date.now();

        if (e.pointerType === 'touch') {
            lastTouchTime.current = now;
            return false;
        }

        // Some mobile browsers emit compatibility mouse events after touch.
        // Those duplicate events can incorrectly promote a single tap to double tap.
        if (e.pointerType === 'mouse' && now - lastTouchTime.current < EMULATED_MOUSE_SUPPRESSION_MS) {
            return true;
        }

        return false;
    };

    const isPrimaryActivation = (e: React.PointerEvent) => {
        if (!e.isPrimary) return false;
        // `button` is only reliable for mouse pointers.
        if (e.pointerType === 'mouse' && e.button !== 0) return false;
        return true;
    };

    const clearTimeouts = () => {
        if (tapTimeout.current) clearTimeout(tapTimeout.current);
        if (holdTimeout.current) clearTimeout(holdTimeout.current);
    };

    const startInteraction = useCallback((e: React.PointerEvent) => {
        if (shouldIgnoreEvent(e)) return;
        if (!isPrimaryActivation(e)) return;

        e.stopPropagation();

        activePointerId.current = e.pointerId;
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

    const endInteraction = useCallback((e: React.PointerEvent) => {
        if (shouldIgnoreEvent(e)) return;
        if (!isPrimaryActivation(e)) return;
        if (activePointerId.current !== null && e.pointerId !== activePointerId.current) return;
        if (!isDown.current) return;

        e.stopPropagation();

        activePointerId.current = null;
        isDown.current = false;

        if (holdTimeout.current) clearTimeout(holdTimeout.current);

        if (isHolding.current) {
            isHolding.current = false;
            return;
        }

        const now = Date.now();
        if (
            lastTapProcessed.current &&
            lastTapProcessed.current.pointerType === e.pointerType &&
            now - lastTapProcessed.current.at < DUPLICATE_TAP_SUPPRESSION_MS
        ) {
            return;
        }
        lastTapProcessed.current = { at: now, pointerType: e.pointerType };

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

    const abortInteraction = useCallback((e: React.PointerEvent) => {
        if (shouldIgnoreEvent(e)) return;
        if (!e.isPrimary) return;
        if (activePointerId.current !== null && e.pointerId !== activePointerId.current) return;
        if (!isDown.current) return;

        activePointerId.current = null;
        isDown.current = false;
        if (holdTimeout.current) clearTimeout(holdTimeout.current);
        isHolding.current = false;
    }, []);

    return {
        onPointerDown: startInteraction,
        onPointerUp: endInteraction,
        onPointerLeave: abortInteraction,
        onPointerCancel: abortInteraction,
    };
}

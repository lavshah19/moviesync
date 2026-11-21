"use client";

import { useRef, useState, type PointerEvent, type MouseEvent } from "react";

const DECIDE_AFTER = 10; // px of movement before we decide sideways vs scroll
const MAX_DRAG = 140;

interface Options {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number; // px past which releasing triggers the action
}

/**
 * Touch/pen swipe on a list row. Mouse is ignored (desktop uses the ⋯ menu).
 * The row needs `touch-action: pan-y` (Tailwind `touch-pan-y`) so the browser keeps vertical
 * scrolling and hands sideways movement to us; the axis is locked after the first 10px, so a
 * scroll never turns into a swipe. A direction with no action only rubber-bands.
 */
export function useSwipe({ onSwipeLeft, onSwipeRight, threshold = 80 }: Options) {
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const start = useRef<{ x: number; y: number; id: number } | null>(null);
  const axis = useRef<"x" | "y" | null>(null);
  const latest = useRef(0);
  const swiped = useRef(false);

  const reset = () => {
    start.current = null;
    axis.current = null;
    latest.current = 0;
    setDx(0);
    setDragging(false);
  };

  const handlers = {
    onPointerDown(e: PointerEvent<HTMLElement>) {
      if (e.pointerType === "mouse" || (!onSwipeLeft && !onSwipeRight)) return;
      start.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
      axis.current = null;
      swiped.current = false;
    },
    onPointerMove(e: PointerEvent<HTMLElement>) {
      const s = start.current;
      if (!s || e.pointerId !== s.id) return;
      const mx = e.clientX - s.x;
      const my = e.clientY - s.y;
      if (!axis.current) {
        if (Math.hypot(mx, my) < DECIDE_AFTER) return;
        axis.current = Math.abs(mx) > Math.abs(my) * 1.5 ? "x" : "y";
        if (axis.current === "x") {
          e.currentTarget.setPointerCapture(e.pointerId);
          setDragging(true);
        }
      }
      if (axis.current !== "x") return;
      const allowed = mx > 0 ? !!onSwipeRight : !!onSwipeLeft;
      const d = Math.max(-MAX_DRAG, Math.min(MAX_DRAG, allowed ? mx : mx / 4));
      latest.current = d;
      swiped.current = true;
      setDx(d);
    },
    onPointerUp() {
      if (axis.current === "x") {
        const d = latest.current;
        if (d <= -threshold) onSwipeLeft?.();
        else if (d >= threshold) onSwipeRight?.();
      }
      reset();
    },
    onPointerCancel: reset,
    // the release after a swipe must not also count as a tap (e.g. ticking the movie)
    onClickCapture(e: MouseEvent<HTMLElement>) {
      if (!swiped.current) return;
      swiped.current = false;
      e.preventDefault();
      e.stopPropagation();
    },
  };

  return { dx, dragging, passed: Math.abs(dx) >= threshold, handlers };
}

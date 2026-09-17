import { useEffect, useState } from "react";

/**
 * SplashCursor works with any pointing device — mouse/trackpad (via
 * pointermove/mousemove) and touch (via touchstart/touchmove) both feed the
 * same fluid simulation. The only real disqualifier is prefers-reduced-motion,
 * and a device with literally no pointing capability at all (any-pointer:
 * none — e.g. some keyboard/remote-only setups), since there's no way to
 * interact with a cursor effect there.
 *
 * Deliberately uses `any-pointer` (checks *every* connected pointing device)
 * rather than the unprefixed `pointer` (only the *primary* one): a
 * touchscreen laptop with a mouse attached can report its primary pointer as
 * coarse touch even while the mouse is fully fine/hover-capable, and a plain
 * `pointer: fine` check would incorrectly exclude it.
 */
export function useFluidCursorEnabled() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const pointerQuery = window.matchMedia("(any-pointer: fine), (any-pointer: coarse)");
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const update = () => setEnabled(pointerQuery.matches && !motionQuery.matches);
    update();

    pointerQuery.addEventListener("change", update);
    motionQuery.addEventListener("change", update);
    return () => {
      pointerQuery.removeEventListener("change", update);
      motionQuery.removeEventListener("change", update);
    };
  }, []);

  return enabled;
}

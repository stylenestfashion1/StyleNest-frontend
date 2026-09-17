import { useEffect, useState } from "react";

/** Tracks whether the given ref's element currently intersects the viewport at all. */
export function useInView(ref, options) {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), options);
    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `options` should be a stable/module-level object; re-observing on every render would defeat the point
  }, [ref]);

  return inView;
}

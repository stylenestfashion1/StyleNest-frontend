import { useEffect, useRef, useState } from "react";

export function Reveal({ children, delay = 0, as: Tag = "div", className = "", style, ...rest }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // rootMargin extends the trigger zone 20% of the viewport height
    // *below* the visible area, so a card is marked shown before it's
    // actually scrolled into view rather than after. IntersectionObserver
    // callbacks are async and can lag behind a fast or direction-reversing
    // scroll; with the old shrink-inward margin ("-8%"), a laggy callback
    // could fire only once the user had already scrolled past the card
    // (or reversed direction), kicking off its reveal transition on an
    // element no longer where it triggered -- reading as a sudden
    // shake/flicker disconnected from the current scroll. Triggering
    // early leaves enough lead time that the callback resolves, and the
    // transition finishes, before the card is actually on screen.
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0, rootMargin: "0px 0px 20% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag ref={ref} className={`reveal ${shown ? "reveal-in" : ""} ${className}`} style={{ transitionDelay: `${delay}ms`, ...style }} {...rest}>
      {children}
    </Tag>
  );
}

export function Skeleton({ className = "" }) {
  return <div className={`skeleton ${className}`} />;
}

export function PageFade({ children }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const t = requestAnimationFrame(() => setOn(true));
    return () => cancelAnimationFrame(t);
  }, []);
  return (
    <div style={{ opacity: on ? 1 : 0, transition: "opacity 0.7s cubic-bezier(0.22,1,0.36,1)" }}>{children}</div>
  );
}

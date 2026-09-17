// Based on the React Bits "ScrollStack" component (@react-bits/ScrollStack-JS-TW).
// Live in production via CategoryScrollStack, mounted on both the Men and
// Women home pages. Requires the `lenis` npm package (a real dependency —
// see package.json).
import { useLayoutEffect, useRef, useCallback } from 'react';
import Lenis from 'lenis';

const prefersCoarsePointer = () =>
  typeof window !== 'undefined' && (window.matchMedia?.('(pointer: coarse)').matches ?? false);

export const ScrollStackItem = ({ children, itemClassName = '' }) => (
  <div
    className={`scroll-stack-card relative w-full h-80 my-8 p-12 rounded-[40px] shadow-[0_0_30px_rgba(0,0,0,0.1)] box-border origin-top will-change-transform ${itemClassName}`.trim()}
    style={{
      backfaceVisibility: 'hidden',
      transformStyle: 'preserve-3d'
    }}
  >
    {children}
  </div>
);

const ScrollStack = ({
  children,
  className = '',
  itemDistance = 100,
  itemScale = 0.03,
  itemStackDistance = 30,
  stackPosition = '20%',
  scaleEndPosition = '10%',
  baseScale = 0.85,
  scaleDuration = 0.5,
  rotationAmount = 0,
  blurAmount = 0,
  useWindowScroll = false,
  onStackComplete
}) => {
  const scrollerRef = useRef(null);
  const stackCompletedRef = useRef(false);
  const animationFrameRef = useRef(null);
  const lenisRef = useRef(null);
  const cardsRef = useRef([]);
  const lastTransformsRef = useRef(new Map());
  const isUpdatingRef = useRef(false);
  const nativeScrollCleanupRef = useRef(null);

  const calculateProgress = useCallback((scrollTop, start, end) => {
    if (scrollTop < start) return 0;
    if (scrollTop > end) return 1;
    return (scrollTop - start) / (end - start);
  }, []);

  const parsePercentage = useCallback((value, containerHeight) => {
    if (typeof value === 'string' && value.includes('%')) {
      return (parseFloat(value) / 100) * containerHeight;
    }
    return parseFloat(value);
  }, []);

  const getScrollData = useCallback(() => {
    if (useWindowScroll) {
      return {
        scrollTop: window.scrollY,
        containerHeight: window.innerHeight,
        scrollContainer: document.documentElement
      };
    } else {
      const scroller = scrollerRef.current;
      return {
        scrollTop: scroller.scrollTop,
        containerHeight: scroller.clientHeight,
        scrollContainer: scroller
      };
    }
  }, [useWindowScroll]);

  const getElementOffset = useCallback(
    element => {
      if (useWindowScroll) {
        // offsetTop (summed up the offsetParent chain) is the element's
        // natural document-flow position and is immune to any CSS transform
        // already applied to it. getBoundingClientRect() is NOT — it
        // reports the current *painted* position, which already includes
        // this frame's translate3d/scale. Reading it here would feed each
        // frame's applied transform back into the next frame's position
        // calculation, compounding into visible shake as a card moves.
        let offset = 0;
        let node = element;
        while (node) {
          offset += node.offsetTop;
          node = node.offsetParent;
        }
        return offset;
      } else {
        return element.offsetTop;
      }
    },
    [useWindowScroll]
  );

  // Card/end-marker document-flow offsets don't change while scrolling —
  // only on resize/layout shift — so they're measured once (below) and
  // reused every scroll frame instead of re-measuring (and re-triggering
  // layout) on every single update.
  const cardOffsetsRef = useRef([]);
  const endOffsetRef = useRef(0);

  const measureOffsets = useCallback(() => {
    cardOffsetsRef.current = cardsRef.current.map(card => getElementOffset(card));
    // Same scoping as the card query above — this instance's own end marker,
    // never another mounted ScrollStack's.
    const endElement = scrollerRef.current?.querySelector('.scroll-stack-end');
    endOffsetRef.current = endElement ? getElementOffset(endElement) : 0;
  }, [getElementOffset]);

  const updateCardTransforms = useCallback(() => {
    if (!cardsRef.current.length || isUpdatingRef.current) return;

    isUpdatingRef.current = true;

    const { scrollTop, containerHeight } = getScrollData();
    const stackPositionPx = parsePercentage(stackPosition, containerHeight);
    const scaleEndPositionPx = parsePercentage(scaleEndPosition, containerHeight);

    const endElementTop = endOffsetRef.current;

    cardsRef.current.forEach((card, i) => {
      if (!card) return;

      const cardTop = cardOffsetsRef.current[i] ?? 0;
      const triggerStart = cardTop - stackPositionPx - itemStackDistance * i;
      const triggerEnd = cardTop - scaleEndPositionPx;
      const pinStart = cardTop - stackPositionPx - itemStackDistance * i;
      const pinEnd = endElementTop - containerHeight / 2;

      const scaleProgress = calculateProgress(scrollTop, triggerStart, triggerEnd);
      const targetScale = baseScale + i * itemScale;
      const scale = 1 - scaleProgress * (1 - targetScale);
      const rotation = rotationAmount ? i * rotationAmount * scaleProgress : 0;

      let blur = 0;
      if (blurAmount) {
        let topCardIndex = 0;
        for (let j = 0; j < cardsRef.current.length; j++) {
          const jCardTop = cardOffsetsRef.current[j] ?? 0;
          const jTriggerStart = jCardTop - stackPositionPx - itemStackDistance * j;
          if (scrollTop >= jTriggerStart) {
            topCardIndex = j;
          }
        }

        if (i < topCardIndex) {
          const depthInStack = topCardIndex - i;
          blur = Math.max(0, depthInStack * blurAmount);
        }
      }

      let translateY = 0;
      const isPinned = scrollTop >= pinStart && scrollTop <= pinEnd;

      if (isPinned) {
        translateY = scrollTop - cardTop + stackPositionPx + itemStackDistance * i;
      } else if (scrollTop > pinEnd) {
        translateY = pinEnd - cardTop + stackPositionPx + itemStackDistance * i;
      }

      const newTransform = {
        translateY: Math.round(translateY * 100) / 100,
        scale: Math.round(scale * 1000) / 1000,
        rotation: Math.round(rotation * 100) / 100,
        blur: Math.round(blur * 100) / 100
      };

      const lastTransform = lastTransformsRef.current.get(i);
      const hasChanged =
        !lastTransform ||
        Math.abs(lastTransform.translateY - newTransform.translateY) > 0.1 ||
        Math.abs(lastTransform.scale - newTransform.scale) > 0.001 ||
        Math.abs(lastTransform.rotation - newTransform.rotation) > 0.1 ||
        Math.abs(lastTransform.blur - newTransform.blur) > 0.1;

      if (hasChanged) {
        const transform = `translate3d(0, ${newTransform.translateY}px, 0) scale(${newTransform.scale}) rotate(${newTransform.rotation}deg)`;
        const filter = newTransform.blur > 0 ? `blur(${newTransform.blur}px)` : '';

        card.style.transform = transform;
        card.style.filter = filter;

        lastTransformsRef.current.set(i, newTransform);
      }

      if (i === cardsRef.current.length - 1) {
        const isInView = scrollTop >= pinStart && scrollTop <= pinEnd;
        if (isInView && !stackCompletedRef.current) {
          stackCompletedRef.current = true;
          onStackComplete?.();
        } else if (!isInView && stackCompletedRef.current) {
          stackCompletedRef.current = false;
        }
      }
    });

    isUpdatingRef.current = false;
  }, [
    itemScale,
    itemStackDistance,
    stackPosition,
    scaleEndPosition,
    baseScale,
    rotationAmount,
    blurAmount,
    onStackComplete,
    calculateProgress,
    parsePercentage,
    getScrollData
  ]);

  const handleScroll = useCallback(() => {
    updateCardTransforms();
  }, [updateCardTransforms]);

  // In useWindowScroll mode, Lenis takes over window scrolling entirely —
  // a native window.scrollTo() call from elsewhere (e.g. the header's
  // "back to top" button) gets fought by Lenis's own per-frame scroll-
  // position loop and has no lasting effect. This lets any such request
  // redirect Lenis's own target instead, via the same custom-DOM-event
  // pattern this codebase already uses for cross-component signaling
  // (see the header's "stylenest:cart-bump" listener).
  const handleScrollToTopRequest = useCallback(e => {
    lenisRef.current?.scrollTo(0, { immediate: e.detail?.immediate });
  }, []);

  const setupLenis = useCallback(() => {
    if (useWindowScroll) {
      // Lenis's synthetic touch handling (syncTouch/touchMultiplier) replaces
      // the browser's own compositor-driven momentum scroll with a JS-driven
      // simulation -- on mobile this reliably feels laggier/jaggier than
      // native touch scrolling, which is already smooth on its own. Lenis is
      // genuinely valuable for desktop wheel input (turning discrete wheel
      // ticks into inertia), so it stays there; on coarse-pointer (touch)
      // devices we skip Lenis entirely and drive the pin/scale math straight
      // off native scroll events instead. The stack's visual effect is
      // unaffected either way -- updateCardTransforms only ever reads
      // scrollTop -- and this also removes Lenis's own permanent 60fps `raf`
      // loop, which otherwise keeps running full-time (even while the page
      // is completely idle) for as long as this component is mounted.
      if (prefersCoarsePointer()) {
        const onNativeScroll = () => {
          if (animationFrameRef.current) return;
          animationFrameRef.current = requestAnimationFrame(() => {
            animationFrameRef.current = null;
            updateCardTransforms();
          });
        };
        window.addEventListener('scroll', onNativeScroll, { passive: true });
        nativeScrollCleanupRef.current = () => window.removeEventListener('scroll', onNativeScroll);
        return null;
      }

      const lenis = new Lenis({
        duration: 1.2,
        easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        touchMultiplier: 2,
        infinite: false,
        wheelMultiplier: 1,
        lerp: 0.1,
        syncTouch: true,
        syncTouchLerp: 0.075
      });

      lenis.on('scroll', handleScroll);

      const raf = time => {
        lenis.raf(time);
        animationFrameRef.current = requestAnimationFrame(raf);
      };
      animationFrameRef.current = requestAnimationFrame(raf);

      lenisRef.current = lenis;
      return lenis;
    } else {
      const scroller = scrollerRef.current;
      if (!scroller) return;

      const lenis = new Lenis({
        wrapper: scroller,
        content: scroller.querySelector('.scroll-stack-inner'),
        duration: 1.2,
        easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        touchMultiplier: 2,
        infinite: false,
        wheelMultiplier: 1,
        lerp: 0.1,
        syncTouch: true,
        syncTouchLerp: 0.075
      });

      lenis.on('scroll', handleScroll);

      const raf = time => {
        lenis.raf(time);
        animationFrameRef.current = requestAnimationFrame(raf);
      };
      animationFrameRef.current = requestAnimationFrame(raf);

      lenisRef.current = lenis;
      return lenis;
    }
  }, [handleScroll, useWindowScroll, updateCardTransforms]);

  useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    // Always scoped to this instance's own container, even in useWindowScroll
    // mode (where the *page* scrolls but the cards still live inside
    // `scroller`) — querying `document` here would pick up any other
    // ScrollStack's cards too (e.g. Men's and Women's home pages both mount
    // one), driving stale/foreign nodes with this instance's Lenis loop.
    const cards = Array.from(scroller.querySelectorAll('.scroll-stack-card'));

    cardsRef.current = cards;
    const transformsCache = lastTransformsRef.current;

    cards.forEach((card, i) => {
      if (i < cards.length - 1) {
        card.style.marginBottom = `${itemDistance}px`;
      }
      card.style.willChange = 'transform, filter';
      card.style.transformOrigin = 'top center';
      card.style.backfaceVisibility = 'hidden';
      card.style.transform = 'translateZ(0)';
      card.style.webkitTransform = 'translateZ(0)';
      card.style.perspective = '1000px';
      card.style.webkitPerspective = '1000px';
    });

    measureOffsets();
    setupLenis();

    updateCardTransforms();

    // Card document-flow offsets only change on resize/reflow, not on
    // scroll — re-measure then, rather than on every scroll frame.
    const handleResize = () => {
      measureOffsets();
      updateCardTransforms();
    };
    window.addEventListener('resize', handleResize);
    if (useWindowScroll) {
      window.addEventListener('stylenest:scroll-to-top', handleScrollToTopRequest);
    }

    // The initial measureOffsets() above runs synchronously in this
    // useLayoutEffect, before the page's images (this section's own card
    // photos, and anything above it — the hero, ScrollExpand media, etc.)
    // have necessarily finished loading. Each image that loads after that
    // point grows the document's real height, silently invalidating the
    // cached card/end offsets — nothing about a window 'resize' fires for
    // that. Once stale, every card's pin/scale math is computed against a
    // scroll range that no longer matches the actual page, which reads as
    // cards being stuck off-screen or mid-transition forever. A
    // ResizeObserver on <body> catches that exact class of layout change
    // (image loads, fonts swapping in, any async content) regardless of
    // where on the page it happens, and re-measures when it does.
    const bodyResizeObserver = new ResizeObserver(handleResize);
    bodyResizeObserver.observe(document.body);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (useWindowScroll) {
        window.removeEventListener('stylenest:scroll-to-top', handleScrollToTopRequest);
      }
      bodyResizeObserver.disconnect();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (lenisRef.current) {
        lenisRef.current.destroy();
      }
      if (nativeScrollCleanupRef.current) {
        nativeScrollCleanupRef.current();
        nativeScrollCleanupRef.current = null;
      }
      stackCompletedRef.current = false;
      cardsRef.current = [];
      transformsCache.clear();
      isUpdatingRef.current = false;
    };
  }, [
    itemDistance,
    itemScale,
    itemStackDistance,
    stackPosition,
    scaleEndPosition,
    baseScale,
    scaleDuration,
    rotationAmount,
    blurAmount,
    useWindowScroll,
    onStackComplete,
    setupLenis,
    updateCardTransforms,
    measureOffsets,
    handleScrollToTopRequest
  ]);

  // Container styles based on scroll mode
  const containerStyles = useWindowScroll
    ? {
        // Global scroll mode - no overflow constraints
        overscrollBehavior: 'contain',
        WebkitOverflowScrolling: 'touch',
        WebkitTransform: 'translateZ(0)',
        transform: 'translateZ(0)'
      }
    : {
        // Container scroll mode - original behavior
        overscrollBehavior: 'contain',
        WebkitOverflowScrolling: 'touch',
        scrollBehavior: 'smooth',
        WebkitTransform: 'translateZ(0)',
        transform: 'translateZ(0)',
        willChange: 'scroll-position'
      };

  const containerClassName = useWindowScroll
    ? `relative w-full ${className}`.trim()
    : `relative w-full h-full overflow-y-auto overflow-x-visible ${className}`.trim();

  return (
    <div className={containerClassName} ref={scrollerRef} style={containerStyles}>
      <div className="scroll-stack-inner pt-[20vh] px-5 sm:px-10 md:px-16 lg:px-20 pb-[50rem] min-h-screen">
        {children}
        {/* Spacer so the last pin can release cleanly */}
        <div className="scroll-stack-end w-full h-px" />
      </div>
    </div>
  );
};

export default ScrollStack;

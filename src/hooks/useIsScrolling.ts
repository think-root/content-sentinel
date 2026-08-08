import { useEffect, useState } from 'react';

/**
 * True while the window is being scrolled, false once it has been still for
 * `idleDelay`.
 *
 * Cheap despite firing on every scroll event: `setIsScrolling(true)` bails out
 * in React when the value is unchanged, so a gesture costs exactly two renders -
 * one at the start, one at the end - not one per event.
 */
export function useIsScrolling(idleDelay = 150) {
  const [isScrolling, setIsScrolling] = useState(false);

  useEffect(() => {
    let idleTimer = 0;

    const handleScroll = () => {
      setIsScrolling(true);
      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => setIsScrolling(false), idleDelay);
    };

    // passive: this listener never calls preventDefault, and saying so keeps it
    // off the critical path of the scroll itself.
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.clearTimeout(idleTimer);
    };
  }, [idleDelay]);

  return isScrolling;
}

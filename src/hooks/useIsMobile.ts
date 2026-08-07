import { useState, useEffect } from 'react';

/**
 * Must stay identical to the `md` screen in tailwind.config.js, or JS-driven
 * behaviour (swipe navigation, chart sizing) disagrees with the CSS layout.
 * Height is part of the test on purpose: a phone in landscape is 844x390 and
 * would otherwise count as a desktop. See the comment on `screens.md` there.
 */
const DESKTOP_QUERY = '(min-width: 768px) and (min-height: 500px)';

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return !window.matchMedia(DESKTOP_QUERY).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // matchMedia rather than a resize listener: it fires on orientation change
    // and on height-only changes (iOS toolbar collapse), which `resize` alone
    // does not reliably report.
    const mql = window.matchMedia(DESKTOP_QUERY);
    const handleChange = () => setIsMobile(!mql.matches);

    mql.addEventListener('change', handleChange);
    handleChange();

    return () => mql.removeEventListener('change', handleChange);
  }, []);

  return isMobile;
}

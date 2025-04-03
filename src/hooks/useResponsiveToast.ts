import { useEffect, useState } from 'react';

export function useResponsiveToast() {
  const [position, setPosition] = useState<'top-right' | 'top-center'>('top-right');

  useEffect(() => {
    const checkWidth = () => {
      if (window.innerWidth <= 768) {
        setPosition('top-center');
      } else {
        setPosition('top-right');
      }
    };

    checkWidth();

    window.addEventListener('resize', checkWidth);

    return () => {
      window.removeEventListener('resize', checkWidth);
    };
  }, []);

  return position;
}

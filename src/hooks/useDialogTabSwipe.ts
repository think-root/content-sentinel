import { useState } from 'react';
import { useSwipeable } from 'react-swipeable';
import { useSwipeableTabs } from './useSwipeableTabs';

const isMobileDevice = () =>
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

const isSelectingText = () => {
  const selection = window.getSelection();
  return Boolean(selection && selection.toString().length > 0);
};

/**
 * Swiping between the tabs of a dialog on mobile devices. Only a clearly
 * horizontal swipe changes the tab, so vertical scrolling and text selection
 * keep working; `isSwiping` lets the dialog ignore the outside click a swipe
 * can end with.
 */
export function useDialogTabSwipe<T extends string>(
  tabs: T[],
  activeTab: T,
  setActiveTab: (tab: T) => void
) {
  const [isSwiping, setIsSwiping] = useState(false);
  const [lastSwipeDir, setLastSwipeDir] = useState<'left' | 'right' | null>(null);
  const [animateOnSwipe, setAnimateOnSwipe] = useState(false);
  const { onSwipedLeft, onSwipedRight } = useSwipeableTabs(
    activeTab,
    setActiveTab as (tab: string) => void,
    tabs
  );

  const handleSwipe = (direction: 'left' | 'right', deltaX: number, deltaY: number) => {
    if (isSelectingText() || !isMobileDevice()) return;
    if (Math.abs(deltaX) <= Math.abs(deltaY) || Math.abs(deltaX) <= 100) return;

    setLastSwipeDir(direction);
    setAnimateOnSwipe(true);
    if (direction === 'left') {
      onSwipedLeft();
    } else {
      onSwipedRight();
    }
    setTimeout(() => setAnimateOnSwipe(false), 300);
  };

  const handlers = useSwipeable({
    onSwipeStart: ({ deltaX, deltaY }) => {
      if (isSelectingText() || !isMobileDevice()) return;
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
        setIsSwiping(true);
      }
    },
    onSwiped: () => {
      if (isMobileDevice()) {
        setIsSwiping(false);
      }
    },
    onSwipedLeft: ({ deltaX, deltaY }) => handleSwipe('left', deltaX, deltaY),
    onSwipedRight: ({ deltaX, deltaY }) => handleSwipe('right', deltaX, deltaY),
    preventScrollOnSwipe: false,
    trackMouse: false,
  });

  const animationClass = isMobileDevice() && animateOnSwipe
    ? lastSwipeDir === 'left'
      ? 'motion-safe:animate-slide-fade-in-from-left'
      : lastSwipeDir === 'right'
        ? 'motion-safe:animate-slide-fade-in-from-right'
        : ''
    : '';

  return {
    handlers,
    isSwiping,
    resetSwipe: () => setIsSwiping(false),
    animationClass,
  };
}

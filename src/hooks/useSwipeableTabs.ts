/**
 * useSwipeableTabs
 * Returns swipe handlers for navigating ordered tab keys.
 * Intended to be used with react-swipeable in mobile contexts.
 */
import { useCallback } from 'react';

export type TabKey = string;

export interface SwipeHandlers {
  onSwipedLeft: () => void;
  onSwipedRight: () => void;
}

/**
 * Provides left/right swipe handlers to change tabs based on the ordered array.
 *
 * @param activeTab - currently selected tab key
 * @param setActiveTab - setter to change active tab
 * @param orderedTabs - list of tab keys in display order
 */
export function useSwipeableTabs(
  activeTab: TabKey,
  setActiveTab: (tab: TabKey) => void,
  orderedTabs: TabKey[],
): SwipeHandlers {
  const currentIndex =
    orderedTabs.includes(activeTab) ? orderedTabs.indexOf(activeTab) : 0;

  const onSwipedLeft = useCallback(() => {
    const nextIndex = Math.min(currentIndex + 1, orderedTabs.length - 1);
    if (nextIndex !== currentIndex) {
      setActiveTab(orderedTabs[nextIndex]);
    }
  }, [currentIndex, orderedTabs, setActiveTab]);

  const onSwipedRight = useCallback(() => {
    const prevIndex = Math.max(currentIndex - 1, 0);
    if (prevIndex !== currentIndex) {
      setActiveTab(orderedTabs[prevIndex]);
    }
  }, [currentIndex, orderedTabs, setActiveTab]);

  return { onSwipedLeft, onSwipedRight };
}
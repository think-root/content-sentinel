import { useSwipeable } from 'react-swipeable';

interface NavEdgeSwipeZoneProps {
  onOpen: () => void;
}

/**
 * Invisible strip pinned to the right viewport edge. Swiping inward from it
 * (a left swipe) opens the mobile nav drawer.
 *
 * It sits above page content so touchstart never reaches the content tab-swipe
 * handler - the two gestures stay structurally disjoint, no flag coordination.
 * A separate strip is required because the content handler lives inside
 * `<main className="px-3 …">`, so touches in the outermost ~12px never hit it.
 */
export const NavEdgeSwipeZone = ({ onOpen }: NavEdgeSwipeZoneProps) => {
  const edgeHandlers = useSwipeable({
    onSwipedLeft: onOpen,
    trackMouse: false,
    preventScrollOnSwipe: false,
    delta: 30,
  });

  return (
    <div
      {...edgeHandlers}
      aria-hidden="true"
      className="md:hidden fixed inset-y-0 right-0 z-30 w-6 touch-pan-y bg-transparent"
    />
  );
};

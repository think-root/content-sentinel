import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { useSwipeable } from 'react-swipeable';
import { TabsList } from '../base/tabs';
import { TooltipProvider } from '../base/tooltip';
import { Button } from '../base/button';
import { NavTabTrigger } from './nav-tab-trigger';
import { NAV_ITEMS } from '@/config/nav-items';

interface MobileNavDrawerProps {
  open: boolean;
  onClose: () => void;
  hasUnsavedSettingsChanges: boolean;
}

export const MobileNavDrawer = ({ open, onClose, hasUnsavedSettingsChanges }: MobileNavDrawerProps) => {
  // Swipe right closes the drawer. Attached to an inner wrapper - useSwipeable
  // owns its own ref and cannot be spread onto DialogPrimitive.Content.
  const closeSwipeHandlers = useSwipeable({
    onSwipedRight: onClose,
    trackMouse: false,
    delta: 40,
  });

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0"
        />
        <DialogPrimitive.Content
          className="fixed inset-y-0 right-0 z-50 flex h-full w-72 max-w-[80vw] flex-col gap-2 border-l bg-background p-4 shadow-lg duration-300 data-[state=open]:animate-in data-[state=open]:slide-in-from-right-full data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right-full"
        >
          <DialogPrimitive.Title className="sr-only">Navigation</DialogPrimitive.Title>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Navigation</span>
            <DialogPrimitive.Close asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Close navigation">
                <X className="h-4 w-4" />
              </Button>
            </DialogPrimitive.Close>
          </div>
          <div {...closeSwipeHandlers} className="flex-1">
            <TooltipProvider>
              <TabsList className="flex w-full flex-col items-stretch justify-start h-auto gap-1 bg-transparent p-0 text-muted-foreground">
                {NAV_ITEMS.map((item) => (
                  <NavTabTrigger
                    key={item.key}
                    item={item}
                    onSelect={onClose}
                    showUnsavedMarker={item.key === 'settings' && hasUnsavedSettingsChanges}
                  />
                ))}
              </TabsList>
            </TooltipProvider>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};

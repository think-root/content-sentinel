import { TabsTrigger } from '../base/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '../base/tooltip';
import type { NavItem } from '@/config/nav-items';

interface NavTabTriggerProps {
  item: NavItem;
  /** Adds the ` *` marker and the "unsaved changes" tooltip (AI Settings only) */
  showUnsavedMarker?: boolean;
  /** Called on click in addition to onValueChange - fires even for the already active tab */
  onSelect?: () => void;
}

export const NavTabTrigger = ({ item, showUnsavedMarker = false, onSelect }: NavTabTriggerProps) => {
  const Icon = item.icon;

  const trigger = (
    <TabsTrigger
      value={item.key}
      onClick={onSelect}
      className="w-full justify-start gap-3 h-10 px-3 text-sm data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span className="truncate">
        {item.label}
        {showUnsavedMarker && ' *'}
      </span>
    </TabsTrigger>
  );

  if (!showUnsavedMarker) {
    return trigger;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{trigger}</TooltipTrigger>
      <TooltipContent>
        <p>You have unsaved changes</p>
      </TooltipContent>
    </Tooltip>
  );
};

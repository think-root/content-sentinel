import { TabsList } from '../base/tabs';
import { TooltipProvider } from '../base/tooltip';
import { Card } from './card';
import { NavTabTrigger } from './nav-tab-trigger';
import { NAV_ITEMS } from '@/config/nav-items';

interface DashboardSidebarProps {
  hasUnsavedSettingsChanges: boolean;
}

export const DashboardSidebar = ({ hasUnsavedSettingsChanges }: DashboardSidebarProps) => (
  <aside className="hidden md:block w-60 shrink-0 md:sticky md:top-6 self-start">
    <Card className="p-2">
      <TooltipProvider>
        <TabsList className="flex w-full flex-col items-stretch justify-start h-auto gap-1 bg-transparent p-0 text-muted-foreground">
          {NAV_ITEMS.map((item) => (
            <NavTabTrigger
              key={item.key}
              item={item}
              showUnsavedMarker={item.key === 'settings' && hasUnsavedSettingsChanges}
            />
          ))}
        </TabsList>
      </TooltipProvider>
    </Card>
  </aside>
);

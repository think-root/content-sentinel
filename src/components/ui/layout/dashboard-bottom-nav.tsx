import { NAV_ITEMS, type DashboardTabKey } from '@/config/nav-items';

interface DashboardBottomNavProps {
  activeTab: DashboardTabKey;
  onSelect: (tab: DashboardTabKey) => void;
  hasUnsavedSettingsChanges: boolean;
}

/**
 * Mobile navigation: a permanently visible bottom bar, replacing the old
 * summon-a-drawer flow.
 *
 * Deliberately NOT built on Radix `TabsTrigger` like the desktop sidebar is.
 * The app has a single `Tabs` root with `orientation="vertical"`, and
 * `orientation` is a root-level prop: a second, horizontal `TabsList` inside
 * that root would inherit `aria-orientation="vertical"` (so arrow keys would be
 * up/down) and would duplicate every trigger's `id` and `aria-controls`, leaving
 * each panel's `aria-labelledby` pointing at an ambiguous pair. Plain buttons
 * plus `aria-current` keep the desktop nav byte-identical and the a11y tree
 * unambiguous; Radix's roving tabindex buys nothing on a touch device.
 *
 * Six equal `flex-1` slots inside the bar's safe-area padding: (320 - 32) / 6 =
 * 48px wide and ~52px tall at the narrowest supported width, both clear the 44px
 * minimum touch target, so all six destinations stay visible - no overflow menu
 * and no scroll strip, which would reintroduce the drawer's discoverability
 * problem. `shortLabel` exists in nav-items.ts for exactly this. Bar height is
 * owned by `--bottom-nav-h` in index.css so page padding and toast offsets can
 * read it, and the insets by `.bottom-nav-insets` - see the note there for why
 * the horizontal floor is not just `env()`.
 */
export const DashboardBottomNav = ({
  activeTab,
  onSelect,
  hasUnsavedSettingsChanges,
}: DashboardBottomNavProps) => (
  <nav
    aria-label="Main navigation"
    className="bottom-nav-insets md:hidden fixed inset-x-0 bottom-0 z-40 flex h-[var(--bottom-nav-h)] items-stretch border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
  >
    {NAV_ITEMS.map((item) => {
      const Icon = item.icon;
      const isActive = item.key === activeTab;

      return (
        <button
          key={item.key}
          type="button"
          onClick={() => onSelect(item.key)}
          aria-current={isActive ? 'page' : undefined}
          className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-0.5 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring-subtle ${
            isActive ? 'text-primary' : 'text-muted-foreground'
          }`}
        >
          <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
          <span className="max-w-full truncate text-[10px] font-medium leading-none">
            {item.shortLabel}
            {item.key === 'settings' && hasUnsavedSettingsChanges && ' *'}
          </span>
        </button>
      );
    })}
  </nav>
);

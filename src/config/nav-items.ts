import { Gauge, FolderGit2, Clock, Plug, Bot, type LucideIcon } from 'lucide-react';

export type DashboardTabKey =
  | 'overview'
  | 'repositories'
  | 'automation'
  | 'integrations'
  | 'settings';

export interface NavItem {
  key: DashboardTabKey;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
}

export const NAV_ITEMS = [
  { key: 'overview', label: 'Overview', shortLabel: 'Overview', icon: Gauge },
  { key: 'repositories', label: 'Repositories', shortLabel: 'Repos', icon: FolderGit2 },
  { key: 'automation', label: 'Cron', shortLabel: 'Cron', icon: Clock },
  { key: 'integrations', label: 'Integrations', shortLabel: 'APIs', icon: Plug },
  { key: 'settings', label: 'AI Settings', shortLabel: 'AI', icon: Bot },
] as const satisfies readonly NavItem[];

export const NAV_KEYS = NAV_ITEMS.map((item) => item.key) as DashboardTabKey[];

export const DEFAULT_TAB: DashboardTabKey = 'overview';

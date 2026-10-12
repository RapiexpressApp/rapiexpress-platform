import type { LucideIcon } from 'lucide-react';

import type { PanelRole } from './roles';

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  roles: readonly PanelRole[];
}

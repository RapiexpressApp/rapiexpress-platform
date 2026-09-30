import type { LucideIcon } from 'lucide-react';

export interface NavItem {
  label: string;
  mobileLabel: string;
  to: string;
  icon: LucideIcon;
  showInMobileNav: boolean;
}

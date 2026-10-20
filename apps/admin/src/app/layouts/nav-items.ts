import { PackageCheck, Users, UserSquare } from 'lucide-react';

import type { NavItem } from '@/shared/model/nav-item';
import type { PanelRole } from '@/shared/model/roles';

export const NAV_ITEMS: NavItem[] = [
  {
    label: 'Recepción',
    to: '/recepcion',
    icon: PackageCheck,
    roles: ['ADMIN', 'OPERATIONS', 'WAREHOUSE'],
  },
  { label: 'Usuarios', to: '/usuarios', icon: Users, roles: ['ADMIN'] },
  { label: 'Clientes', to: '/clientes', icon: UserSquare, roles: ['ADMIN', 'OPERATIONS'] },
];

export function getNavItems(role: PanelRole): NavItem[] {
  return NAV_ITEMS.filter((item) => item.roles.includes(role));
}

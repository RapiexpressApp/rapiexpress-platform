import { ClipboardList, CreditCard, LayoutDashboard, MapPin, Package, Search } from 'lucide-react';

import type { NavItem } from '@/shared/model/nav-item';

export const NAV_ITEMS: NavItem[] = [
  {
    label: 'Panel principal',
    mobileLabel: 'Panel',
    to: '/dashboard',
    icon: LayoutDashboard,
    showInMobileNav: true,
  },
  {
    label: 'Mis envíos',
    mobileLabel: 'Envíos',
    to: '/shipments',
    icon: Package,
    showInMobileNav: true,
  },
  {
    label: 'Rastrear guía',
    mobileLabel: 'Rastrear',
    to: '/tracking',
    icon: Search,
    showInMobileNav: true,
  },
  {
    label: 'Pre-alertas',
    mobileLabel: 'Pre-alertas',
    to: '/pre-alerts',
    icon: ClipboardList,
    showInMobileNav: true,
  },
  {
    label: 'Casillero',
    mobileLabel: 'Casillero',
    to: '/locker',
    icon: MapPin,
    showInMobileNav: true,
  },
  {
    label: 'Facturación',
    mobileLabel: 'Facturación',
    to: '/billing',
    icon: CreditCard,
    showInMobileNav: false,
  },
];

export const STAFF_ROLES = ['ADMIN', 'OPERATIONS', 'WAREHOUSE'] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];

export const PANEL_ROLES = ['ADMIN', 'OPERATIONS'] as const;

export type PanelRole = (typeof PANEL_ROLES)[number];

export const ROLE_LABELS: Record<StaffRole, string> = {
  ADMIN: 'Administrador',
  OPERATIONS: 'Operaciones',
  WAREHOUSE: 'Bodega',
};

export function isPanelRole(role: string): role is PanelRole {
  return (PANEL_ROLES as readonly string[]).includes(role);
}

export function getRoleLabel(role: string): string {
  return role in ROLE_LABELS ? ROLE_LABELS[role as StaffRole] : role;
}

export const DEFAULT_ROUTE: Record<PanelRole, string> = {
  ADMIN: '/usuarios',
  OPERATIONS: '/clientes',
};

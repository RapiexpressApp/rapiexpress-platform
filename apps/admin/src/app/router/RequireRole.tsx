import { Navigate, Outlet } from 'react-router';

import { useMe } from '@/features/auth/model/use-me';
import { DEFAULT_ROUTE, isPanelRole, type PanelRole } from '@/shared/model/roles';

interface RequireRoleProps {
  allow: readonly PanelRole[];
}

function RequireRole({ allow }: RequireRoleProps) {
  const { data: profile } = useMe();

  if (!profile || !isPanelRole(profile.role)) return null;
  if (!allow.includes(profile.role)) return <Navigate to={DEFAULT_ROUTE[profile.role]} replace />;
  return <Outlet />;
}

export default RequireRole;

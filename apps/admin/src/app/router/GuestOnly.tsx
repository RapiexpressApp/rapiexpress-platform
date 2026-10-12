import { useSession } from '@rapiexpress/api-client/session-context';
import { Navigate, Outlet } from 'react-router';

import { useMe } from '@/features/auth/model/use-me';
import { DEFAULT_ROUTE, isPanelRole } from '@/shared/model/roles';

import SessionLoading from './SessionLoading';

function GuestOnly() {
  const { status } = useSession();
  const { data: profile } = useMe();

  if (status === 'loading') return <SessionLoading />;
  if (status === 'authenticated' && profile && isPanelRole(profile.role)) {
    return <Navigate to={DEFAULT_ROUTE[profile.role]} replace />;
  }
  return <Outlet />;
}

export default GuestOnly;

import { useSession } from '@rapiexpress/api-client/session-context';
import { useEffect, useRef } from 'react';
import { Navigate, Outlet } from 'react-router';

import { useLogout } from '@/features/auth/model/use-logout';
import { useMe } from '@/features/auth/model/use-me';
import { isPanelRole } from '@/shared/model/roles';

import SessionLoading from './SessionLoading';

function EndSession({ noPanelAccess }: { noPanelAccess: boolean }) {
  const logout = useLogout();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    logout.mutate({ noPanelAccess });
  }, [logout, noPanelAccess]);

  return <SessionLoading />;
}

function RequireStaff() {
  const { status } = useSession();
  const { data: profile, isError } = useMe();

  if (status === 'loading') return <SessionLoading />;
  if (status === 'anonymous') return <Navigate to="/" replace />;
  if (!profile) return isError ? <EndSession noPanelAccess={false} /> : <SessionLoading />;
  if (!isPanelRole(profile.role)) return <EndSession noPanelAccess />;
  return <Outlet />;
}

export default RequireStaff;

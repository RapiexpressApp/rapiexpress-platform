import { useSession } from '@rapiexpress/api-client/session-context';
import { Navigate, Outlet } from 'react-router';

import SessionLoading from './SessionLoading';

function RequireAuth() {
  const { status } = useSession();

  if (status === 'loading') return <SessionLoading />;
  if (status === 'anonymous') return <Navigate to="/" replace />;
  return <Outlet />;
}

export default RequireAuth;

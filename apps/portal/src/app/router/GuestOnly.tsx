import { useSession } from '@rapiexpress/api-client/session-context';
import { Navigate, Outlet } from 'react-router';

import SessionLoading from './SessionLoading';

function GuestOnly() {
  const { status } = useSession();

  if (status === 'loading') return <SessionLoading />;
  if (status === 'authenticated') return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

export default GuestOnly;

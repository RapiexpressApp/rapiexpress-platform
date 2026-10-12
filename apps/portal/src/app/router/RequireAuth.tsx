import { Navigate, Outlet } from 'react-router';

import { useSession } from '@/features/auth/model/session-context';

import SessionLoading from './SessionLoading';

function RequireAuth() {
  const { status } = useSession();

  if (status === 'loading') return <SessionLoading />;
  if (status === 'anonymous') return <Navigate to="/" replace />;
  return <Outlet />;
}

export default RequireAuth;

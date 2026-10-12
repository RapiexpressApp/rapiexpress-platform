import { Navigate, Outlet } from 'react-router';

import { useSession } from '@/features/auth/model/session-context';

import SessionLoading from './SessionLoading';

function GuestOnly() {
  const { status } = useSession();

  if (status === 'loading') return <SessionLoading />;
  if (status === 'authenticated') return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

export default GuestOnly;

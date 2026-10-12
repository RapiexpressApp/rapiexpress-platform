import { useEffect } from 'react';

import LoginForm from '@/features/auth/ui/LoginForm';
import AuthLayout from '@/widgets/auth-layout/ui/AuthLayout';

function LoginPage() {
  useEffect(() => {
    document.title = 'Iniciar sesión · Rapiexpress';
  }, []);

  return (
    <AuthLayout>
      <LoginForm />
    </AuthLayout>
  );
}

export default LoginPage;

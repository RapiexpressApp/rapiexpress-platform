import { useEffect } from 'react';

import RegisterForm from '@/features/auth/ui/RegisterForm';
import AuthLayout from '@/widgets/auth-layout/ui/AuthLayout';

function RegisterPage() {
  useEffect(() => {
    document.title = 'Crear cuenta · Rapiexpress';
  }, []);

  return (
    <AuthLayout>
      <RegisterForm />
    </AuthLayout>
  );
}

export default RegisterPage;

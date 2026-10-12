import BaseAuthLayout from '@rapiexpress/ui/auth-layout';
import BrandPanel from '@rapiexpress/ui/brand-panel';
import { Building2, ShieldCheck, Users } from 'lucide-react';
import { useEffect } from 'react';

import LoginForm from '@/features/auth/ui/LoginForm';

const FEATURES = [
  { icon: Users, label: 'Gestión de usuarios del personal' },
  { icon: Building2, label: 'Clientes y casilleros en un solo lugar' },
  { icon: ShieldCheck, label: 'Acceso según tu rol' },
];

function LoginPage() {
  useEffect(() => {
    document.title = 'Panel administrativo · Rapiexpress';
  }, []);

  return (
    <BaseAuthLayout panel={<BrandPanel tagline="Operación de Rapiexpress" features={FEATURES} />}>
      <LoginForm />
    </BaseAuthLayout>
  );
}

export default LoginPage;

import BaseAuthLayout from '@rapiexpress/ui/auth-layout';
import BrandPanel from '@rapiexpress/ui/brand-panel';
import { Package, ShieldCheck, Truck } from 'lucide-react';
import type { ReactNode } from 'react';

const FEATURES = [
  { icon: Package, label: 'Seguimiento en línea de tus paquetes' },
  { icon: ShieldCheck, label: 'Tus comprobantes y datos, protegidos' },
  { icon: Truck, label: 'Entrega a domicilio o retiro en agencia' },
];

interface AuthLayoutProps {
  children: ReactNode;
}

function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <BaseAuthLayout panel={<BrandPanel tagline="De la bodega a tu puerta" features={FEATURES} />}>
      {children}
    </BaseAuthLayout>
  );
}

export default AuthLayout;

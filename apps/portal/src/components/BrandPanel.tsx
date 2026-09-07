import { type LucideIcon,Package, ShieldCheck, Truck } from 'lucide-react';

import logo from '../assets/logo.webp';

const FEATURES: { icon: LucideIcon; label: string }[] = [
  { icon: Package, label: 'Seguimiento en línea de tus paquetes' },
  { icon: ShieldCheck, label: 'Tus comprobantes y datos, protegidos' },
  { icon: Truck, label: 'Entrega a domicilio o retiro en agencia' },
];

function BrandPanel() {
  return (
    <aside className="hidden w-[42%] max-w-2xl flex-col bg-linear-to-b from-brand-50 to-brand-100/50 p-10 lg:flex xl:p-14">
      <div className="flex items-center gap-3">
        <img src={logo} alt="" width={222} height={222} className="h-11 w-11 shrink-0 object-contain" />
        <span className="text-xl font-bold tracking-tight text-brand-950">Rapiexpress</span>
      </div>

      <div className="grid flex-1 place-items-center py-10">
        <div>
          <div aria-hidden="true" className="relative">
            <svg
              viewBox="0 0 160 96"
              fill="none"
              className="login-doodle absolute -top-12 right-0 w-36 text-brand-300"
              focusable="false"
            >
              <path
                d="M6 88 C 30 34, 92 10, 136 28"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeDasharray="0.5 9"
              />
              <g transform="translate(132 2) rotate(16 12 12)">
                <g className="login-plane" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 2 L11 13" />
                  <path d="M22 2 L15 22 L11 13 L2 9 Z" />
                </g>
              </g>
            </svg>

            <div className="login-float relative z-10">
              <svg viewBox="60 100 280 280" className="h-auto w-64 sm:w-72" focusable="false" aria-hidden="true">
                <path d="M200 110 L320 170 L200 230 L80 170 Z" fill="#8aa4ea" />
                <path d="M80 170 L200 230 L200 380 L80 320 Z" fill="#2a5ce5" />
                <path d="M200 230 L320 170 L320 320 L200 380 Z" fill="#1041c6" />
                <path d="M128 146 L152 134 L272 194 L248 206 Z" fill="#facc15" />
                <path d="M248 206 L272 194 L272 344 L248 356 Z" fill="#eab308" />
                <path d="M104 220 L176 256 L176 316 L104 280 Z" fill="#ffffff" />
                <path d="M114 238 L166 264 L166 273 L114 248 Z" fill="#cbd5e1" />
                <path d="M114 257 L146 274 L146 283 L114 266 Z" fill="#cbd5e1" />
              </svg>
            </div>

            <div className="mx-auto mt-1 h-3.5 w-44 rounded-full bg-brand-950/10" />
          </div>

          <p className="mt-7 text-center text-sm font-medium text-brand-800">
            De la bodega a tu puerta
          </p>

          <ul className="mx-auto mt-8 w-fit space-y-3.5">
            {FEATURES.map((feature) => (
              <li key={feature.label} className="flex items-center gap-3">
                <feature.icon className="h-5 w-5 shrink-0 text-brand-600" strokeWidth={2} aria-hidden="true" />
                <span className="text-sm text-slate-600">{feature.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>© 2026 Rapiexpress</span>
        <span>Conexión cifrada (HTTPS)</span>
      </div>
    </aside>
  );
}

export default BrandPanel;

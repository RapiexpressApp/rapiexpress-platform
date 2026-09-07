import { Eye, EyeOff } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';

import logo from '../assets/logo.webp';

const WHATSAPP_SIGNUP_URL =
  'https://wa.me/593963986148?text=Hola%2C%20quiero%20crear%20mi%20casillero';
const WHATSAPP_RECOVERY_URL =
  'https://wa.me/593963986148?text=Hola%2C%20olvid%C3%A9%20mi%20contrase%C3%B1a';

const fieldClasses =
  'h-11 w-full touch-manipulation rounded-input border border-slate-300 bg-white text-base text-slate-900 transition-colors placeholder:text-slate-500 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25';
const linkClasses =
  'touch-manipulation rounded-sm px-1 py-2 -mx-1 -my-2 font-medium text-brand-600 underline-offset-4 transition-colors hover:text-brand-700 hover:underline decoration-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40';

function LoginForm() {
  const [passwordVisible, setPasswordVisible] = useState(false);

  // TODO: wire auth once packages/contracts and the API exist
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  return (
    <div className="login-stagger w-full max-w-[380px]">
      <div className="mb-10 flex items-center gap-2.5 lg:hidden">
        <img src={logo} alt="" width={222} height={222} className="h-9 w-9 shrink-0 object-contain" />
        <span className="text-lg font-bold tracking-tight text-brand-950">Rapiexpress</span>
      </div>

      <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Bienvenido de nuevo</h1>
      <p className="mt-2 text-sm text-slate-600">
        Ingresa para seguir tus paquetes y gestionar tu casillero.
      </p>

      <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email" className="text-sm font-medium text-slate-700">
            Correo electrónico
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="tucorreo@ejemplo.com"
            required
            className={`${fieldClasses} mt-1.5 px-3.5`}
          />
        </div>

        <div>
          <div className="flex items-baseline justify-between gap-2">
            <label htmlFor="password" className="text-sm font-medium text-slate-700">
              Contraseña
            </label>
            <a
              href={WHATSAPP_RECOVERY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={`text-sm ${linkClasses}`}
            >
              ¿Olvidaste tu contraseña?
            </a>
          </div>
          <div className="relative mt-1.5">
            <input
              id="password"
              name="password"
              type={passwordVisible ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Tu contraseña"
              required
              className={`${fieldClasses} pl-3.5 pr-12`}
            />
            <button
              type="button"
              onClick={() => setPasswordVisible((visible) => !visible)}
              aria-label={passwordVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              aria-pressed={passwordVisible}
              className="absolute inset-y-0 right-0 grid w-11 touch-manipulation place-items-center rounded-r-input text-slate-500 transition-colors hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
            >
              <span key={passwordVisible ? 'visible' : 'hidden'} className="login-icon-pop block">
                {passwordVisible ? (
                  <EyeOff className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <Eye className="h-5 w-5" aria-hidden="true" />
                )}
              </span>
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="h-11 w-full touch-manipulation rounded-button bg-brand-600 font-semibold text-white transition-[background-color,transform] duration-150 hover:-translate-y-0.5 hover:bg-brand-700 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
        >
          Entrar
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        ¿Aún no tienes casillero?{' '}
        <a
          href={WHATSAPP_SIGNUP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClasses}
        >
          Créalo por WhatsApp
        </a>
      </p>
    </div>
  );
}

export default LoginForm;

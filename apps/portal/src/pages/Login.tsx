import '../styles/login.css';

import { useEffect } from 'react';

import BrandPanel from '../components/BrandPanel';
import LoginForm from '../components/LoginForm';

function Login() {
  useEffect(() => {
    document.title = 'Iniciar sesión · Rapiexpress';
  }, []);

  return (
    <div className="flex min-h-dvh bg-white">
      <BrandPanel />
      <main className="flex flex-1 items-center justify-center px-6 py-8 sm:py-12">
        <LoginForm />
      </main>
    </div>
  );
}

export default Login;

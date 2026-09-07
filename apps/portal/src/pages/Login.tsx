import type { FormEvent } from 'react';

// TODO: wire auth once packages/contracts and the API exist
function handleSubmit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();
}

function Login() {
  return (
    <main>
      <h1>Iniciar sesión</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">Correo electrónico</label>
          <input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div>
          <label htmlFor="password">Contraseña</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </div>
        <button type="submit">Entrar</button>
      </form>
    </main>
  );
}

export default Login;

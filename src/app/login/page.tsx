'use client';

import { useActionState } from 'react';
import { login } from '@/app/actions/auth';
import type { LoginState } from '@/app/actions/auth';

export default function LoginPage() {
  const [state, action, isPending] = useActionState<LoginState, FormData>(
    login,
    undefined
  );

  return (
    <div className="login-page">
      {/* Background animated gradient */}
      <div className="login-bg" aria-hidden="true">
        <div className="login-bg-orb login-bg-orb-1" />
        <div className="login-bg-orb login-bg-orb-2" />
        <div className="login-bg-orb login-bg-orb-3" />
      </div>

      <main className="login-container" role="main">
        {/* Logo / Brand */}
        <div className="login-brand">
          <div className="login-brand-icon" aria-hidden="true">🔍</div>
          <span className="login-brand-badge">OceanIA InsureTech</span>
          <h1 className="login-title text-gradient">
            Peritaje Inteligente
          </h1>
          <p className="login-subtitle">
            Accede para iniciar el análisis de vehículos con IA
          </p>
        </div>

        {/* Login Card */}
        <div className="login-card glass-panel" role="region" aria-label="Formulario de inicio de sesión">
          <h2 className="login-card-title">Iniciar Sesión</h2>

          <form action={action} className="login-form" aria-describedby={state?.error ? 'login-error' : undefined}>
            <div className="form-group">
              <label htmlFor="username" className="form-label">
                Usuario
              </label>
              <div className="input-wrapper">
                <span className="input-icon" aria-hidden="true">👤</span>
                <input
                  id="username"
                  name="username"
                  type="text"
                  className="form-input"
                  placeholder="Introduce tu usuario"
                  autoComplete="username"
                  autoFocus
                  required
                  disabled={isPending}
                  aria-required="true"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Contraseña
              </label>
              <div className="input-wrapper">
                <span className="input-icon" aria-hidden="true">🔒</span>
                <input
                  id="password"
                  name="password"
                  type="password"
                  className="form-input"
                  placeholder="Introduce tu contraseña"
                  autoComplete="current-password"
                  required
                  disabled={isPending}
                  aria-required="true"
                />
              </div>
            </div>

            {/* Error message — generic, doesn't reveal which field is wrong */}
            {state?.error && (
              <div
                id="login-error"
                className="login-error"
                role="alert"
                aria-live="assertive"
              >
                <span aria-hidden="true">⚠️</span>
                {state.error}
              </div>
            )}

            <button
              id="login-submit-btn"
              type="submit"
              className="btn-primary login-btn"
              disabled={isPending}
              aria-busy={isPending}
            >
              {isPending ? (
                <>
                  <span className="spinner" aria-hidden="true" />
                  Verificando...
                </>
              ) : (
                <>
                  Acceder <span aria-hidden="true">→</span>
                </>
              )}
            </button>
          </form>
        </div>

        <p className="login-footer">
          Sistema protegido. Acceso exclusivo a personal autorizado.
        </p>
      </main>
    </div>
  );
}

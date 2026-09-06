import React, { useState } from 'react';
import { Icon, TextInput, PrimaryButton } from '@/app/presentation/components';
import { useAuthStore } from '@/app/presentation/stores';
import { APIAdminRepository } from '@/app/data';

const adminRepo = new APIAdminRepository();

export interface LoginPageProps {
  onLoginSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setAuth = useAuthStore((s) => s.setAuth);

  const validateUsernameOrEmail = (val: string) => {
    if (!val.trim()) return 'El usuario o correo electrónico es obligatorio';
    return '';
  };

  const validatePassword = (val: string) => {
    if (!val) return 'La contraseña es obligatoria';
    return '';
  };

  const handleUsernameChange = (val: string) => {
    setUsernameOrEmail(val);
    if (!val.trim()) {
      setUsernameError('El usuario o correo electrónico es obligatorio');
    } else {
      setUsernameError('');
    }
  };

  const handlePasswordChange = (val: string) => {
    setPassword(val);
    if (!val) {
      setPasswordError('La contraseña es obligatoria');
    } else {
      setPasswordError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const uErr = validateUsernameOrEmail(usernameOrEmail);
    const pErr = validatePassword(password);
    
    setUsernameError(uErr);
    setPasswordError(pErr);

    if (uErr || pErr) {
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const result = await adminRepo.login(usernameOrEmail, password);
      setAuth(result.user, result.accessToken, result.refreshToken);
      onLoginSuccess();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al iniciar sesión';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #091426 0%, #1a2540 50%, #0d1f38 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      {/* Decorative background orbs */}
      <div
        style={{
          position: 'fixed',
          top: '-120px',
          right: '-120px',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(133,83,0,0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'fixed',
          bottom: '-80px',
          left: '-80px',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(9,20,38,0.5) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div style={{ width: '100%', maxWidth: '420px', position: 'relative', zIndex: 1 }}>
        {/* Logo Header */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '12px',
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                background: '#855300',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(133,83,0,0.4)',
              }}
            >
              <Icon name="Wrench" className="text-white" size="md" />
            </div>
            <span
              style={{
                color: 'white',
                fontSize: '26px',
                fontWeight: '700',
                letterSpacing: '-0.02em',
              }}
            >
              Moto servicio Nova FV
            </span>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '13px', letterSpacing: '0.02em' }}>
            Workshop OS — Panel Administrativo
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-base-100/95 dark:bg-base-100/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl shadow-black/50">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-base-content mb-1 tracking-tight">
              Iniciar Sesión
            </h1>
            <p className="text-sm text-base-content/60 leading-relaxed">
              Accede al panel de gestión del taller.
            </p>
          </div>

          {/* Error alert */}
          {error && (
            <div className="bg-error/15 border border-error/30 rounded-xl p-3.5 mb-5 flex gap-2.5 items-start">
              <Icon name="AlertCircle" size="sm" className="text-error shrink-0 mt-0.5" />
              <span className="text-sm text-error leading-snug">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-base-content/70 mb-1.5">
                Usuario o Correo Electrónico
              </label>
              <TextInput
                type="text"
                value={usernameOrEmail}
                onChange={(e) => handleUsernameChange(e.target.value)}
                errorMessage={usernameError}
                placeholder="Ej. alexis.rojas o alexis@ferventa.com"
                disabled={loading}
                autoComplete="username"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-base-content/70 mb-1.5">
                Contraseña
              </label>
              <TextInput
                type="password"
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                errorMessage={passwordError}
                placeholder="••••••••"
                disabled={loading}
                autoComplete="current-password"
              />
            </div>

            <PrimaryButton
              type="submit"
              loading={loading}
              className="w-full mt-2 font-semibold shadow-lg shadow-primary/20"
            >
              {loading ? 'Iniciando...' : 'Iniciar Sesión'}
            </PrimaryButton>
          </form>
        </div>

        <p
          style={{
            textAlign: 'center',
            color: 'rgba(255,255,255,0.25)',
            fontSize: '12px',
            marginTop: '28px',
          }}
        >
          © {new Date().getFullYear()} Moto servicio Nova FV
        </p>
      </div>
    </div>
  );
};

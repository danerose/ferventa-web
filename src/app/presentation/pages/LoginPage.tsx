import React, { useState } from 'react';
import { Icon, TextInput, PrimaryButton } from '@/app/presentation/components';
import { useAuthStore } from '@/core/stores/useAuthStore';
import { APIAdminRepository } from '@/app/data/repositories/APIAdminRepository';

const adminRepo = new APIAdminRepository();

export interface LoginPageProps {
  onLoginSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setAuth } = useAuthStore();

  const validateEmail = (val: string) => {
    if (!val.trim()) return 'El correo electrónico es obligatorio';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(val)) return 'Ingresa un correo electrónico válido';
    return '';
  };

  const validatePassword = (val: string) => {
    if (!val) return 'La contraseña es obligatoria';
    return '';
  };

  const handleEmailChange = (val: string) => {
    setEmail(val);
    if (!val.trim()) {
      setEmailError('El correo electrónico es obligatorio');
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(val)) {
        setEmailError('Ingresa un correo electrónico válido');
      } else {
        setEmailError('');
      }
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
    const eErr = validateEmail(email);
    const pErr = validatePassword(password);
    
    setEmailError(eErr);
    setPasswordError(pErr);

    if (eErr || pErr) {
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const result = await adminRepo.login(email, password);
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
        <div
          style={{
            background: 'white',
            borderRadius: '20px',
            padding: '36px 32px',
            boxShadow: '0 32px 64px -12px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)',
          }}
        >
          <div style={{ marginBottom: '28px' }}>
            <h1
              style={{
                fontSize: '22px',
                fontWeight: '700',
                color: '#091426',
                marginBottom: '6px',
                letterSpacing: '-0.01em',
              }}
            >
              Iniciar Sesión
            </h1>
            <p style={{ fontSize: '14px', color: '#45474c', lineHeight: '1.5' }}>
              Accede al panel de gestión del taller.
            </p>
          </div>

          {/* Error alert */}
          {error && (
            <div
              style={{
                background: '#fff1f1',
                border: '1px solid rgba(186,26,26,0.2)',
                borderRadius: '10px',
                padding: '12px 14px',
                marginBottom: '20px',
                display: 'flex',
                gap: '10px',
                alignItems: 'flex-start',
              }}
            >
              <Icon name="AlertCircle" size="sm" className="text-error" style={{ flexShrink: 0, marginTop: '1px' }} />
              <span style={{ fontSize: '14px', color: '#93000a', lineHeight: '1.4' }}>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '11.5px',
                  fontWeight: '700',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: '#45474c',
                  marginBottom: '7px',
                }}
              >
                Correo Electrónico
              </label>
              <TextInput
                type="email"
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                errorMessage={emailError}
                placeholder="admin@ferventa.com"
                disabled={loading}
                autoComplete="email"
              />
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '11.5px',
                  fontWeight: '700',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: '#45474c',
                  marginBottom: '7px',
                }}
              >
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
              className="w-full bg-[#091426] hover:bg-[#1e293b] text-white border-none mt-1"
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

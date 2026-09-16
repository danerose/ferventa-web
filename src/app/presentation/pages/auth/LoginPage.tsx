import React, { useState } from 'react';
import {
  Icon,
  TextInput,
  PrimaryButton,
  Box,
  Flex,
  Stack,
  Heading,
  Text,
} from '@/app/presentation/components';
import { useAuthStore } from '@/app/presentation/stores';
import { authUseCases } from '@/core/di/container';

export interface LoginPageProps {
  onLoginSuccess?: (user?: any) => void;
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
      const result = await authUseCases.login({ username: usernameOrEmail, password });
      setAuth(result.user, result.accessToken, result.refreshToken);
      if (onLoginSuccess) {
        onLoginSuccess(result.user);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al iniciar sesión';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className="min-h-screen bg-base-300 flex items-center justify-center p-6 relative overflow-hidden font-sans">
      <Box className="w-full max-w-md relative z-10">
        {/* Logo Header */}
        <Flex direction="col" align="center" className="mb-8 text-center">
          <Flex align="center" gap="sm" className="mb-3">
            <Box className="w-11 h-11 bg-primary text-primary-content rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
              <Icon name="Wrench" size="md" />
            </Box>
            <Heading level={2} className="text-2xl font-bold tracking-tight text-base-content">
              Moto servicio Nova FV
            </Heading>
          </Flex>
          <Text size="xs" variant="muted" className="tracking-wide">
            Workshop OS — Panel Administrativo
          </Text>
        </Flex>

        {/* Login Card */}
        <Box className="bg-base-100 rounded-2xl p-8 shadow-xl border border-base-content/10">
          <Box className="mb-6">
            <Heading level={1} className="text-2xl font-bold text-base-content mb-1 tracking-tight">
              Iniciar Sesión
            </Heading>
            <Text size="sm" variant="muted">
              Accede al panel de gestión del taller.
            </Text>
          </Box>

          {/* Error alert */}
          {error && (
            <Flex align="start" gap="sm" className="bg-error/15 border border-error/30 rounded-xl p-3.5 mb-5 text-error">
              <Icon name="AlertCircle" size="sm" className="shrink-0 mt-0.5" />
              <Text size="sm" className="leading-snug text-error">
                {error}
              </Text>
            </Flex>
          )}

          <Box as="form" onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Stack gap="xs">
              <Text size="xs" weight="bold" variant="muted" className="uppercase tracking-wider">
                Usuario o Correo Electrónico
              </Text>
              <TextInput
                type="text"
                value={usernameOrEmail}
                onChange={(e) => handleUsernameChange(e.target.value)}
                errorMessage={usernameError}
                placeholder="Ej. alexis.rojas o alexis@ferventa.com"
                disabled={loading}
                autoComplete="username"
              />
            </Stack>

            <Stack gap="xs">
              <Text size="xs" weight="bold" variant="muted" className="uppercase tracking-wider">
                Contraseña
              </Text>
              <TextInput
                type="password"
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                errorMessage={passwordError}
                placeholder="••••••••"
                disabled={loading}
                autoComplete="current-password"
              />
            </Stack>

            <PrimaryButton
              type="submit"
              loading={loading}
              className="w-full mt-2 font-semibold shadow-lg shadow-primary/20"
            >
              {loading ? 'Iniciando...' : 'Iniciar Sesión'}
            </PrimaryButton>
          </Box>
        </Box>

        <Text size="xs" variant="muted" className="text-center mt-7 opacity-60">
          © {new Date().getFullYear()} Moto servicio Nova FV
        </Text>
      </Box>
    </Box>
  );
};

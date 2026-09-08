import React, { useState } from 'react';
import {
  Modal,
  PrimaryButton,
  SecondaryButton,
  TextInput,
  Icon,
  Stack,
  Box,
  Text,
  Flex,
  KbdBadge,
} from '@/app/presentation/components';
import { useAuthStore } from '@/app/presentation/stores';

export interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  isMandatory?: boolean;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  isMandatory = false,
}) => {
  const changePassword = useAuthStore((s) => s.changePassword);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  if (!isOpen) return null;

  const resetForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setFieldErrors({});
    setErrorMessage(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validate = (): boolean => {
    const errors: typeof fieldErrors = {};

    if (!currentPassword) {
      errors.currentPassword = 'Debes ingresar tu contraseña actual';
    }

    if (!newPassword) {
      errors.newPassword = 'Debes ingresar una nueva contraseña';
    } else if (newPassword.length < 6) {
      errors.newPassword = 'La nueva contraseña debe tener al menos 6 caracteres';
    } else if (newPassword === currentPassword) {
      errors.newPassword = 'La nueva contraseña no puede ser igual a la actual';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Confirma tu nueva contraseña';
    } else if (confirmPassword !== newPassword) {
      errors.confirmPassword = 'Las contraseñas no coinciden';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      await changePassword(currentPassword, newPassword);
      resetForm();
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cambiar la contraseña';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Cambiar Contraseña"
      maxWidth="480px"
      headerVariant="primary"
    >
      <form onSubmit={handleSubmit} noValidate>
        <Stack spacing="md">
          {/* Information Notice */}
          <Box className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3.5 flex gap-3 items-start">
            <Icon name="ShieldAlert" size="sm" className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <Text size="xs" className="text-amber-800 dark:text-amber-200 leading-relaxed">
              {isMandatory
                ? 'Estás usando una contraseña temporal asignada por el sistema. Por seguridad, debes actualizarla a una privada antes de continuar.'
                : 'Ingresa tu contraseña actual y define una nueva para proteger el acceso a tu cuenta.'}
            </Text>
          </Box>

          {/* Backend Error Alert */}
          {errorMessage && (
            <Box className="bg-error/10 border border-error/20 rounded-xl p-3 flex gap-2.5 items-start">
              <Icon name="AlertCircle" size="sm" className="text-error shrink-0 mt-0.5" />
              <Text size="xs" variant="error" className="leading-snug">
                {errorMessage}
              </Text>
            </Box>
          )}

          {/* Campo 1: Contraseña Actual */}
          <Box>
            <Text as="label" size="xs" weight="semibold" variant="muted" className="block mb-1">
              Contraseña Actual *
            </Text>
            <div className="relative flex items-center">
              <TextInput
                type={showCurrent ? 'text' : 'password'}
                placeholder="Ingresa tu contraseña actual o provisional"
                size="sm"
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value);
                  setFieldErrors((prev) => ({ ...prev, currentPassword: undefined }));
                }}
                errorMessage={fieldErrors.currentPassword}
                disabled={isLoading}
                autoComplete="current-password"
                className="pr-10"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-2.5 text-base-content/40 hover:text-base-content"
                title={showCurrent ? 'Ocultar' : 'Mostrar'}
              >
                <Icon name={showCurrent ? 'EyeOff' : 'Eye'} size="xs" />
              </button>
            </div>
          </Box>

          {/* Campo 2: Nueva Contraseña */}
          <Box>
            <Text as="label" size="xs" weight="semibold" variant="muted" className="block mb-1">
              Nueva Contraseña (Mín. 6 caracteres) *
            </Text>
            <div className="relative flex items-center">
              <TextInput
                type={showNew ? 'text' : 'password'}
                placeholder="Nueva contraseña segura"
                size="sm"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setFieldErrors((prev) => ({ ...prev, newPassword: undefined }));
                }}
                errorMessage={fieldErrors.newPassword}
                disabled={isLoading}
                autoComplete="new-password"
                className="pr-10"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-2.5 text-base-content/40 hover:text-base-content"
                title={showNew ? 'Ocultar' : 'Mostrar'}
              >
                <Icon name={showNew ? 'EyeOff' : 'Eye'} size="xs" />
              </button>
            </div>
          </Box>

          {/* Campo 3: Confirmar Nueva Contraseña */}
          <Box>
            <Text as="label" size="xs" weight="semibold" variant="muted" className="block mb-1">
              Confirmar Nueva Contraseña *
            </Text>
            <div className="relative flex items-center">
              <TextInput
                type={showConfirm ? 'text' : 'password'}
                placeholder="Repite la nueva contraseña"
                size="sm"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                }}
                errorMessage={fieldErrors.confirmPassword}
                disabled={isLoading}
                autoComplete="new-password"
                className="pr-10"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-2.5 text-base-content/40 hover:text-base-content"
                title={showConfirm ? 'Ocultar' : 'Mostrar'}
              >
                <Icon name={showConfirm ? 'EyeOff' : 'Eye'} size="xs" />
              </button>
            </div>
          </Box>

          {/* Footer Buttons */}
          <Flex justify="end" gap="sm" className="pt-3 border-t border-base-300">
            {!isMandatory && (
              <SecondaryButton size="sm" onClick={handleClose} disabled={isLoading}>
                Cancelar <KbdBadge keys="Esc" className="ml-1.5" />
              </SecondaryButton>
            )}
            <PrimaryButton
              size="sm"
              color="primary"
              type="submit"
              loading={isLoading}
              disabled={isLoading}
            >
              Actualizar Contraseña <KbdBadge keys="Enter ↵" className="ml-1.5" />
            </PrimaryButton>
          </Flex>
        </Stack>
      </form>
    </Modal>
  );
};

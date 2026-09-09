import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Flex, Stack, Heading, Text, PrimaryButton, Icon } from '@/app/presentation/components';
import { useAuthorization } from '@/core/hooks';
import { UserRole } from '@/core/enums';
import { APP_ROUTES } from '@/core/constants';

export const ForbiddenPage: React.FC = () => {
  const navigate = useNavigate();
  const { role } = useAuthorization();

  const handleReturn = () => {
    switch (role) {
      case UserRole.Mechanic:
        navigate(APP_ROUTES.ADMIN.MANTENIMIENTO);
        break;
      case UserRole.Warehouse:
        navigate(APP_ROUTES.ADMIN.INVENTARIO);
        break;
      case UserRole.Cashier:
      case UserRole.Seller:
        navigate(APP_ROUTES.ADMIN.POS);
        break;
      case UserRole.Receptionist:
      case UserRole.Admin:
      default:
        navigate(APP_ROUTES.ADMIN.CITAS);
        break;
    }
  };

  return (
    <Box className="min-h-screen bg-base-200 flex items-center justify-center p-4">
      <Box className="card bg-base-100 shadow-xl max-w-md w-full border border-base-300">
        <Box className="card-body text-center items-center">
          <Flex className="w-16 h-16 rounded-full bg-error/10 items-center justify-center text-error mb-2">
            <Icon name="ShieldAlert" size={36} />
          </Flex>
          <Stack className="gap-2">
            <Heading level={2} className="text-2xl font-bold text-base-content">
              Acceso Restringido
            </Heading>
            <Text className="text-base-content/70 text-sm">
              Tu rol actual ({role || 'No asignado'}) no cuenta con los permisos necesarios para acceder a este módulo.
            </Text>
          </Stack>
          <Box className="card-actions mt-6 w-full">
            <PrimaryButton className="w-full" onClick={handleReturn}>
              Volver a mi módulo principal
            </PrimaryButton>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

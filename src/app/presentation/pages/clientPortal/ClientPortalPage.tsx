import React from 'react';
import {
  AppointmentForm,
  StatusSearch,
  StatusResults,
  Box,
  Flex,
  Grid,
  Stack,
  Icon,
  Heading,
  Text,
  Badge,
  SecondaryButton,
} from '@/app/presentation/components';
import { useThemeStore } from '@/app/presentation/stores';

export interface ClientPortalPageProps {
  onOpenShowcase?: () => void;
  onOpenAdmin?: () => void;
}

export const ClientPortalPage: React.FC<ClientPortalPageProps> = ({ onOpenAdmin }) => {
  const isDark = useThemeStore((s) => s.isDark);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);

  return (
    <Box className="min-h-screen bg-base-100 text-base-content font-sans">
      {/* Top Header / Navigation */}
      <Box as="header" className="bg-base-100/90 backdrop-blur-md border-b border-base-300 sticky top-0 z-50 h-16">
        <Box px="lg" className="max-w-7xl mx-auto h-full">
          <Flex justify="between" align="center" className="h-full">
            {/* Logo/Brand */}
            <Flex
              align="center"
              gap="xs"
              className="cursor-pointer"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <Box bg="primary" p="xs" className="text-primary-content flex items-center justify-center rounded-lg shadow-sm">
                <Icon name="Wrench" size="md" />
              </Box>
              <Heading level={2} className="text-base sm:text-lg font-bold tracking-tight text-base-content m-0">
                Moto servicio Nova FV
              </Heading>
              <Badge variant="warning" size="sm" className="ml-1 font-semibold">
                Portal Cliente
              </Badge>
            </Flex>

            {/* Showcase / Admin Toggle & Theme Toggle */}
            <Flex align="center" gap="sm">
              <SecondaryButton
                size="sm"
                color="secondary"
                onClick={toggleTheme}
                title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                iconStart={<Icon name={isDark ? 'Sun' : 'Moon'} size="sm" />}
              />

              {onOpenAdmin && (
                <SecondaryButton
                  color="secondary"
                  size="sm"
                  onClick={onOpenAdmin}
                  iconStart={<Icon name="ShieldAlert" size="xs" />}
                >
                  Acceso Staff
                </SecondaryButton>
              )}
            </Flex>
          </Flex>
        </Box>
      </Box>

      {/* Hero Banner Section */}
      <Box className="relative rounded-2xl overflow-hidden h-[360px] shadow-lg border border-base-300">
        {/* Background */}
        <Box className="absolute inset-0 z-0">
          <Box
            className="w-full h-full bg-cover bg-center"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1636761358757-0a616eb9e17e?fm=jpg&q=60&w=3000&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8bW90b3JjeWNsZSUyMGdhcmFnZXxlbnwwfHwwfHx8MA%3D%3D')`,
            }}
          />
          {/* Deep gradient overlay */}
          <Box className="absolute inset-0 bg-gradient-to-r from-base-300/95 via-base-300/80 to-transparent" />
        </Box>

        {/* Content */}
        <Flex align="center" className="absolute inset-0 z-10">
          <Box className="w-full max-w-xl px-8 sm:px-12 text-base-content shrink-0">
            <Heading level={1} className="text-2xl sm:text-4xl font-extrabold mb-3 tracking-tight text-base-content">
              Cuidamos tu moto con ingeniería de precisión.
            </Heading>
            <Text size="sm" color="muted" className="leading-relaxed mb-6 font-medium">
              Agenda servicios preventivos o correctivos y monitorea el avance de tu moto en tiempo real con transparencia total.
            </Text>
          </Box>
        </Flex>
      </Box>

      {/* Main Content Area */}
      <Box as="main" className="max-w-7xl mx-auto px-6 py-12">
        <Grid cols={{ base: 1, lg: 12 }} gap="lg" className="items-start">
          {/* Appointment Form Column */}
          <Box as="section" id="agendar-seccion" className="lg:col-span-5">
            <Box className="lg:sticky lg:top-20">
              <AppointmentForm isStaff={false} />
            </Box>
          </Box>

          {/* Status Search and Results Column */}
          <Box as="section" id="consultar-seccion" className="lg:col-span-7">
            <Stack gap="lg">
              <StatusSearch />
              <StatusResults />
            </Stack>
          </Box>
        </Grid>

        {/* Bento Features Section */}
        <Box as="section" className="mt-24">
          <Grid cols={{ base: 1, md: 3 }} gap="md">
            {/* Card 1 */}
            <Box p="lg" rounded="xl" className="bg-base-200 border border-base-300 text-base-content flex flex-col justify-between h-60 shadow-sm">
              <Icon name="ShieldCheck" size="xl" className="text-primary" />
              <Box>
                <Heading level={3} className="text-base font-bold text-base-content mb-2">
                  Garantía Certificada
                </Heading>
                <Text size="sm" color="muted" className="leading-relaxed">
                  Cada reparación cuenta con el respaldo de técnicos altamente capacitados y refacciones de calidad original.
                </Text>
              </Box>
            </Box>

            {/* Card 2 */}
            <Box p="lg" rounded="xl" className="bg-base-200 border border-base-300 text-base-content flex flex-col justify-between h-60 shadow-sm">
              <Icon name="Zap" size="xl" className="text-secondary" />
              <Box>
                <Heading level={3} className="text-base font-bold text-base-content mb-2">
                  Rapidez Ferventa
                </Heading>
                <Text size="sm" color="muted" className="leading-relaxed">
                  Reducimos los tiempos de espera gracias a la automatización de procesos y optimización de nuestro inventario.
                </Text>
              </Box>
            </Box>

            {/* Card 3 */}
            <Box p="lg" rounded="xl" className="bg-base-200 border border-base-300 text-base-content flex flex-col justify-between h-60 shadow-sm">
              <Icon name="Eye" size="xl" className="text-warning" />
              <Box>
                <Heading level={3} className="text-base font-bold text-base-content mb-2">
                  Transparencia Total
                </Heading>
                <Text size="sm" color="muted" className="leading-relaxed">
                  Accede a la orden de servicio, piezas consumidas y evidencias fotográficas directamente desde este portal digital.
                </Text>
              </Box>
            </Box>
          </Grid>
        </Box>
      </Box>

      {/* Footer Section */}
      <Box as="footer" className="bg-base-200 text-base-content/70 py-12 border-t border-base-300 mt-24">
        <Box px="lg" className="max-w-7xl mx-auto">
          <Grid cols={{ base: 1, md: 4 }} gap="xl">
            <Box className="md:col-span-2 min-w-0">
              <Flex align="center" gap="xs" className="mb-4">
                <Box bg="secondary" p="xs" className="rounded-lg flex items-center justify-center text-secondary-content">
                  <Icon name="Wrench" size="sm" />
                </Box>
                <Heading level={3} className="text-base font-bold text-base-content tracking-tight m-0">
                  Moto servicio Nova FV
                </Heading>
              </Flex>
              <Text size="sm" className="mb-4 leading-relaxed">
                La plataforma líder en gestión de talleres mecánicos de alto rendimiento. Precisión en cada proceso, confianza en cada entrega.
              </Text>
              <Text size="xs" color="muted">
                © {new Date().getFullYear()} Moto servicio Nova FV. Todos los derechos reservados.
              </Text>
            </Box>

            <Box className="min-w-0">
              <Heading level={4} className="text-base-content font-bold text-xs mb-4 uppercase tracking-wider">
                Servicios
              </Heading>
              <Stack gap="xs">
                <Text size="sm">Mantenimiento Preventivo</Text>
                <Text size="sm">Diagnóstico de Motor</Text>
                <Text size="sm">Frenos y Suspensión</Text>
              </Stack>
            </Box>

            <Box className="min-w-0">
              <Heading level={4} className="text-base-content font-bold text-xs mb-4 uppercase tracking-wider">
                Contacto
              </Heading>
              <Stack gap="xs">
                <Flex align="center" gap="xs">
                  <Icon name="Phone" size="xs" />
                  <Text size="sm">+52 999 438 9747</Text>
                </Flex>
                <Flex align="center" gap="xs">
                  <Icon name="MapPin" size="xs" />
                  <Text size="sm">Plaza "Santos Lugo", Umán, 97390 Umán, Yuc.</Text>
                </Flex>
                <Flex align="center" gap="xs">
                  <Icon name="Clock" size="xs" />
                  <Text size="sm">Lun - Vie: 9:00 am - 6:00 pm</Text>
                </Flex>
                <Flex align="center" gap="xs">
                  <Icon name="Clock" size="xs" />
                  <Text size="sm">Sab: 9:00 am - 4:00 pm</Text>
                </Flex>
              </Stack>
            </Box>
          </Grid>
        </Box>
      </Box>
    </Box>
  );
};

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
      <header className="bg-base-100/90 backdrop-blur-md border-b border-base-300 sticky top-0 z-50 h-16">
        <Box px="lg" className="max-w-7xl mx-auto h-full">
          <Flex justify="between" align="center" className="h-full">
            {/* Logo/Brand */}
            <Flex align="center" gap="xs" className="cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <Box bg="primary" p="xs" className="text-white flex items-center justify-center rounded-lg shadow-sm">
                <Icon name="Wrench" size="md" className="text-white" />
              </Box>
              <span className="font-headline-md tracking-tight text-base-content font-bold">Moto servicio Nova FV</span>
              <span className="badge bg-warning/20 text-warning badge-sm font-semibold border-none rounded-full ml-1">
                Portal Cliente
              </span>
            </Flex>

            {/* Showcase / Admin Toggle & Theme Toggle */}
            <Flex align="center" gap="sm">
              <button
                type="button"
                onClick={toggleTheme}
                title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                className="btn btn-sm btn-ghost btn-circle text-base-content/80 hover:text-base-content hover:bg-base-200"
              >
                <Icon name={isDark ? 'Sun' : 'Moon'} size="sm" />
              </button>

              {onOpenAdmin && (
                <SecondaryButton
                  color="secondary"
                  size="sm"
                  onClick={onOpenAdmin}
                  className="gap-1.5"
                >
                  <Icon name="ShieldAlert" size="xs" />
                  Acceso Staff
                </SecondaryButton>
              )}
            </Flex>
          </Flex>
        </Box>
      </header>

      {/* Hero Banner Section */}
      <Box className="relative rounded-2xl overflow-hidden h-[360px] shadow-lg border border-base-300">
        {/* Background */}
        <div className="absolute inset-0 z-0">
          <div
            className="w-full h-full bg-cover bg-center"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1636761358757-0a616eb9e17e?fm=jpg&q=60&w=3000&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8bW90b3JjeWNsZSUyMGdhcmFnZXxlbnwwfHwwfHx8MA%3D%3D')`,
            }}
          ></div>
          {/* Deep navy-to-transparent gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-transparent"></div>
        </div>

        {/* Content */}
        <div className="absolute inset-0 z-10 flex items-center">
          <div style={{ width: '100%', maxWidth: '36rem', padding: '0 3rem', color: 'white', flexShrink: 0 }}>
            <h1 className="font-display-lg text-white mb-3 font-bold text-3xl sm:text-4xl">
              Cuidamos tu moto con ingeniería de precisión.
            </h1>
            <p className="text-slate-200 text-sm leading-relaxed mb-6">
              Agenda servicios preventivos o correctivos y monitorea el avance de tu moto en tiempo real con transparencia total.
            </p>
          </div>
        </div>
      </Box>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <Grid cols={{ base: 1, lg: 12 }} gap="lg" className="items-start">
          {/* Appointment Form Column */}
          <section id="agendar-seccion" className="lg:col-span-5">
            <Box className="lg:sticky lg:top-20">
              <AppointmentForm isStaff={false} />
            </Box>
          </section>

          {/* Status Search and Results Column */}
          <section id="consultar-seccion" className="lg:col-span-7">
            <Stack gap="lg">
              <StatusSearch />
              <StatusResults />
            </Stack>
          </section>
        </Grid>

        {/* Bento Features Section */}
        <section className="mt-24">
          <Grid cols={{ base: 1, md: 3 }} gap="md">
            {/* Card 1 */}
            <Box p="lg" rounded="xl" className="bg-base-200 border border-base-300 text-base-content flex flex-col justify-between h-60 shadow-sm">
              <Icon name="ShieldCheck" size="xl" className="text-primary" />
              <div>
                <h3 className="font-headline-md text-base-content mb-2 font-bold">Garantía Certificada</h3>
                <p className="text-base-content/70 text-body-sm leading-relaxed">
                  Cada reparación cuenta con el respaldo de técnicos altamente capacitados y refacciones de calidad original.
                </p>
              </div>
            </Box>

            {/* Card 2 */}
            <Box p="lg" rounded="xl" className="bg-base-200 border border-base-300 text-base-content flex flex-col justify-between h-60 shadow-sm">
              <Icon name="Zap" size="xl" className="text-secondary" />
              <div>
                <h3 className="font-headline-md text-base-content mb-2 font-bold">Rapidez Ferventa</h3>
                <p className="text-base-content/70 text-body-sm leading-relaxed">
                  Reducimos los tiempos de espera gracias a la automatización de procesos y optimización de nuestro inventario.
                </p>
              </div>
            </Box>

            {/* Card 3 */}
            <Box p="lg" rounded="xl" className="bg-base-200 border border-base-300 text-base-content flex flex-col justify-between h-60 shadow-sm">
              <Icon name="Eye" size="xl" className="text-warning" />
              <div>
                <h3 className="font-headline-md text-base-content mb-2 font-bold">Transparencia Total</h3>
                <p className="text-base-content/70 text-body-sm leading-relaxed">
                  Accede a la orden de servicio, piezas consumidas y evidencias fotográficas directamente desde este portal digital.
                </p>
              </div>
            </Box>
          </Grid>
        </section>
      </main>

      {/* Footer Section */}
      <footer className="bg-base-200 text-base-content/70 py-12 border-t border-base-300 mt-24">
        <Box px="lg" className="max-w-7xl mx-auto">
          <Grid cols={{ base: 1, md: 4 }} gap="xl">
            <div className="md:col-span-2 min-w-0">
              <Flex align="center" gap="xs" className="mb-4">
                <Box bg="secondary" p="xs" className="rounded-lg flex items-center justify-center">
                  <Icon name="Wrench" size="sm" className="text-white" />
                </Box>
                <span className="font-headline-md text-base-content tracking-tight font-bold">Moto servicio Nova FV</span>
              </Flex>
              <p className="text-sm mb-4 leading-relaxed">
                La plataforma líder en gestión de talleres mecánicos de alto rendimiento. Precisión en cada proceso, confianza en cada entrega.
              </p>
              <p className="text-xs text-base-content/50">
                © {new Date().getFullYear()} Moto servicio Nova FV. Todos los derechos reservados.
              </p>
            </div>

            <div className="min-w-0">
              <h4 className="text-base-content font-bold text-sm mb-4 uppercase tracking-wider">Servicios</h4>
              <ul className="space-y-2 text-sm">
                <li>Mantenimiento Preventivo</li>
                <li>Diagnóstico de Motor</li>
                <li>Frenos y Suspensión</li>
              </ul>
            </div>

            <div className="min-w-0">
              <h4 className="text-base-content font-bold text-sm mb-4 uppercase tracking-wider">Contacto</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Icon name="Phone" size="xs" />
                  +52 999 438 9747
                </li>
                <li className="flex items-center gap-2">
                  <Icon name="MapPin" size="xs" />
                  Plaza "Santos Lugo", Umán, 97390 Umán, Yuc.
                </li>
                <li className="flex items-center gap-2">
                  <Icon name="Clock" size="xs" />
                  Lun - Vie: 9:00 am - 6:00 pm
                </li>
                <li className="flex items-center gap-2">
                  <Icon name="Clock" size="xs" />
                  Sab: 9:00 am - 4:00 pm
                </li>
              </ul>
            </div>
          </Grid>
        </Box>
      </footer>
    </Box>
  );
};

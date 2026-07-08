import React from 'react';
import { AppointmentForm } from '../components/organisms/AppointmentForm';
import { StatusSearch } from '../components/organisms/StatusSearch';
import { StatusResults } from '../components/organisms/StatusResults';
import { Box, Flex, Grid, Stack, Icon, PrimaryButton } from '@/app/presentation/components';

export interface ClientPortalPageProps {
  onOpenShowcase?: () => void;
  onOpenAdmin?: () => void;
}

export const ClientPortalPage: React.FC<ClientPortalPageProps> = ({ onOpenAdmin }) => {

  return (
    <Box className="min-h-screen bg-background text-on-background font-sans">
      {/* Top Header / Navigation */}
      <header className="bg-white border-b border-outline-variant/60 sticky top-0 z-50 h-16">
        <Box px="lg" className="max-w-7xl mx-auto h-full">
          <Flex justify="between" align="center" className="h-full">
            {/* Logo/Brand */}
            <Flex align="center" gap="xs" className="cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <Box bg="primary" p="xs" className="text-white flex items-center justify-center rounded-lg shadow-sm">
                <Icon name="Wrench" size="md" className="text-white" />
              </Box>
              <span className="font-headline-md tracking-tight text-[#091426] font-bold">Ferventa</span>
              <span className="badge bg-[#ffddb8] text-[#653e00] badge-sm font-semibold border-none rounded-full ml-1">
                Portal Cliente
              </span>
            </Flex>

            {/* Navigation links */}

            {/* Showcase / Admin Toggle */}
            <Flex align="center" gap="sm">
              {onOpenAdmin && (
                <PrimaryButton
                  variant="outline"
                  size="sm"
                  onClick={onOpenAdmin}
                  className="border-[#855300] text-[#855300] hover:bg-[#855300]/5 gap-1.5"
                >
                  <Icon name="ShieldAlert" size="xs" />
                  Acceso Staff
                </PrimaryButton>
              )}
            </Flex>
          </Flex>
        </Box>
      </header>

      {/* Hero Banner Section */}
      <Box className="relative rounded-2xl overflow-hidden h-[360px] shadow-lg border border-outline-variant/30">
        {/* Background */}
        <div className="absolute inset-0 z-0">
          <div
            className="w-full h-full bg-cover bg-center"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1636761358757-0a616eb9e17e?fm=jpg&q=60&w=3000&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8bW90b3JjeWNsZSUyMGdhcmFnZXxlbnwwfHwwfHx8MA%3D%3D')`,
            }}
          ></div>
          {/* Deep navy-to-transparent gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#091426] via-[#091426]/70 to-transparent"></div>
        </div>

        {/* Content — absolute so it never inherits a collapsed flex-item width */}
        <div className="absolute inset-0 z-10 flex items-center">
          <div style={{ width: '100%', maxWidth: '36rem', padding: '0 3rem', color: 'white', flexShrink: 0 }}>
            <h1 className="font-display-lg text-white mb-3">
              Cuidamos tu moto con ingeniería de precisión.
            </h1>
            <p style={{ color: 'rgb(203 213 225)', fontSize: '14px', lineHeight: '1.625', marginBottom: '1.5rem' }}>
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
              <AppointmentForm />
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
            <Box p="lg" rounded="xl" className="bg-[#091426] text-white flex flex-col justify-between h-60 shadow-md">
              <Icon name="ShieldCheck" size="xl" className="text-[#ffb95f]" />
              <div>
                <h3 className="font-headline-md text-white mb-2">Garantía Certificada</h3>
                <p className="text-slate-400 text-body-sm leading-relaxed">
                  Cada reparación cuenta con el respaldo de técnicos altamente capacitados y refacciones de calidad original.
                </p>
              </div>
            </Box>

            {/* Card 2 */}
            <Box p="lg" rounded="xl" className="bg-surface-container-high border border-outline-variant/30 flex flex-col justify-between h-60 shadow-sm">
              <Icon name="Zap" size="xl" className="text-[#091426]" />
              <div>
                <h3 className="font-headline-md text-[#091426] mb-2">Rapidez Ferventa</h3>
                <p className="text-on-surface-variant text-body-sm leading-relaxed">
                  Reducimos los tiempos de espera gracias a la automatización de procesos y optimización de nuestro inventario.
                </p>
              </div>
            </Box>

            {/* Card 3 */}
            <Box p="lg" rounded="xl" className="bg-white border border-outline-variant flex flex-col justify-between h-60 shadow-sm">
              <Icon name="Eye" size="xl" className="text-[#855300]" />
              <div>
                <h3 className="font-headline-md text-on-background mb-2">Transparencia Total</h3>
                <p className="text-on-surface-variant text-body-sm leading-relaxed">
                  Accede a la orden de servicio, piezas consumidas y evidencias fotográficas directamente desde este portal digital.
                </p>
              </div>
            </Box>
          </Grid>
        </section>
      </main>

      {/* Footer Section */}
      <footer className="bg-[#091426] text-slate-400 py-12 border-t border-slate-800 mt-24">
        <Box px="lg" className="max-w-7xl mx-auto">
          <Grid cols={{ base: 1, md: 4 }} gap="xl">
            <div className="md:col-span-2 min-w-0">
              <Flex align="center" gap="xs" className="mb-4">
                <Box bg="secondary" p="xs" className="rounded-lg flex items-center justify-center">
                  <Icon name="Wrench" size="sm" className="text-white" />
                </Box>
                <span className="font-headline-md text-white tracking-tight font-bold">Ferventa</span>
              </Flex>
              <p className="text-sm mb-4 leading-relaxed">
                La plataforma líder en gestión de talleres mecánicos de alto rendimiento. Precisión en cada proceso, confianza en cada entrega.
              </p>
              <p className="text-xs text-slate-500">
                © {new Date().getFullYear()} Ferventa Workshop OS. Todos los derechos reservados.
              </p>
            </div>

            <div className="min-w-0">
              <h4 className="text-white font-bold text-sm mb-4 uppercase tracking-wider">Servicios</h4>
              <ul className="space-y-2 text-sm">
                <li>Mantenimiento Preventivo</li>
                <li>Diagnóstico de Motor</li>
                <li>Frenos y Suspensión</li>
              </ul>
            </div>

            <div className="min-w-0">
              <h4 className="text-white font-bold text-sm mb-4 uppercase tracking-wider">Contacto</h4>
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

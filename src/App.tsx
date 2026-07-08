import { useState } from 'react';
import {
  Flex,
  Grid,
  Stack,
  Box,
  PrimaryButton,
  SecondaryButton,
  TertiaryButton,
  TextInput,
  NumberInput,
  AutocompleteInput,
  Icon
} from './app/presentation/components';
import { ClientPortalPage } from './app/presentation/pages/ClientPortalPage';
import { LoginPage } from './app/presentation/pages/LoginPage';
import { AdminDashboardPage } from './app/presentation/pages/AdminDashboardPage';
import { useAuthStore } from './core/stores/useAuthStore';

function App() {
  const [currentView, setCurrentView] = useState<'portal' | 'showcase' | 'login' | 'dashboard'>('portal');
  const { isAuthenticated } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [submittedValue, setSubmittedValue] = useState<string | null>(null);

  const [textValue, setTextValue] = useState('');
  const [numberValue, setNumberValue] = useState('');
  const [autocompleteValue, setAutocompleteValue] = useState('');

  const autocompleteOptions = [
    { label: 'React', value: 'react' },
    { label: 'TypeScript', value: 'typescript' },
    { label: 'Tailwind CSS', value: 'tailwind' },
    { label: 'Next.js', value: 'next' },
    { label: 'Vite', value: 'vite' },
    { label: 'DaisyUI', value: 'daisyui' },
    { label: 'Node.js', value: 'nodejs' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setSubmittedValue(inputValue);
      setInputValue('');
    }, 1500);
  };

  const handleOpenAdmin = () => {
    if (isAuthenticated()) {
      setCurrentView('dashboard');
    } else {
      setCurrentView('login');
    }
  };

  if (currentView === 'portal') {
    return (
      <ClientPortalPage
        onOpenAdmin={handleOpenAdmin}
      />
    );
  }

  if (currentView === 'login') {
    return <LoginPage onLoginSuccess={() => setCurrentView('dashboard')} />;
  }

  if (currentView === 'dashboard') {
    // Basic protection: if not authenticated, go back to login
    if (!isAuthenticated()) {
      return <LoginPage onLoginSuccess={() => setCurrentView('dashboard')} />;
    }
    return <AdminDashboardPage onLogout={() => setCurrentView('portal')} />;
  }

  return (
    <Box className="min-h-screen bg-background text-on-background">
      {/* Navbar */}
      <Box py="sm" px="lg" className="bg-surface-container-lowest border-b border-[#cbd5e1]">
        <Flex justify="between" align="center">
          <Flex align="center" gap="sm">
            <Box bg="primary" p="xs" className="text-white flex items-center justify-center rounded">
              <Icon name="Activity" size="lg" />
            </Box>
            <span className="font-headline-md tracking-tight text-on-background">Ferventa</span>
            <span className="badge bg-[#ffddb8] text-[#653e00] badge-sm font-semibold border-none rounded-full">Foundations v1.0</span>
          </Flex>

          <Flex align="center" gap="sm">
            <SecondaryButton variant="ghost" size="sm" className="p-2">
              <Icon name="Bell" size="sm" />
            </SecondaryButton>
            <SecondaryButton variant="ghost" size="sm" className="p-2">
              <Icon name="Settings" size="sm" />
            </SecondaryButton>
            <div className="avatar placeholder">
              <div className="bg-[#cbd5e1] text-[#0b1c30] w-8 rounded-full flex items-center justify-center font-semibold text-xs">
                AX
              </div>
            </div>
          </Flex>
        </Flex>
      </Box>

      {/* Main Container */}
      <Box p="lg" className="max-w-7xl mx-auto">
        <Grid cols={{ base: 1, lg: 4 }} gap="lg">
          {/* Sidebar Navigation */}
          <Box className="lg:col-span-1">
            <Box rounded="lg" p="md" className="bg-surface-container-lowest border border-[#e2e8f0]">
              <Stack gap="sm">
                <span className="font-label-caps text-on-surface-variant/75 px-2 mb-2">Navigation</span>
                <SecondaryButton
                  variant="outline"
                  onClick={() => setCurrentView('portal')}
                  className="justify-start gap-3 w-full text-left border-secondary text-secondary hover:bg-secondary/5 font-semibold mb-2"
                >
                  <Icon name="ArrowLeft" size="sm" />
                  Ir al Portal
                </SecondaryButton>
                <PrimaryButton variant="soft" className="justify-start gap-3 w-full text-left">
                  <Icon name="LayoutDashboard" size="sm" />
                  Dashboard
                </PrimaryButton>
                <SecondaryButton variant="ghost" className="justify-start gap-3 w-full text-left">
                  <Icon name="Folder" size="sm" />
                  Features
                </SecondaryButton>
                <SecondaryButton variant="ghost" className="justify-start gap-3 w-full text-left">
                  <Icon name="Palette" size="sm" />
                  Theme Customizer
                </SecondaryButton>
                <SecondaryButton variant="ghost" className="justify-start gap-3 w-full text-left">
                  <Icon name="Sliders" size="sm" />
                  Core Services
                </SecondaryButton>
              </Stack>
            </Box>
          </Box>

          {/* Main Dashboard Content */}
          <Stack gap="lg" className="lg:col-span-3">
            {/* Banner card */}
            <Box className="relative overflow-hidden bg-gradient-to-r from-[#091426] to-[#1e293b] text-white p-6 rounded-lg shadow-sm border border-[#e2e8f0]">
              <div className="absolute right-0 bottom-0 opacity-10 translate-x-1/4 translate-y-1/4">
                <Icon name="Layers" size={240} />
              </div>
              <Stack gap="sm" className="relative z-10 max-w-md">
                <h1 className="font-display-lg text-white">System Foundations Ready</h1>
                <p className="text-white/80 font-body-sm leading-relaxed">
                  Clean Architecture directory structure configured. Tailwind CSS v4 & DaisyUI v5 initialized. Basic atomic layout primitives and components are ready for usage.
                </p>
                <Flex gap="sm" className="mt-2">
                  <TertiaryButton size="sm">
                    Get Started
                  </TertiaryButton>
                  <SecondaryButton size="sm" className="text-white border-white/30 hover:bg-white/10">
                    Read Docs
                  </SecondaryButton>
                </Flex>
              </Stack>
            </Box>

            {/* Quick Stats Grid */}
            <Grid cols={{ base: 1, md: 3 }} gap="md">
              <Box p="md" rounded="lg" className="bg-surface-container-lowest border border-[#e2e8f0]">
                <Flex align="center" justify="between">
                  <Stack gap="xs">
                    <span className="font-label-caps text-on-surface-variant/75">Layout Primitives</span>
                    <span className="text-2xl font-bold font-data-mono text-on-background">4 Atoms</span>
                  </Stack>
                  <Box bg="neutral" p="sm" className="bg-opacity-10 text-neutral rounded">
                    <Icon name="Box" size="lg" />
                  </Box>
                </Flex>
              </Box>

              <Box p="md" rounded="lg" className="bg-surface-container-lowest border border-[#e2e8f0]">
                <Flex align="center" justify="between">
                  <Stack gap="xs">
                    <span className="font-label-caps text-on-surface-variant/75">UI Components</span>
                    <span className="text-2xl font-bold font-data-mono text-on-background">3 Atoms</span>
                  </Stack>
                  <Box bg="info" p="sm" className="bg-opacity-10 text-info rounded">
                    <Icon name="Component" size="lg" />
                  </Box>
                </Flex>
              </Box>

              <Box p="md" rounded="lg" className="bg-surface-container-lowest border border-[#e2e8f0]">
                <Flex align="center" justify="between">
                  <Stack gap="xs">
                    <span className="font-label-caps text-on-surface-variant/75">Bundle CSS Size</span>
                    <span className="text-2xl font-bold font-data-mono text-on-background">~4.2 kB</span>
                  </Stack>
                  <Box bg="success" p="sm" className="bg-opacity-10 text-success rounded">
                    <Icon name="Zap" size="lg" />
                  </Box>
                </Flex>
              </Box>
            </Grid>

            {/* Interactive Showcase Form */}
            <Grid cols={{ base: 1, lg: 3 }} gap="lg">
              <Box p="lg" rounded="lg" className="bg-surface-container-lowest border border-[#e2e8f0]">
                <Stack gap="md">
                  <Flex align="center" gap="xs">
                    <Icon name="Send" size="sm" className="text-primary" />
                    <h3 className="font-headline-md text-on-background">Interactive Form Atom</h3>
                  </Flex>
                  <p className="font-body-sm text-on-surface-variant">
                    Test the reactivity of the input field, button states, loading spinners, and input properties.
                  </p>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="form-control">
                      <label className="label">
                        <span className="font-label-caps text-on-surface-variant">Your Feature Name</span>
                      </label>
                      <TextInput
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="e.g. Authentication"
                        disabled={isLoading}
                      />
                    </div>

                    <PrimaryButton
                      type="submit"
                      loading={isLoading}
                      className="w-full"
                    >
                      Initialize Feature
                    </PrimaryButton>
                  </form>

                  {submittedValue && (
                    <Box p="sm" className="bg-surface-container-low rounded border-l-4 border-success">
                      <Flex align="center" gap="sm">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-success shrink-0"
                        >
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                        <div>
                          <p className="font-label-caps text-success">Success!</p>
                          <p className="font-body-sm text-on-surface">Initialized feature mock for <strong className="font-data-mono">{submittedValue}</strong></p>
                        </div>
                      </Flex>
                    </Box>
                  )}
                </Stack>
              </Box>

              {/* Specialized Inputs Showcase */}
              <Box p="lg" rounded="lg" className="bg-surface-container-lowest border border-[#e2e8f0]">
                <Stack gap="md">
                  <Flex align="center" gap="xs">
                    <Icon name="Type" size="sm" className="text-[#855300]" />
                    <h3 className="font-headline-md text-on-background">Specialized Inputs</h3>
                  </Flex>
                  <p className="font-body-sm text-on-surface-variant">
                    Specifically tailored input elements for text, strict numbers, and autocomplete lists.
                  </p>

                  <Stack gap="xs">
                    <span className="font-label-caps text-on-surface-variant">TextInput (Text Only)</span>
                    <TextInput
                      value={textValue}
                      onChange={(e) => setTextValue(e.target.value)}
                      placeholder="Type text here..."
                    />
                    {textValue && <span className="font-body-sm text-on-surface-variant/70">Value: {textValue}</span>}
                  </Stack>

                  <Stack gap="xs">
                    <span className="font-label-caps text-on-surface-variant">NumberInput (Strict Numeric)</span>
                    <NumberInput
                      value={numberValue}
                      onChange={(e) => setNumberValue(e.target.value)}
                      placeholder="Only numbers (negative & decimals ok)"
                    />
                    {numberValue && <span className="font-data-mono text-on-surface-variant/70">Value: {numberValue}</span>}
                  </Stack>

                  <Stack gap="xs">
                    <span className="font-label-caps text-on-surface-variant">AutocompleteInput</span>
                    <AutocompleteInput
                      options={autocompleteOptions}
                      value={autocompleteValue}
                      onChange={(val) => setAutocompleteValue(val)}
                      placeholder="Select a technology..."
                    />
                    {autocompleteValue && (
                      <span className="font-body-sm text-on-surface-variant/70">
                        Selected: <strong className="font-data-mono">{autocompleteValue}</strong>
                      </span>
                    )}
                  </Stack>
                </Stack>
              </Box>

              {/* Component Library Showcase */}
              <Box p="lg" rounded="lg" className="bg-surface-container-lowest border border-[#e2e8f0]">
                <Stack gap="md">
                  <Flex align="center" gap="xs">
                    <Icon name="SlidersHorizontal" size="sm" className="text-primary" />
                    <h3 className="font-headline-md text-on-background">State & Size Showcases</h3>
                  </Flex>
                  <p className="font-body-sm text-on-surface-variant">
                    Demonstration of various atom visual modifiers (colors, loaders, skeletons).
                  </p>

                  <Stack gap="sm">
                    <span className="font-label-caps text-on-surface-variant">Button Atoms (Sizes)</span>
                    <Flex gap="xs" wrap align="center">
                      <PrimaryButton size="xs">Primary XS</PrimaryButton>
                      <SecondaryButton size="sm">Secondary SM</SecondaryButton>
                      <TertiaryButton size="md">Tertiary MD</TertiaryButton>
                      <PrimaryButton size="lg">Primary LG</PrimaryButton>
                    </Flex>
                  </Stack>

                  <Stack gap="sm">
                    <span className="font-label-caps text-on-surface-variant">PrimaryButton Variants</span>
                    <Flex gap="xs" wrap>
                      <PrimaryButton variant="solid" size="xs">Solid</PrimaryButton>
                      <PrimaryButton variant="outline" size="xs">Outline</PrimaryButton>
                      <PrimaryButton variant="soft" size="xs">Soft</PrimaryButton>
                      <PrimaryButton variant="ghost" size="xs">Ghost</PrimaryButton>
                      <PrimaryButton variant="link" size="xs">Link</PrimaryButton>
                    </Flex>
                  </Stack>

                  <Stack gap="sm">
                    <span className="font-label-caps text-on-surface-variant">SecondaryButton Variants</span>
                    <Flex gap="xs" wrap>
                      <SecondaryButton variant="solid" size="xs">Solid</SecondaryButton>
                      <SecondaryButton variant="outline" size="xs">Outline</SecondaryButton>
                      <SecondaryButton variant="soft" size="xs">Soft</SecondaryButton>
                      <SecondaryButton variant="ghost" size="xs">Ghost</SecondaryButton>
                      <SecondaryButton variant="link" size="xs">Link</SecondaryButton>
                    </Flex>
                  </Stack>

                  <Stack gap="sm">
                    <span className="font-label-caps text-on-surface-variant">State Modifiers</span>
                    <Flex gap="xs" wrap align="center">
                      <PrimaryButton loading size="xs">Loading</PrimaryButton>
                      <SecondaryButton disabled size="xs">Disabled</SecondaryButton>
                      <TertiaryButton skeleton size="xs" />
                    </Flex>
                  </Stack>
                </Stack>
              </Box>
            </Grid>
          </Stack>
        </Grid>
      </Box>
    </Box>
  );
}

export default App;

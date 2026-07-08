import React, { useState } from 'react';
import { useClientPortalStore } from '../../stores/useClientPortalStore';
import { Box, Flex, Stack, TextInput, PrimaryButton, Icon } from '@/app/presentation/components';

export const StatusSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const searchStatus = useClientPortalStore((state) => state.searchStatus);
  const searchLoading = useClientPortalStore((state) => state.searchLoading);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    searchStatus(query.trim());
  };

  return (
    <Box p="lg" rounded="xl" className="bg-white border border-[#e2e8f0] shadow-sm">
      <Stack gap="md">
        <Flex align="center" gap="sm">
          <Icon name="Search" className="text-[#091426]" />
          <h2 className="font-headline-md text-on-background">Consultar mi Vehículo</h2>
        </Flex>
        
        <p className="font-body-sm text-on-surface-variant leading-relaxed">
          Ingresa tu número de orden (Folio), el teléfono o los últimos 4 números de serie de tu vehículo para conocer el avance de tu servicio en tiempo real.
        </p>

        <form onSubmit={handleSearch} className="space-y-3">
          <div className="relative w-full">
            <TextInput
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Número de orden, serie (últimos 4 números) o teléfono"
              disabled={searchLoading}
              className="pl-10"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Icon name="Hash" size="sm" />
            </span>
          </div>
          <PrimaryButton
            type="submit"
            loading={searchLoading}
            disabled={!query.trim()}
            className="w-full bg-[#855300] hover:bg-[#855300]/90 text-white border-none"
          >
            Buscar
          </PrimaryButton>
        </form>
      </Stack>
    </Box>
  );
};

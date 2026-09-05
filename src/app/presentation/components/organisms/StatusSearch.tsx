import React, { useState } from 'react';
import { useClientPortalStore } from '@/app/presentation/stores';
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
    <Box p="lg" rounded="xl" className="bg-base-100 border border-base-300 shadow-sm">
      <Stack gap="md">
        <Flex align="center" gap="sm">
          <Icon name="Search" className="text-primary" />
          <h2 className="font-headline-md text-base-content font-bold">Consultar mi Vehículo</h2>
        </Flex>
        
        <p className="font-body-sm text-base-content/70 leading-relaxed">
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
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40">
              <Icon name="Hash" size="sm" />
            </span>
          </div>
          <PrimaryButton
            type="submit"
            loading={searchLoading}
            disabled={!query.trim()}
            className="w-full"
          >
            Buscar
          </PrimaryButton>
        </form>
      </Stack>
    </Box>
  );
};

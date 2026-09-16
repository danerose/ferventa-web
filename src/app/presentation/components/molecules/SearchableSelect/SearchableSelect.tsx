import React, { useState, useRef, useEffect } from 'react';
import { Icon, Box, Flex, Text } from '@/app/presentation/components';
import { cn } from '@/core/utils/cn';
import type { Size } from '@/core/types';

interface Option {
  id: string;
  name: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (id: string) => void;
  onCreateNew?: (name: string) => Promise<string | void>;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  size?: Size;
  className?: string;
}

const sizeStyles: Record<Size, string> = {
  xs: 'select-xs text-xs h-7 min-h-7 px-2.5',
  sm: 'select-sm text-xs h-8 min-h-8 px-3',
  md: 'select-md text-sm h-10 min-h-10 px-3.5',
  lg: 'select-lg text-base h-12 min-h-12 px-4',
  xl: 'select-lg text-lg h-14 min-h-14 px-4',
};

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  onCreateNew,
  placeholder = 'Seleccionar...',
  disabled = false,
  error = false,
  size = 'sm',
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.id === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
    }
  }, [isOpen]);

  const filteredOptions = options.filter((opt) =>
    opt.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateNew = async () => {
    if (!onCreateNew || !searchTerm.trim()) return;
    setIsCreating(true);
    try {
      const newId = await onCreateNew(searchTerm.trim());
      if (newId) onChange(newId);
      setIsOpen(false);
    } catch (err) {
      console.error('Error creating new item:', err);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Box className={cn('relative w-full', className)} ref={containerRef}>
      <Box
        role="button"
        tabIndex={0}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (!disabled && (e.key === 'Enter' || e.key === ' ')) setIsOpen(!isOpen);
        }}
        className={cn(
          'select select-bordered rounded-DEFAULT w-full bg-base-100 text-base-content border-base-300 transition-colors focus:border-primary focus:outline-none flex items-center justify-between font-normal text-left cursor-pointer select-none',
          sizeStyles[size],
          error && 'select-error border-error text-error',
          disabled && 'opacity-50 cursor-not-allowed bg-base-200 pointer-events-none'
        )}
      >
        <Text
          size="xs"
          weight={selectedOption ? 'medium' : 'normal'}
          variant={selectedOption ? 'body' : 'muted'}
          className="truncate"
        >
          {selectedOption ? selectedOption.name : placeholder}
        </Text>
        <Icon name="ChevronDown" size="xs" className="text-base-content/50 shrink-0 ml-2" />
      </Box>

      {isOpen && (
        <Box className="absolute z-50 w-full mt-1 bg-base-100 border border-base-300 rounded-DEFAULT shadow-xl max-h-60 overflow-y-auto text-base-content">
          <Box className="sticky top-0 bg-base-100 p-2 border-b border-base-300 z-10">
            <input
              type="text"
              className="input input-xs input-bordered w-full bg-base-200 text-base-content border-base-300 rounded-DEFAULT focus:border-primary focus:outline-none text-xs"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              autoFocus
            />
          </Box>

          <Box className="py-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <Flex
                  key={opt.id}
                  align="center"
                  justify="between"
                  className={cn(
                    'px-3.5 py-2 text-xs cursor-pointer hover:bg-base-200 text-base-content transition-colors',
                    opt.id === value && 'bg-base-200 font-bold text-primary'
                  )}
                  onClick={() => {
                    onChange(opt.id);
                    setIsOpen(false);
                  }}
                >
                  <Text size="xs" className="truncate text-inherit">{opt.name}</Text>
                  {opt.id === value && <Icon name="Check" size="xs" className="text-primary shrink-0" />}
                </Flex>
              ))
            ) : (
              <Box className="px-3.5 py-3 text-center">
                <Text size="xs" variant="muted">No se encontraron resultados</Text>
              </Box>
            )}
          </Box>

          {searchTerm && !filteredOptions.some((opt) => opt.name.toLowerCase() === searchTerm.toLowerCase()) && onCreateNew && (
            <Flex
              align="center"
              justify="center"
              gap="xs"
              className="sticky bottom-0 bg-base-200 p-2.5 border-t border-base-300 cursor-pointer hover:bg-base-300 text-primary text-xs font-semibold transition-colors"
              onClick={handleCreateNew}
            >
              {isCreating ? (
                <Text size="xs" color="primary">Creando...</Text>
              ) : (
                <>
                  <Icon name="Plus" size="xs" />
                  <Text size="xs" color="primary" weight="bold">Crear "{searchTerm}"</Text>
                </>
              )}
            </Flex>
          )}
        </Box>
      )}
    </Box>
  );
};

import React, { useState, useRef, useEffect } from 'react';
import { Icon } from '../../atoms/Icon/Icon';

interface Option {
  id: string;
  name: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (id: string) => void;
  onCreateNew?: (name: string) => Promise<void>;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  onCreateNew,
  placeholder = 'Seleccionar...',
  disabled = false,
  error = false,
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
      await onCreateNew(searchTerm.trim());
      setIsOpen(false);
    } catch (error) {
      console.error('Error creating new item:', error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <div
        className={`flex items-center justify-between w-full p-[10px_14px] rounded-lg border bg-white cursor-pointer ${
          error ? 'border-[#ba1a1a] bg-[#ba1a1a]/5 text-[#ba1a1a]' : 'border-slate-300'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className={selectedOption ? 'text-slate-900' : 'text-slate-400'}>
          {selectedOption ? selectedOption.name : placeholder}
        </span>
        <Icon name="ChevronDown" size="sm" className="text-slate-400" />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          <div className="sticky top-0 bg-white p-2 border-b border-slate-100">
            <input
              type="text"
              className="w-full p-2 text-sm border border-slate-200 rounded outline-none focus:border-blue-500"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              autoFocus
            />
          </div>

          <div className="py-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <div
                  key={opt.id}
                  className="px-4 py-2 text-sm cursor-pointer hover:bg-slate-50 text-slate-700"
                  onClick={() => {
                    onChange(opt.id);
                    setIsOpen(false);
                  }}
                >
                  {opt.name}
                </div>
              ))
            ) : (
              <div className="px-4 py-2 text-sm text-slate-500 text-center">
                No se encontraron resultados
              </div>
            )}
          </div>

          {searchTerm && !filteredOptions.some((opt) => opt.name.toLowerCase() === searchTerm.toLowerCase()) && onCreateNew && (
            <div
              className="sticky bottom-0 bg-slate-50 p-2 border-t border-slate-100 cursor-pointer hover:bg-slate-100 flex items-center justify-center gap-2 text-blue-600 text-sm font-medium"
              onClick={handleCreateNew}
            >
              {isCreating ? (
                'Creando...'
              ) : (
                <>
                  <Icon name="Plus" size="sm" />
                  Crear "{searchTerm}"
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

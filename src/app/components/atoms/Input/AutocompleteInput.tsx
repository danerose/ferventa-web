import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/core/utils/cn';

export interface AutocompleteOption {
  label: string;
  value: string;
  [key: string]: any;
}

export interface AutocompleteInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'value' | 'onChange'> {
  options: AutocompleteOption[];
  value?: string;
  onChange?: (value: string) => void;
  onClear?: () => void;
  noOptionsText?: string;
  color?: 'primary' | 'secondary' | 'accent' | 'neutral' | 'info' | 'success' | 'warning' | 'error';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  variant?: 'outline' | 'ghost' | 'soft' | 'bordered';
  error?: boolean;
}

const colorMap = {
  primary: 'focus:border-[#091426] border-[#cbd5e1]',
  secondary: 'focus:border-[#855300] border-[#cbd5e1]',
  accent: 'focus:border-[#f59e0b] border-[#cbd5e1]',
  neutral: 'focus:border-[#1e293b] border-[#cbd5e1]',
  info: 'focus:border-blue-500 border-blue-200',
  success: 'focus:border-[#10b981] border-[#10b981]/30 bg-[#10b981]/5',
  warning: 'focus:border-[#f59e0b] border-[#f59e0b]/30 bg-[#f59e0b]/5',
  error: 'focus:border-[#ba1a1a] border-[#ba1a1a]/30 bg-[#ba1a1a]/5',
};

const sizeMap = {
  xs: 'px-2.5 py-1 text-xs min-h-[28px]',
  sm: 'px-3 py-1.5 text-sm min-h-[36px]',
  md: 'px-3.5 py-2 text-base min-h-[44px]',
  lg: 'px-4 py-2.5 text-lg min-h-[52px]',
};

const variantMap = {
  outline: 'border bg-white',
  bordered: 'border border-2 bg-white',
  ghost: 'border-transparent bg-transparent hover:bg-[#f1f5f9] focus:bg-white focus:border-gray-300',
  soft: 'border-transparent bg-[#e5eeff]/40 text-[#0b1c30] hover:bg-[#e5eeff]/60 focus:bg-white focus:border-[#1e293b]',
};

export const AutocompleteInput = React.forwardRef<HTMLInputElement, AutocompleteInputProps>(
  (
    {
      options = [],
      value = '',
      onChange,
      onClear,
      placeholder = 'Search...',
      noOptionsText = 'No options found',
      className,
      color = 'neutral',
      size = 'md',
      variant = 'outline',
      error,
      disabled,
      ...props
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const optionsRef = useRef<HTMLUListElement>(null);

    // Sync query with selected value's label or query input
    useEffect(() => {
      const selectedOption = options.find((opt) => opt.value === value);
      if (selectedOption) {
        setQuery(selectedOption.label);
      } else {
        setQuery('');
      }
    }, [value, options]);

    // Handle clicks outside container to close dropdown
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          containerRef.current &&
          !containerRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, []);

    // Filter options based on user query when input is focused/open
    const filteredOptions = query
      ? options.filter((opt) =>
          opt.label.toLowerCase().includes(query.toLowerCase())
        )
      : options;

    // Reset highlighted index when options list changes
    useEffect(() => {
      setHighlightedIndex(-1);
    }, [query]);

    // Scroll highlighted option into view if necessary
    useEffect(() => {
      if (
        highlightedIndex >= 0 &&
        optionsRef.current &&
        optionsRef.current.children[highlightedIndex]
      ) {
        const item = optionsRef.current.children[highlightedIndex] as HTMLElement;
        const container = optionsRef.current;
        if (item.offsetTop < container.scrollTop) {
          container.scrollTop = item.offsetTop;
        } else if (
          item.offsetTop + item.clientHeight >
          container.scrollTop + container.clientHeight
        ) {
          container.scrollTop =
            item.offsetTop + item.clientHeight - container.clientHeight;
        }
      }
    }, [highlightedIndex]);

    const handleSelectOption = (option: AutocompleteOption) => {
      setQuery(option.label);
      if (onChange) {
        onChange(option.value);
      }
      setIsOpen(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!isOpen) {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter') {
          setIsOpen(true);
          e.preventDefault();
        }
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev < filteredOptions.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev > 0 ? prev - 1 : filteredOptions.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (
            highlightedIndex >= 0 &&
            highlightedIndex < filteredOptions.length
          ) {
            handleSelectOption(filteredOptions[highlightedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setIsOpen(false);
          break;
        case 'Tab':
          setIsOpen(false);
          break;
      }
    };

    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation();
      setQuery('');
      if (onClear) {
        onClear();
      } else if (onChange) {
        onChange('');
      }
      if (inputRef.current) {
        inputRef.current.focus();
      }
    };

    return (
      <div ref={containerRef} className={cn('relative w-full', className)}>
        <div className="relative">
          <input
            ref={(node) => {
              if (typeof ref === 'function') {
                ref(node);
              } else if (ref) {
                ref.current = node;
              }
              (inputRef as any).current = node;
            }}
            type="text"
            disabled={disabled}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
              if (!e.target.value && onChange) {
                onChange('');
              }
            }}
            onFocus={() => setIsOpen(true)}
            placeholder={placeholder}
            onKeyDown={handleKeyDown}
            className={cn(
              'w-full pr-10 font-sans rounded border-[#cbd5e1] text-[#0b1c30] placeholder:text-gray-400 outline-none transition-all duration-150',
              'focus:ring-0 focus:border-2',
              disabled && 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-60',
              variantMap[variant],
              colorMap[color],
              sizeMap[size],
              error && 'border-[#ba1a1a] focus:border-[#ba1a1a] bg-[#ba1a1a]/5 text-[#ba1a1a]'
            )}
            {...props}
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 gap-1">
            {value && (
              <button
                type="button"
                onClick={handleClear}
                className="text-base-content/40 hover:text-base-content/85 transition"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="text-base-content/40 hover:text-base-content/85 transition"
            >
              {isOpen ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m18 15-6-6-6 6" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {isOpen && (
          <div className="absolute z-50 mt-1 w-full bg-base-100 border border-base-content/10 rounded-box shadow-xl overflow-hidden animate-in fade-in duration-200">
            <ul
              ref={optionsRef}
              className="menu menu-sm p-1 max-h-60 overflow-y-auto w-full"
            >
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option, index) => {
                  const isSelected = option.value === value;
                  const isHighlighted = index === highlightedIndex;

                  return (
                    <li key={option.value}>
                      <button
                        type="button"
                        onClick={() => handleSelectOption(option)}
                        className={cn(
                          'w-full text-left rounded-md px-3 py-2 flex items-center justify-between',
                          isHighlighted && 'bg-base-200 text-base-content',
                          isSelected && 'bg-primary text-primary-content hover:bg-primary/90 font-medium'
                        )}
                      >
                        <span>{option.label}</span>
                        {isSelected && (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M20 6 9 17l-5-5" />
                          </svg>
                        )}
                      </button>
                    </li>
                  );
                })
              ) : (
                <li className="disabled text-base-content/40 p-3 text-center text-xs">
                  {noOptionsText}
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
    );
  }
);

AutocompleteInput.displayName = 'AutocompleteInput';

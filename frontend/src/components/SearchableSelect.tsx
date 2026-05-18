import React, { useState, useRef, useEffect, useMemo, useId } from 'react';
import { ChevronDownIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

interface SearchableSelectOption {
  value: string;
  label: string;
  sublabel?: string;
}

interface SearchableSelectProps {
  options: SearchableSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select option',
  label,
  required = false,
  className = '',
  disabled = false
}) => {
  const id = useId();
  const triggerId = `${id}-trigger`;
  const listboxId = `${id}-listbox`;
  const labelId = label ? `${id}-label` : undefined;

  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const sortedOptions = useMemo(
    () => [...options].sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' })),
    [options]
  );

  const filteredOptions = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return sortedOptions.filter(
      o => o.label.toLowerCase().includes(q) || o.sublabel?.toLowerCase().includes(q)
    );
  }, [sortedOptions, searchTerm]);

  const selectedOption = useMemo(() => sortedOptions.find(o => o.value === value), [sortedOptions, value]);
  const displayValue = selectedOption?.label ?? placeholder;

  // Reset active index to the selected item whenever the filtered list changes
  useEffect(() => {
    const idx = filteredOptions.findIndex(o => o.value === value);
    setActiveIndex(idx);
  }, [filteredOptions, value]);

  // Scroll the highlighted option into view
  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const el = listRef.current.children[activeIndex] as HTMLElement | undefined;
      el?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  // Close on outside click
  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close();
      }
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) searchInputRef.current?.focus();
  }, [isOpen]);

  const close = () => {
    setIsOpen(false);
    setSearchTerm('');
    setActiveIndex(-1);
  };

  const handleToggle = () => {
    if (disabled) return;
    if (isOpen) {
      close();
    } else {
      setIsOpen(true);
    }
  };

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    close();
    triggerRef.current?.focus();
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex(prev => (prev + 1 >= filteredOptions.length ? 0 : prev + 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex(prev => (prev <= 0 ? filteredOptions.length - 1 : prev - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && filteredOptions[activeIndex]) {
          handleSelect(filteredOptions[activeIndex].value);
        }
        break;
      case 'Escape':
        close();
        triggerRef.current?.focus();
        break;
      case 'Tab':
        close();
        break;
    }
  };

  const activeOptionId = activeIndex >= 0 ? `${id}-option-${activeIndex}` : undefined;

  return (
    <div ref={containerRef} className={clsx('relative', className)}>
      {label && (
        <label
          id={labelId}
          htmlFor={triggerId}
          className="block text-xs font-medium text-gray-400 mb-1"
        >
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}

      {/* Trigger button */}
      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? listboxId : undefined}
        aria-labelledby={labelId}
        className={clsx(
          'w-full px-3 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-xs cursor-pointer flex items-center justify-between text-left',
          'focus:outline-none focus:ring-1 focus:ring-blue-500',
          disabled && 'opacity-50 cursor-not-allowed',
          isOpen && 'ring-1 ring-blue-500'
        )}
      >
        <span className={clsx(!value && 'text-gray-400')}>{displayValue}</span>
        <div className="flex items-center gap-1">
          {value && !disabled && (
            <span
              role="button"
              tabIndex={-1}
              aria-label="Clear selection"
              onClick={handleClear}
              className="p-0.5 hover:bg-gray-600 rounded transition-colors"
            >
              <XMarkIcon className="h-3 w-3 text-gray-400 hover:text-white" />
            </span>
          )}
          <ChevronDownIcon
            className={clsx('h-3 w-3 text-gray-400 transition-transform', isOpen && 'rotate-180')}
          />
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-gray-700 border border-gray-600 rounded shadow-lg max-h-64 overflow-hidden flex flex-col">
          {/* Search input */}
          <div className="p-2 border-b border-gray-600 flex-shrink-0">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                role="combobox"
                aria-autocomplete="list"
                aria-expanded={isOpen}
                aria-controls={listboxId}
                aria-activedescendant={activeOptionId}
                aria-label="Search options"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search..."
                className="w-full pl-8 pr-2 py-1.5 bg-gray-600 border border-gray-500 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
              />
            </div>
          </div>

          {/* Options list */}
          <div
            ref={listRef}
            id={listboxId}
            role="listbox"
            aria-label={label ?? 'Options'}
            className="overflow-y-auto flex-1"
          >
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => (
                <div
                  key={option.value}
                  id={`${id}-option-${index}`}
                  role="option"
                  aria-selected={value === option.value}
                  onClick={() => handleSelect(option.value)}
                  className={clsx(
                    'px-3 py-2 cursor-pointer transition-colors text-xs',
                    index === activeIndex && value !== option.value && 'bg-gray-600',
                    value === option.value
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-200 hover:bg-gray-600'
                  )}
                >
                  <div className="font-medium">{option.label}</div>
                  {option.sublabel && (
                    <div className="text-gray-400 mt-0.5">{option.sublabel}</div>
                  )}
                </div>
              ))
            ) : (
              <div className="px-3 py-4 text-center text-gray-400 text-xs">No results found</div>
            )}
          </div>

          {/* Results count */}
          {filteredOptions.length > 0 && (
            <div className="px-3 py-1.5 border-t border-gray-600 text-xs text-gray-400 flex-shrink-0">
              {filteredOptions.length} of {sortedOptions.length} results
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
export type { SearchableSelectOption };

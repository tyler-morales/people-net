import { useState, useEffect, useRef } from 'react';

export default function SearchableDropdown({
    value,
    onChange,
    options = [],
    placeholder,
    label,
    onClear,
    allowCustom = true // Allow typing values not in the list
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState(value || '');
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const inputRef = useRef(null);
    const dropdownRef = useRef(null);

    // Filter options based on search term
    const filteredOptions = options.filter(option =>
        option.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Update search term when value changes externally
    useEffect(() => {
        setSearchTerm(value || '');
    }, [value]);

    // Handle clicking outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
                setHighlightedIndex(-1);
                // If allowCustom is false and current value isn't in options, clear it
                if (!allowCustom && searchTerm && !options.includes(searchTerm)) {
                    setSearchTerm('');
                    onChange('');
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [searchTerm, options, allowCustom, onChange]);

    const handleInputChange = (e) => {
        const newValue = e.target.value;
        setSearchTerm(newValue);
        setIsOpen(true);
        setHighlightedIndex(-1);

        // If allowing custom values or value exists in options, update immediately
        if (allowCustom || options.includes(newValue)) {
            onChange(newValue);
        }
    };

    const handleInputFocus = () => {
        setIsOpen(true);
    };

    const handleOptionClick = (option) => {
        setSearchTerm(option);
        onChange(option);
        setIsOpen(false);
        setHighlightedIndex(-1);
        inputRef.current?.blur();
    };

    const handleKeyDown = (e) => {
        if (!isOpen) {
            if (e.key === 'ArrowDown' || e.key === 'Enter') {
                setIsOpen(true);
                e.preventDefault();
            }
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setHighlightedIndex(prev =>
                    prev < filteredOptions.length - 1 ? prev + 1 : 0
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setHighlightedIndex(prev =>
                    prev > 0 ? prev - 1 : filteredOptions.length - 1
                );
                break;
            case 'Enter':
                e.preventDefault();
                if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
                    handleOptionClick(filteredOptions[highlightedIndex]);
                } else if (allowCustom && searchTerm) {
                    onChange(searchTerm);
                    setIsOpen(false);
                }
                break;
            case 'Escape':
                setIsOpen(false);
                setHighlightedIndex(-1);
                inputRef.current?.blur();
                break;
            case 'Tab':
                setIsOpen(false);
                setHighlightedIndex(-1);
                break;
        }
    };

    const handleClear = () => {
        setSearchTerm('');
        onChange('');
        onClear?.();
        inputRef.current?.focus();
    };

    return (
        <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-700">
                {label}
            </label>
            <div className="relative" ref={dropdownRef}>
                <div className="relative">
                    <input
                        ref={inputRef}
                        type="text"
                        value={searchTerm}
                        onChange={handleInputChange}
                        onFocus={handleInputFocus}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 pr-8"
                        autoComplete="off"
                    />

                    {/* Dropdown arrow */}
                    <div className="absolute inset-y-0 right-0 flex items-center">
                        {searchTerm && (
                            <button
                                onClick={handleClear}
                                className="px-1 text-gray-400 hover:text-gray-600"
                                aria-label={`Clear ${label} filter`}
                            >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                        <div className="px-2 text-gray-400">
                            <svg
                                className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Dropdown Options */}
                {isOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((option, index) => (
                                <button
                                    key={option}
                                    onClick={() => handleOptionClick(option)}
                                    className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 cursor-pointer ${index === highlightedIndex ? 'bg-blue-100' : ''
                                        } ${option === value ? 'bg-blue-50 text-blue-700 font-medium' : ''}`}
                                >
                                    {option}
                                </button>
                            ))
                        ) : searchTerm ? (
                            <div className="px-3 py-2 text-sm text-gray-500">
                                {allowCustom ? (
                                    <span>Press Enter to use "{searchTerm}"</span>
                                ) : (
                                    'No matching options'
                                )}
                            </div>
                        ) : (
                            <div className="px-3 py-2 text-sm text-gray-500">
                                Start typing to search options...
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
} 
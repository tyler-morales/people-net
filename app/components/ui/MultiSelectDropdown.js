import { useState, useEffect, useRef } from 'react';

export default function MultiSelectDropdown({
    values = [], // Array of selected values
    onChange,
    options = [],
    placeholder,
    label,
    onClear,
    allowCustom = true
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const inputRef = useRef(null);
    const dropdownRef = useRef(null);

    // Filter options based on search term and exclude already selected values
    const filteredOptions = options.filter(option =>
        option.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !values.includes(option)
    );

    // Handle clicking outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
                setHighlightedIndex(-1);
                setSearchTerm('');
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleInputChange = (e) => {
        const newValue = e.target.value;
        setSearchTerm(newValue);
        setIsOpen(true);
        setHighlightedIndex(-1);
    };

    const handleInputFocus = () => {
        setIsOpen(true);
    };

    const handleOptionClick = (option) => {
        if (!values.includes(option)) {
            onChange([...values, option]);
        }
        setSearchTerm('');
        setHighlightedIndex(-1);
        inputRef.current?.focus();
    };

    const handleRemoveValue = (valueToRemove) => {
        onChange(values.filter(value => value !== valueToRemove));
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
                } else if (allowCustom && searchTerm && !values.includes(searchTerm)) {
                    onChange([...values, searchTerm]);
                    setSearchTerm('');
                    setIsOpen(false);
                }
                break;
            case 'Escape':
                setIsOpen(false);
                setHighlightedIndex(-1);
                setSearchTerm('');
                inputRef.current?.blur();
                break;
            case 'Backspace':
                if (!searchTerm && values.length > 0) {
                    // Remove last selected value if input is empty
                    onChange(values.slice(0, -1));
                }
                break;
            case 'Tab':
                setIsOpen(false);
                setHighlightedIndex(-1);
                setSearchTerm('');
                break;
        }
    };

    const handleClearAll = () => {
        onChange([]);
        onClear?.();
        inputRef.current?.focus();
    };

    return (
        <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-700">
                {label}
            </label>
            <div className="relative" ref={dropdownRef}>
                {/* Selected Values Display */}
                <div className="min-h-[34px] w-full border border-gray-300 rounded focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500 bg-white">
                    <div className="flex flex-wrap gap-1 p-1">
                        {/* Selected value chips */}
                        {values.map((value) => (
                            <div
                                key={value}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                            >
                                <span>{value}</span>
                                <button
                                    onClick={() => handleRemoveValue(value)}
                                    className="text-blue-600 hover:text-blue-800 flex-shrink-0"
                                    aria-label={`Remove ${value}`}
                                >
                                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        ))}

                        {/* Search input */}
                        <input
                            ref={inputRef}
                            type="text"
                            value={searchTerm}
                            onChange={handleInputChange}
                            onFocus={handleInputFocus}
                            onKeyDown={handleKeyDown}
                            placeholder={values.length === 0 ? placeholder : ''}
                            className="flex-1 min-w-[100px] px-1 py-1 text-sm border-none outline-none bg-transparent"
                            autoComplete="off"
                        />
                    </div>

                    {/* Clear all button and dropdown arrow */}
                    <div className="absolute inset-y-0 right-0 flex items-center">
                        {values.length > 0 && (
                            <button
                                onClick={handleClearAll}
                                className="px-1 text-gray-400 hover:text-gray-600"
                                aria-label={`Clear all ${label} filters`}
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
                                        }`}
                                >
                                    {option}
                                </button>
                            ))
                        ) : searchTerm ? (
                            <div className="px-3 py-2 text-sm text-gray-500">
                                {allowCustom && !values.includes(searchTerm) ? (
                                    <span>Press Enter to add "{searchTerm}"</span>
                                ) : values.includes(searchTerm) ? (
                                    <span>"{searchTerm}" already selected</span>
                                ) : (
                                    'No matching options'
                                )}
                            </div>
                        ) : values.length === options.length ? (
                            <div className="px-3 py-2 text-sm text-gray-500">
                                All options selected
                            </div>
                        ) : (
                            <div className="px-3 py-2 text-sm text-gray-500">
                                Start typing to search options...
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Helper text */}
            {values.length > 0 && (
                <div className="text-xs text-gray-500">
                    {values.length} selected • Press backspace to remove last item
                </div>
            )}
        </div>
    );
} 
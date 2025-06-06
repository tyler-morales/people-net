import { useState, useEffect, useRef } from 'react';

export default function FormDropdown({
    name,
    value,
    onChange,
    onFocus,
    onBlur,
    options = [],
    placeholder,
    className = '',
    autoFocus = false,
    allowCustom = true
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
                // Trigger onBlur if we had focus
                if (document.activeElement === inputRef.current) {
                    handleBlur();
                }
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

        // Call the parent onChange
        onChange({
            target: {
                name,
                value: newValue
            }
        });
    };

    const handleInputFocus = (e) => {
        setIsOpen(true);
        onFocus?.(e);
    };

    const handleBlur = () => {
        if (onBlur) {
            onBlur({
                target: {
                    name,
                    value: searchTerm
                }
            });
        }
    };

    const handleOptionClick = (option) => {
        setSearchTerm(option);
        onChange({
            target: {
                name,
                value: option
            }
        });
        setIsOpen(false);
        setHighlightedIndex(-1);
        // Don't call onBlur here since we're programmatically selecting
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
                    setIsOpen(false);
                    inputRef.current?.blur();
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

    return (
        <div className="relative" ref={dropdownRef}>
            <input
                ref={inputRef}
                type="text"
                name={name}
                value={searchTerm}
                onChange={handleInputChange}
                onFocus={handleInputFocus}
                onBlur={() => {
                    // Delay to allow option clicks to register
                    setTimeout(() => {
                        if (document.activeElement !== inputRef.current) {
                            setIsOpen(false);
                            setHighlightedIndex(-1);
                            handleBlur();
                        }
                    }, 150);
                }}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className={`w-full pr-8 ${className}`}
                autoComplete="off"
                autoFocus={autoFocus}
            />

            {/* Dropdown arrow */}
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <svg
                    className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
            </div>

            {/* Dropdown Options */}
            {isOpen && filteredOptions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                    {filteredOptions.map((option, index) => (
                        <button
                            key={option}
                            type="button"
                            onClick={() => handleOptionClick(option)}
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 cursor-pointer ${index === highlightedIndex ? 'bg-blue-100' : ''
                                } ${option === value ? 'bg-blue-50 text-blue-700 font-medium' : ''}`}
                        >
                            {option}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
} 
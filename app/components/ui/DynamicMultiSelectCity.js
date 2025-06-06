import { useState, useEffect, useRef } from 'react';
import cityService from '../../lib/city-service';

export default function DynamicMultiSelectCity({
    values = [],
    onChange,
    onClear,
    placeholder = "Search cities...",
    label,
    minSearchLength = 2,
    maxDisplayedChips = 3
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [cities, setCities] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const inputRef = useRef(null);
    const dropdownRef = useRef(null);

    // Search for cities when search term changes
    useEffect(() => {
        const searchCities = async () => {
            if (searchTerm.length < minSearchLength) {
                setCities([]);
                setError(null);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const results = await cityService.searchCities(searchTerm);
                setCities(results);
            } catch (err) {
                setError('Failed to search cities');
                setCities([]);
                console.error('City search error:', err);
            } finally {
                setLoading(false);
            }
        };

        searchCities();
    }, [searchTerm, minSearchLength]);

    // Handle clicking outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
                setHighlightedIndex(-1);
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

    const handleCitySelect = (city) => {
        const cityDisplay = city.display;

        // Add to values if not already present
        if (!values.includes(cityDisplay)) {
            const newValues = [...values, cityDisplay];
            onChange(newValues);
        }

        setSearchTerm('');
        setIsOpen(false);
        setHighlightedIndex(-1);
        inputRef.current?.focus();
    };

    const handleRemoveValue = (valueToRemove) => {
        const newValues = values.filter(v => v !== valueToRemove);
        onChange(newValues);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Backspace' && searchTerm === '' && values.length > 0) {
            // Remove last item
            handleRemoveValue(values[values.length - 1]);
            return;
        }

        if (!isOpen || cities.length === 0) {
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
                    prev < cities.length - 1 ? prev + 1 : 0
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setHighlightedIndex(prev =>
                    prev > 0 ? prev - 1 : cities.length - 1
                );
                break;
            case 'Enter':
                e.preventDefault();
                if (highlightedIndex >= 0 && cities[highlightedIndex]) {
                    handleCitySelect(cities[highlightedIndex]);
                } else if (searchTerm && searchTerm.length >= minSearchLength) {
                    // Allow adding custom city if no match
                    if (!values.includes(searchTerm)) {
                        const newValues = [...values, searchTerm];
                        onChange(newValues);
                    }
                    setSearchTerm('');
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

    const renderCityOption = (city, index) => {
        const isHighlighted = index === highlightedIndex;
        const isSelected = values.includes(city.display);

        return (
            <button
                key={`${city.name}-${city.country}-${index}`}
                type="button"
                onClick={() => handleCitySelect(city)}
                disabled={isSelected}
                className={`w-full text-left px-3 py-2 text-sm cursor-pointer border-b border-gray-100 last:border-b-0 ${isHighlighted ? 'bg-blue-100' : isSelected ? 'bg-gray-100 opacity-50' : 'hover:bg-blue-50'
                    }`}
            >
                <div className="flex justify-between items-center">
                    <div>
                        <div className={`font-medium ${isSelected ? 'text-gray-500' : ''}`}>
                            {city.name}
                            {isSelected && <span className="ml-2 text-xs">(selected)</span>}
                        </div>
                        {city.country && (
                            <div className="text-xs text-gray-500">
                                {cityService.getCountryName(city.country)}
                                {city.isCapital && (
                                    <span className="ml-1 text-blue-600">• Capital</span>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </button>
        );
    };

    const displayedValues = values.slice(0, maxDisplayedChips);
    const remainingCount = values.length - maxDisplayedChips;

    const showDropdown = isOpen && (cities.length > 0 || loading || error);

    return (
        <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-700">
                {label}
            </label>

            <div className="relative" ref={dropdownRef}>
                {/* Selected Values Display */}
                {values.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                        {displayedValues.map((value, index) => (
                            <span
                                key={`${value}-${index}`}
                                className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
                            >
                                {value.split(',')[0]} {/* Show only city name */}
                                <button
                                    type="button"
                                    onClick={() => handleRemoveValue(value)}
                                    className="ml-1 text-blue-600 hover:text-blue-800"
                                >
                                    ×
                                </button>
                            </span>
                        ))}
                        {remainingCount > 0 && (
                            <span className="inline-flex items-center px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                                +{remainingCount} more
                            </span>
                        )}
                    </div>
                )}

                {/* Search Input */}
                <div className="relative">
                    <input
                        ref={inputRef}
                        type="text"
                        value={searchTerm}
                        onChange={handleInputChange}
                        onFocus={handleInputFocus}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        className="w-full px-3 py-1.5 pr-8 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        autoComplete="off"
                    />

                    {/* Loading/Clear/Arrow indicator */}
                    <div className="absolute inset-y-0 right-0 flex items-center">
                        {values.length > 0 && (
                            <button
                                type="button"
                                onClick={onClear}
                                className="px-2 text-gray-400 hover:text-gray-600"
                            >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                        <div className="pr-2">
                            {loading ? (
                                <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                            ) : (
                                <svg
                                    className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                </svg>
                            )}
                        </div>
                    </div>
                </div>

                {/* Dropdown */}
                {showDropdown && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-hidden">
                        {loading && (
                            <div className="px-3 py-4 text-center text-gray-500 text-sm">
                                <div className="flex items-center justify-center space-x-2">
                                    <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                                    <span>Searching cities...</span>
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="px-3 py-4 text-center text-red-500 text-sm">
                                <div className="flex items-center justify-center space-x-2">
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>{error}</span>
                                </div>
                            </div>
                        )}

                        {!loading && !error && cities.length === 0 && searchTerm.length >= minSearchLength && (
                            <div className="px-3 py-4 text-center text-gray-500 text-sm">
                                No cities found for "{searchTerm}"
                                <div className="text-xs mt-1">Press Enter to add as custom location</div>
                            </div>
                        )}

                        {!loading && !error && searchTerm.length > 0 && searchTerm.length < minSearchLength && (
                            <div className="px-3 py-4 text-center text-gray-500 text-sm">
                                Type at least {minSearchLength} characters to search
                            </div>
                        )}

                        {!loading && !error && cities.length > 0 && (
                            <div className="max-h-60 overflow-y-auto">
                                {cities.map((city, index) => renderCityOption(city, index))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
} 
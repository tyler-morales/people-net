import { useState, useEffect, useRef } from 'react';
import cityService from '../../lib/city-service';

export default function DynamicCityPicker({
    name,
    value,
    onChange,
    onFocus,
    onBlur,
    placeholder = "Search for a city...",
    className = '',
    autoFocus = false,
    showCountryInfo = true,
    showPopulation = false,
    minSearchLength = 2
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState(value || '');
    const [cities, setCities] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const inputRef = useRef(null);
    const dropdownRef = useRef(null);

    // Update search term when value changes externally
    useEffect(() => {
        setSearchTerm(value || '');
    }, [value]);

    // Search for cities when search term changes
    useEffect(() => {
        const searchCities = async () => {
            console.log(`🎯 DynamicCityPicker search triggered for: "${searchTerm}", isOpen: ${isOpen}, value: "${value}"`);

            if (searchTerm.length < minSearchLength) {
                console.log(`⏭️ Search term too short, clearing cities`);
                setCities([]);
                setError(null);
                return;
            }

            // First, try to get cached results synchronously
            console.log(`🔄 Checking cache for: "${searchTerm}"`);
            const cachedResults = cityService.getCachedResults(searchTerm);
            if (cachedResults) {
                console.log(`✅ Cache hit! Found ${cachedResults.length} cached results for "${searchTerm}"`);
                setCities(cachedResults);
                setError(null);
                return;
            }

            // Only search if dropdown is open and no cached results were found
            if (!isOpen && searchTerm === value) {
                console.log(`⏸️ Dropdown not open and matches current value, skipping API search`);
                // Don't search if this is just setting the initial/external value and no cache hit
                setCities([]);
                return;
            }

            console.log(`🌐 Making API call for: "${searchTerm}"`);
            setLoading(true);
            setError(null);

            try {
                const results = await cityService.searchCities(searchTerm);
                console.log(`📡 API call completed for "${searchTerm}", got ${results.length} results`);
                setCities(results);
            } catch (err) {
                console.error(`❌ API call failed for "${searchTerm}":`, err);
                setError('Failed to search cities');
                setCities([]);
                console.error('City search error:', err);
            } finally {
                setLoading(false);
            }
        };

        searchCities();
    }, [searchTerm, minSearchLength, isOpen, value]);

    // Handle clicking outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
                setHighlightedIndex(-1);
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

    const handleCitySelect = (city) => {
        const displayValue = city.display;
        setSearchTerm(displayValue);
        onChange({
            target: {
                name,
                value: displayValue
            }
        });
        setIsOpen(false);
        setHighlightedIndex(-1);
    };

    const handleKeyDown = (e) => {
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
                } else {
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

    const renderCityOption = (city, index) => {
        const isHighlighted = index === highlightedIndex;
        const isSelected = city.display === value;

        return (
            <button
                key={`${city.name}-${city.country}-${index}`}
                type="button"
                onClick={() => handleCitySelect(city)}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 ${isHighlighted ? 'bg-blue-100' : ''
                    } ${isSelected ? 'bg-blue-50 text-blue-700 font-medium' : ''}`}
            >
                <div className="flex justify-between items-center">
                    <div>
                        <div className="font-medium">{city.name}</div>
                        {showCountryInfo && city.country && (
                            <div className="text-xs text-gray-500">
                                {cityService.getCountryName(city.country)}
                                {city.isCapital && (
                                    <span className="ml-1 text-blue-600">• Capital</span>
                                )}
                            </div>
                        )}
                    </div>
                    {showPopulation && city.population && (
                        <div className="text-xs text-gray-400">
                            {city.population.toLocaleString()}
                        </div>
                    )}
                </div>
            </button>
        );
    };

    const showDropdown = isOpen && (cities.length > 0 || loading || error);

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

            {/* Loading/Status Indicator */}
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
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

            {/* Dropdown */}
            {showDropdown && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-80 overflow-hidden">
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
                        </div>
                    )}

                    {!loading && !error && searchTerm.length > 0 && searchTerm.length < minSearchLength && (
                        <div className="px-3 py-4 text-center text-gray-500 text-sm">
                            Type at least {minSearchLength} characters to search
                        </div>
                    )}

                    {!loading && !error && cities.length > 0 && (
                        <div className="max-h-80 overflow-y-auto">
                            {cities.map((city, index) => renderCityOption(city, index))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
} 
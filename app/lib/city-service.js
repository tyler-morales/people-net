// City API service for dynamic city search
// Uses API Ninjas City API with aggressive optimization to minimize API calls

class CityService {
    constructor() {
        this.cache = new Map();
        this.persistentCache = this._loadPersistentCache();
        this.cacheExpiry = 60 * 60 * 1000; // 1 hour (increased from 5 minutes)
        this.persistentCacheExpiry = 24 * 60 * 60 * 1000; // 24 hours for localStorage
        this.debounceTimers = new Map();
        this.apiUrl = 'https://api.api-ninjas.com/v1/city';

        // Rate limiting
        this.requestCount = 0;
        this.requestLimit = 100; // Max 100 API calls per session
        this.lastRequestTime = 0;
        this.minRequestInterval = 1000; // Minimum 1 second between requests

        // Popular cities that don't need API calls
        this.popularCities = [
            'New York, USA', 'Los Angeles, USA', 'Chicago, USA', 'San Francisco, USA',
            'London, UK', 'Paris, France', 'Berlin, Germany', 'Tokyo, Japan',
            'Mumbai, India', 'Delhi, India', 'Bangalore, India', 'Sydney, Australia',
            'Toronto, Canada', 'Vancouver, Canada', 'Mexico City, Mexico',
            'São Paulo, Brazil', 'Singapore', 'Hong Kong', 'Seoul, South Korea'
        ];

        // Prefetch popular cities on initialization
        this._initializePopularCities();
    }

    // Load cache from localStorage (SSR-safe)
    _loadPersistentCache() {
        try {
            // Check if we're in browser environment
            if (typeof window === 'undefined' || !window.localStorage) {
                return new Map();
            }

            const cached = localStorage.getItem('cityService_cache');
            if (cached) {
                const parsed = JSON.parse(cached);
                const validCache = new Map();

                // Only load non-expired entries
                for (const [key, value] of Object.entries(parsed)) {
                    if (Date.now() - value.timestamp < this.persistentCacheExpiry) {
                        validCache.set(key, value);
                    }
                }

                console.log(`Loaded ${validCache.size} cached city searches from localStorage`);
                return validCache;
            }
        } catch (error) {
            console.warn('Failed to load persistent cache:', error);
        }
        return new Map();
    }

    // Save cache to localStorage (SSR-safe)
    _savePersistentCache() {
        try {
            // Check if we're in browser environment
            if (typeof window === 'undefined' || !window.localStorage) {
                return;
            }

            const cacheObject = Object.fromEntries(this.persistentCache);
            localStorage.setItem('cityService_cache', JSON.stringify(cacheObject));
        } catch (error) {
            console.warn('Failed to save persistent cache:', error);
        }
    }

    // Initialize popular cities without API calls
    _initializePopularCities() {
        this.popularCities.forEach(cityDisplay => {
            const cityName = cityDisplay.split(',')[0].trim();
            const cacheKey = this._getCacheKey(cityName.toLowerCase(), {});

            if (!this.persistentCache.has(cacheKey)) {
                const mockCity = {
                    display: cityDisplay,
                    name: cityName,
                    country: cityDisplay.includes(',') ? cityDisplay.split(',')[1]?.trim() : null,
                    latitude: null,
                    longitude: null,
                    population: null,
                    isCapital: false
                };

                this.persistentCache.set(cacheKey, {
                    data: [mockCity],
                    timestamp: Date.now(),
                    source: 'popular'
                });
            }
        });
    }

    // Enhanced search with multiple optimization strategies
    async searchCities(query, options = {}) {
        // Strategy 1: Minimum length requirement (increased)
        if (query.length < 3) {
            return this._getStaticFallback(query);
        }

        // Strategy 2: Check if this is a popular city first
        const popularMatch = this._checkPopularCities(query);
        if (popularMatch.length > 0) {
            return popularMatch;
        }

        return new Promise((resolve, reject) => {
            // Strategy 3: Aggressive debouncing (increased from 300ms to 800ms)
            if (this.debounceTimers.has(query)) {
                clearTimeout(this.debounceTimers.get(query));
            }

            const timer = setTimeout(async () => {
                try {
                    const results = await this._performSearch(query, options);
                    resolve(results);
                } catch (error) {
                    reject(error);
                } finally {
                    this.debounceTimers.delete(query);
                }
            }, 800); // Increased debounce time

            this.debounceTimers.set(query, timer);
        });
    }

    // Check popular cities for quick matches
    _checkPopularCities(query) {
        const lowerQuery = query.toLowerCase();
        return this.popularCities
            .filter(city => city.toLowerCase().includes(lowerQuery))
            .slice(0, 10)
            .map(city => ({
                display: city,
                name: city.split(',')[0].trim(),
                country: city.includes(',') ? city.split(',')[1]?.trim() : null,
                latitude: null,
                longitude: null,
                population: null,
                isCapital: false
            }));
    }

    async _performSearch(query, options = {}) {
        const cacheKey = this._getCacheKey(query, options);

        // Strategy 4: Check persistent cache first
        const persistentCached = this.persistentCache.get(cacheKey);
        if (persistentCached && Date.now() - persistentCached.timestamp < this.persistentCacheExpiry) {
            console.log('Using persistent cache for:', query);
            return persistentCached.data;
        }

        // Strategy 5: Check memory cache
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
            console.log('Using memory cache for:', query);
            return cached.data;
        }

        // Strategy 6: Rate limiting
        if (this.requestCount >= this.requestLimit) {
            console.warn('API request limit reached. Using fallback.');
            return this._getStaticFallback(query);
        }

        // Strategy 7: Minimum time between requests
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        if (timeSinceLastRequest < this.minRequestInterval) {
            console.log('Request throttled. Using fallback.');
            return this._getStaticFallback(query);
        }

        // Get API key from environment
        const apiKey = process.env.NEXT_PUBLIC_API_NINJAS_KEY;
        if (!apiKey) {
            console.warn('API Ninjas API key not found. Falling back to static cities.');
            return this._getStaticFallback(query);
        }

        try {
            // Strategy 8: Smart query extraction
            const cityName = this._extractCityName(query);

            // Strategy 9: Basic parameters only (no limit - premium feature)
            const params = new URLSearchParams({
                name: cityName,
                ...options
            });

            console.log(`Making API call ${this.requestCount + 1}/${this.requestLimit} for:`, cityName);

            this.requestCount++;
            this.lastRequestTime = now;

            const response = await fetch(`${this.apiUrl}?${params}`, {
                headers: {
                    'X-Api-Key': apiKey
                }
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status}`);
            }

            const cities = await response.json();
            const formattedCities = cities.map(city => this._formatCity(city));

            // Strategy 10: Dual caching (memory + persistent)
            const cacheData = {
                data: formattedCities,
                timestamp: Date.now(),
                source: 'api'
            };

            this.cache.set(cacheKey, cacheData);
            this.persistentCache.set(cacheKey, cacheData);
            this._savePersistentCache();

            console.log(`API call successful. Cached ${formattedCities.length} cities for: ${cityName}`);
            return formattedCities;

        } catch (error) {
            console.warn('City API error, falling back to static cities:', error);
            return this._getStaticFallback(query);
        }
    }

    // Helper function to extract just the city name from formatted strings
    _extractCityName(query) {
        if (query.includes(',')) {
            return query.split(',')[0].trim();
        }
        return query;
    }

    _formatCity(city) {
        let formatted = city.name;

        if (city.country) {
            const countryName = this.getCountryName(city.country);
            formatted += `, ${countryName}`;
        }

        return {
            display: formatted,
            name: city.name,
            country: city.country,
            latitude: city.latitude,
            longitude: city.longitude,
            population: city.population,
            isCapital: city.is_capital
        };
    }

    // Make this method public
    getCountryName(countryCode) {
        const countryMap = {
            'US': 'USA', 'CA': 'Canada', 'GB': 'UK', 'DE': 'Germany', 'FR': 'France',
            'IN': 'India', 'AU': 'Australia', 'JP': 'Japan', 'CN': 'China', 'BR': 'Brazil',
            'MX': 'Mexico', 'IT': 'Italy', 'ES': 'Spain', 'NL': 'Netherlands', 'CH': 'Switzerland',
            'SE': 'Sweden', 'NO': 'Norway', 'DK': 'Denmark', 'FI': 'Finland', 'IE': 'Ireland',
            'IL': 'Israel', 'SG': 'Singapore', 'KR': 'South Korea', 'TH': 'Thailand', 'MY': 'Malaysia',
            'PH': 'Philippines', 'ID': 'Indonesia', 'VN': 'Vietnam', 'TW': 'Taiwan', 'HK': 'Hong Kong',
            'NZ': 'New Zealand', 'ZA': 'South Africa', 'EG': 'Egypt', 'TR': 'Turkey', 'RU': 'Russia',
            'UA': 'Ukraine', 'PL': 'Poland', 'CZ': 'Czech Republic', 'HU': 'Hungary', 'RO': 'Romania',
            'BG': 'Bulgaria', 'HR': 'Croatia', 'SI': 'Slovenia', 'SK': 'Slovakia', 'LT': 'Lithuania',
            'LV': 'Latvia', 'EE': 'Estonia'
        };

        return countryMap[countryCode] || countryCode;
    }

    // Enhanced static fallback with more cities
    _getStaticFallback(query) {
        const { commonCities } = require('./city-data');
        const allCities = [...commonCities, ...this.popularCities];

        return allCities
            .filter(city => city.toLowerCase().includes(query.toLowerCase()))
            .slice(0, 15) // Increased from 20 to provide better fallback
            .map(city => ({
                display: city,
                name: city.split(',')[0].trim(),
                country: null,
                latitude: null,
                longitude: null,
                population: null,
                isCapital: false
            }));
    }

    _getCacheKey(query, options) {
        return `${query.toLowerCase()}-${JSON.stringify(options)}`;
    }

    // Search by country (with same optimizations, no limit)
    async searchByCountry(countryCode, options = {}) {
        if (this.requestCount >= this.requestLimit) {
            return [];
        }

        return this._performSearch('', {
            country: countryCode,
            ...options
        });
    }

    // Search by population range (with same optimizations, no limit)
    async searchByPopulation(minPop, maxPop, options = {}) {
        if (this.requestCount >= this.requestLimit) {
            return [];
        }

        return this._performSearch('', {
            min_population: minPop,
            max_population: maxPop,
            ...options
        });
    }

    // Clear all caches (SSR-safe)
    clearCache() {
        this.cache.clear();
        this.persistentCache.clear();

        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                localStorage.removeItem('cityService_cache');
            }
        } catch (error) {
            console.warn('Failed to clear localStorage cache:', error);
        }

        console.log('All caches cleared');
    }

    // Get usage statistics
    getUsageStats() {
        return {
            apiCallsUsed: this.requestCount,
            apiCallsRemaining: this.requestLimit - this.requestCount,
            memoryCacheSize: this.cache.size,
            persistentCacheSize: this.persistentCache.size,
            lastRequestTime: new Date(this.lastRequestTime).toLocaleString()
        };
    }

    // Reset API call counter (useful for testing)
    resetApiCounter() {
        this.requestCount = 0;
        console.log('API call counter reset');
    }
}

// Create singleton instance
const cityService = new CityService();

export default cityService; 
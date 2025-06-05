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

        // Rate limiting with persistent storage
        this.requestLimit = 100; // Max 100 API calls per session
        this.minRequestInterval = 1000; // Minimum 1 second between requests

        // Load persistent API usage data
        this._loadApiUsageData();

        // Console logging easter egg
        this.consoleLoggedRequests = 0;
        this.maxConsoleRequests = 2;

        // Popular cities that don't need API calls
        this.popularCities = [
            'New York, USA', 'Los Angeles, USA', 'Chicago, USA', 'San Francisco, USA',
            'London, UK', 'Paris, France', 'Berlin, Germany', 'Tokyo, Japan',
            'Mumbai, India', 'Delhi, India', 'Bangalore, India', 'Sydney, Australia',
            'Toronto, Canada', 'Vancouver, Canada', 'Mexico City, Mexico',
            'São Paulo, Brazil', 'Singapore', 'Hong Kong', 'Seoul, South Korea',
            'Portland, USA', 'Portland, OR, USA'
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

    // Load API usage data from localStorage (SSR-safe)
    _loadApiUsageData() {
        try {
            // Check if we're in browser environment
            if (typeof window === 'undefined' || !window.localStorage) {
                this.requestCount = 0;
                this.lastRequestTime = 0;
                return;
            }

            const saved = localStorage.getItem('cityService_apiUsage');
            if (saved) {
                const parsed = JSON.parse(saved);
                this.requestCount = parsed.requestCount || 0;
                this.lastRequestTime = parsed.lastRequestTime || 0;

                console.log(`Loaded API usage: ${this.requestCount}/${this.requestLimit} calls used`);
            } else {
                this.requestCount = 0;
                this.lastRequestTime = 0;
            }
        } catch (error) {
            console.warn('Failed to load API usage data:', error);
            this.requestCount = 0;
            this.lastRequestTime = 0;
        }
    }

    // Save API usage data to localStorage (SSR-safe)
    _saveApiUsageData() {
        try {
            // Check if we're in browser environment
            if (typeof window === 'undefined' || !window.localStorage) {
                return;
            }

            const usageData = {
                requestCount: this.requestCount,
                lastRequestTime: this.lastRequestTime,
                lastUpdated: Date.now()
            };

            localStorage.setItem('cityService_apiUsage', JSON.stringify(usageData));
        } catch (error) {
            console.warn('Failed to save API usage data:', error);
        }
    }

    // Enhanced logging method that uses Zustand store
    _emitLog(logEntry) {
        // Only import and use the store in browser environment
        if (typeof window !== 'undefined') {
            try {
                // Dynamic import to avoid SSR issues
                import('../stores/terminalLogStore.js').then(({ default: useTerminalLogStore }) => {
                    const { addLog } = useTerminalLogStore.getState();
                    addLog(logEntry);
                }).catch(error => {
                    console.warn('Failed to log to terminal store:', error);
                });
            } catch (error) {
                console.warn('Terminal logging not available:', error);
            }
        }
    }

    // Increment saved API calls counter
    _incrementSavedCalls() {
        if (typeof window !== 'undefined') {
            try {
                import('../stores/terminalLogStore.js').then(({ default: useTerminalLogStore }) => {
                    const { incrementSavedCalls } = useTerminalLogStore.getState();
                    incrementSavedCalls();
                }).catch(error => {
                    console.warn('Failed to increment saved calls:', error);
                });
            } catch (error) {
                console.warn('Saved calls tracking not available:', error);
            }
        }
    }

    // Synchronous cache lookup - checks all caches without triggering API calls
    getCachedResults(query, options = {}) {
        console.log(`🔍 Cache lookup for: "${query}"`);

        // Strategy 1: Minimum length requirement
        if (query.length < 3) {
            console.log(`❌ Query too short (${query.length} < 3), using static fallback`);
            return this._getStaticFallback(query);
        }

        // Strategy 2: Check popular cities first
        const popularMatch = this._checkPopularCities(query);
        if (popularMatch.length > 0) {
            console.log(`✅ Found in popular cities: ${popularMatch.length} results`);
            return popularMatch;
        }

        // Strategy 3: Check persistent cache
        const cacheKey = this._getCacheKey(query, options);
        console.log(`🔑 Cache key: "${cacheKey}"`);
        console.log(`📦 Persistent cache size: ${this.persistentCache.size}`);
        console.log(`🗂️ Persistent cache keys:`, Array.from(this.persistentCache.keys()));

        const persistentCached = this.persistentCache.get(cacheKey);
        if (persistentCached && Date.now() - persistentCached.timestamp < this.persistentCacheExpiry) {
            console.log(`✅ Found in persistent cache, age: ${Date.now() - persistentCached.timestamp}ms`);
            this._incrementSavedCalls(); // Count this as a saved API call
            this._emitLog({
                type: 'cache',
                action: 'CACHE_HIT',
                key: cacheKey,
                source: 'persistent',
                query: query
            });
            return persistentCached.data;
        } else if (persistentCached) {
            console.log(`⏰ Found in persistent cache but expired, age: ${Date.now() - persistentCached.timestamp}ms, expiry: ${this.persistentCacheExpiry}ms`);
        }

        // Strategy 4: Check memory cache
        console.log(`💾 Memory cache size: ${this.cache.size}`);
        console.log(`🗂️ Memory cache keys:`, Array.from(this.cache.keys()));

        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
            console.log(`✅ Found in memory cache, age: ${Date.now() - cached.timestamp}ms`);
            this._incrementSavedCalls(); // Count this as a saved API call
            this._emitLog({
                type: 'cache',
                action: 'CACHE_HIT',
                key: cacheKey,
                source: 'memory',
                query: query
            });
            return cached.data;
        } else if (cached) {
            console.log(`⏰ Found in memory cache but expired, age: ${Date.now() - cached.timestamp}ms, expiry: ${this.cacheExpiry}ms`);
        }

        // No cached results found
        console.log(`❌ No cached results found for "${query}"`);
        return null;
    }

    // Enhanced search with multiple optimization strategies
    async searchCities(query, options = {}) {
        // Strategy 1: Minimum length requirement (increased)
        if (query.length < 3) {
            this._emitLog({
                type: 'fallback',
                reason: 'QUERY_TOO_SHORT',
                query: query,
                minLength: 3,
                fallback_count: this._getStaticFallback(query).length
            });
            return this._getStaticFallback(query);
        }

        // Strategy 2: Check if this is a popular city first
        const popularMatch = this._checkPopularCities(query);
        if (popularMatch.length > 0) {
            this._emitLog({
                type: 'cache',
                action: 'POPULAR_CITY_HIT',
                query: query,
                source: 'popular',
                results: popularMatch.length
            });
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
                    this._emitLog({
                        type: 'error',
                        message: `Search failed for "${query}": ${error.message}`,
                        query: query
                    });
                    reject(error);
                } finally {
                    this.debounceTimers.delete(query);
                }
            }, 800); // Increased debounce time

            // Log the debounced search
            this._emitLog({
                type: 'system',
                message: `Search queued for "${query}" (800ms debounce)`
            });

            this.debounceTimers.set(query, timer);
        });
    }

    // Check popular cities for quick matches
    _checkPopularCities(query) {
        const lowerQuery = query.toLowerCase();
        const matches = this.popularCities
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

        // If we found matches, we saved an API call
        if (matches.length > 0) {
            this._incrementSavedCalls();
        }

        return matches;
    }

    async _performSearch(query, options = {}) {
        const cacheKey = this._getCacheKey(query, options);

        // Strategy 4: Check persistent cache first
        const persistentCached = this.persistentCache.get(cacheKey);
        if (persistentCached && Date.now() - persistentCached.timestamp < this.persistentCacheExpiry) {
            console.log('Using persistent cache for:', query);
            this._incrementSavedCalls(); // Count this as a saved API call
            this._emitLog({
                type: 'cache',
                action: 'CACHE_HIT',
                key: cacheKey,
                source: 'persistent',
                query: query
            });
            return persistentCached.data;
        }

        // Strategy 5: Check memory cache
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
            console.log('Using memory cache for:', query);
            this._incrementSavedCalls(); // Count this as a saved API call
            this._emitLog({
                type: 'cache',
                action: 'CACHE_HIT',
                key: cacheKey,
                source: 'memory',
                query: query
            });
            return cached.data;
        }

        // Strategy 6: Rate limiting
        if (this.requestCount >= this.requestLimit) {
            console.warn('API request limit reached. Using fallback.');
            this._emitLog({
                type: 'fallback',
                reason: 'RATE_LIMIT_EXCEEDED',
                query: query,
                fallback_count: this._getStaticFallback(query).length
            });
            return this._getStaticFallback(query);
        }

        // Strategy 7: Minimum time between requests
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        if (timeSinceLastRequest < this.minRequestInterval) {
            console.log('Request throttled. Using fallback.');
            this._emitLog({
                type: 'fallback',
                reason: 'REQUEST_THROTTLED',
                query: query,
                timeSinceLastRequest: timeSinceLastRequest,
                minInterval: this.minRequestInterval,
                fallback_count: this._getStaticFallback(query).length
            });
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

            // Prepare the request URL
            const requestUrl = `${this.apiUrl}?${params}`;

            // Easter egg: Console log first 2 requests with terminal style
            if (this.consoleLoggedRequests < this.maxConsoleRequests) {
                const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
                console.log(`%c${timestamp} %c🌐 API REQUEST ${this.consoleLoggedRequests + 1}`,
                    'color: #666; font-family: monospace;',
                    'color: #00ff00; font-family: monospace; font-weight: bold;'
                );
                console.log(`%c→ GET ${requestUrl}`, 'color: #00bcd4; font-family: monospace;');
                console.log(`%c→ Headers: {"X-Api-Key": "***hidden***"}`, 'color: #666; font-family: monospace;');

                this.consoleLoggedRequests++;

                if (this.consoleLoggedRequests === this.maxConsoleRequests) {
                    console.log(`%c💡 Developer Secret: Want to see ALL API activity? Press Ctrl+Shift+A to unlock the hidden developer console!`,
                        'color: #ff9800; font-family: monospace; font-weight: bold; font-size: 12px;'
                    );
                }
            }

            // Log the API request
            this._emitLog({
                type: 'request',
                method: 'GET',
                url: requestUrl,
                headers: { 'X-Api-Key': '***hidden***' },
                query: cityName
            });

            this.requestCount++;
            this.lastRequestTime = now;

            // Save usage data to localStorage after increment
            this._saveApiUsageData();

            const response = await fetch(requestUrl, {
                headers: {
                    'X-Api-Key': apiKey
                }
            });

            if (!response.ok) {
                this._emitLog({
                    type: 'response',
                    status: response.status,
                    error: `API request failed: ${response.status}`,
                    query: cityName
                });
                throw new Error(`API request failed: ${response.status}`);
            }

            const cities = await response.json();
            const formattedCities = cities.map(city => this._formatCity(city));

            // Easter egg: Console log response for first 2 requests
            if (this.consoleLoggedRequests <= this.maxConsoleRequests) {
                console.log(`%c← HTTP 200 OK`, 'color: #4CAF50; font-family: monospace; font-weight: bold;');
                console.log(`%c← Results: ${cities.length} cities found`, 'color: #4CAF50; font-family: monospace;');
                if (cities.length > 0) {
                    console.log(`%c← Sample: ${cities[0].name}, ${cities[0].country}`, 'color: #4CAF50; font-family: monospace;');
                }
            }

            // Log the successful response
            this._emitLog({
                type: 'response',
                status: 200,
                data: cities.slice(0, 2), // Only show first 2 cities to keep logs readable
                totalResults: cities.length,
                query: cityName
            });

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
                // Note: API usage data is intentionally NOT cleared here
                // Use resetApiCounter() if you want to reset the API call limit
            }
        } catch (error) {
            console.warn('Failed to clear localStorage cache:', error);
        }

        console.log('All caches cleared (API usage limit preserved)');
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

    // Get cached cities with timestamps
    getCachedCities() {
        const memoryCities = Array.from(this.cache.entries()).map(([key, value]) => ({
            id: `memory-${key}`,
            query: key.split('-')[0], // Extract query from cache key
            source: 'memory',
            timestamp: new Date(value.timestamp).toLocaleString(),
            cities: value.data && value.data.length > 0
                ? value.data.slice(0, 3).map(city => city.display).join(', ')
                : 'No cities found',
            totalResults: value.data ? value.data.length : 0,
            age: Date.now() - value.timestamp
        }));

        const persistentCities = Array.from(this.persistentCache.entries()).map(([key, value]) => ({
            id: `persistent-${key}`,
            query: key.split('-')[0], // Extract query from cache key  
            source: value.source || 'persistent',
            timestamp: new Date(value.timestamp).toLocaleString(),
            cities: value.data && value.data.length > 0
                ? value.data.slice(0, 3).map(city => city.display).join(', ')
                : 'No cities found',
            totalResults: value.data ? value.data.length : 0,
            age: Date.now() - value.timestamp
        }));

        // Combine and sort by timestamp (newest first)
        const allCached = [...memoryCities, ...persistentCities]
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        return allCached;
    }

    // Reset API call counter (useful for testing)
    resetApiCounter() {
        this.requestCount = 0;
        this.lastRequestTime = 0;

        // Clear localStorage data
        this._saveApiUsageData();

        console.log('API call counter reset and localStorage cleared');
    }

    // Test logging system (for debugging)
    testLogging() {
        this._emitLog({
            type: 'system',
            message: 'Test log entry - logging system is working!'
        });
    }
}

// Create singleton instance
const cityService = new CityService();

export default cityService; 
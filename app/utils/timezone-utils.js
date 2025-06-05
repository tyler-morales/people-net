// Timezone utility functions for determining timezone from city locations

// Major cities and their timezones
const CITY_TIMEZONES = {
    // US Cities
    'New York': 'EST',
    'Los Angeles': 'PST',
    'Chicago': 'CST',
    'San Francisco': 'PST',
    'Seattle': 'PST',
    'Boston': 'EST',
    'Washington': 'EST',
    'Miami': 'EST',
    'Dallas': 'CST',
    'Denver': 'MST',
    'Phoenix': 'MST',
    'Atlanta': 'EST',
    'Portland': 'PST',
    'Minneapolis': 'CST',
    'Detroit': 'EST',
    'Philadelphia': 'EST',
    'Houston': 'CST',
    'Austin': 'CST',
    'Nashville': 'CST',
    'Las Vegas': 'PST',

    // Canadian Cities
    'Toronto': 'EST',
    'Vancouver': 'PST',
    'Montreal': 'EST',
    'Calgary': 'MST',
    'Ottawa': 'EST',
    'Edmonton': 'MST',
    'Winnipeg': 'CST',
    'Halifax': 'AST',

    // European Cities
    'London': 'GMT',
    'Paris': 'CET',
    'Berlin': 'CET',
    'Madrid': 'CET',
    'Rome': 'CET',
    'Amsterdam': 'CET',
    'Brussels': 'CET',
    'Vienna': 'CET',
    'Prague': 'CET',
    'Stockholm': 'CET',
    'Copenhagen': 'CET',
    'Oslo': 'CET',
    'Helsinki': 'EET',
    'Zurich': 'CET',
    'Dublin': 'GMT',
    'Edinburgh': 'GMT',
    'Lisbon': 'WET',
    'Athens': 'EET',
    'Warsaw': 'CET',
    'Budapest': 'CET',

    // Asian Cities
    'Tokyo': 'JST',
    'Seoul': 'KST',
    'Beijing': 'CST',
    'Shanghai': 'CST',
    'Hong Kong': 'HKT',
    'Singapore': 'SGT',
    'Mumbai': 'IST',
    'Delhi': 'IST',
    'Bangalore': 'IST',
    'Bangkok': 'ICT',
    'Manila': 'PHT',
    'Jakarta': 'WIB',
    'Kuala Lumpur': 'MYT',
    'Tel Aviv': 'IST',
    'Dubai': 'GST',
    'Riyadh': 'AST',

    // Australian Cities
    'Sydney': 'AEST',
    'Melbourne': 'AEST',
    'Brisbane': 'AEST',
    'Perth': 'AWST',
    'Adelaide': 'ACST',

    // Other Cities
    'Mexico City': 'CST',
    'São Paulo': 'BRT',
    'Rio de Janeiro': 'BRT',
    'Buenos Aires': 'ART',
    'Lima': 'PET',
    'Bogotá': 'COT',
    'Santiago': 'CLT',
    'Cairo': 'EET',
    'Cape Town': 'SAST',
    'Lagos': 'WAT',
    'Nairobi': 'EAT',
    'Johannesburg': 'SAST',
    'Istanbul': 'TRT',
    'Moscow': 'MSK',
    'St. Petersburg': 'MSK'
};

// Country-based timezone fallbacks
const COUNTRY_TIMEZONES = {
    'US': 'EST', // Default to Eastern for US
    'USA': 'EST',
    'United States': 'EST',
    'CA': 'EST', // Default to Eastern for Canada
    'Canada': 'EST',
    'UK': 'GMT',
    'United Kingdom': 'GMT',
    'GB': 'GMT',
    'Germany': 'CET',
    'DE': 'CET',
    'France': 'CET',
    'FR': 'CET',
    'Japan': 'JST',
    'JP': 'JST',
    'China': 'CST',
    'CN': 'CST',
    'Australia': 'AEST',
    'AU': 'AEST',
    'India': 'IST',
    'IN': 'IST',
    'Singapore': 'SGT',
    'SG': 'SGT',
    'Brazil': 'BRT',
    'BR': 'BRT',
    'Mexico': 'CST',
    'MX': 'CST'
};

/**
 * Extract timezone from a location string
 * @param {string} locationString - Location string like "San Francisco, CA, USA" or "Tokyo, Japan"
 * @returns {string} - Timezone abbreviation or empty string if not found
 */
export function getTimezoneFromLocation(locationString) {
    if (!locationString || typeof locationString !== 'string') {
        return '';
    }

    // Clean up the location string
    const location = locationString.trim();

    // Split by comma to get parts
    const parts = location.split(',').map(part => part.trim());

    if (parts.length === 0) {
        return '';
    }

    // Get the city name (first part)
    const cityName = parts[0];

    // Direct city lookup
    if (CITY_TIMEZONES[cityName]) {
        return CITY_TIMEZONES[cityName];
    }

    // Try country lookup if we have multiple parts
    if (parts.length > 1) {
        // Check each part for country match (usually the last part)
        for (let i = parts.length - 1; i >= 1; i--) {
            const part = parts[i];
            if (COUNTRY_TIMEZONES[part]) {
                return COUNTRY_TIMEZONES[part];
            }
        }
    }

    // If no direct match, try fuzzy matching for city names
    const cityLower = cityName.toLowerCase();
    for (const [city, timezone] of Object.entries(CITY_TIMEZONES)) {
        if (city.toLowerCase() === cityLower) {
            return timezone;
        }
    }

    // Still no match? Try partial matching for common variations
    for (const [city, timezone] of Object.entries(CITY_TIMEZONES)) {
        const cityLower = city.toLowerCase();
        if (cityLower.includes(cityName.toLowerCase()) || cityName.toLowerCase().includes(cityLower)) {
            return timezone;
        }
    }

    return '';
}

/**
 * Check if a timezone is valid
 * @param {string} timezone - Timezone abbreviation
 * @returns {boolean} - Whether the timezone is valid
 */
export function isValidTimezone(timezone) {
    const validTimezones = new Set([
        ...Object.values(CITY_TIMEZONES),
        ...Object.values(COUNTRY_TIMEZONES)
    ]);
    return validTimezones.has(timezone);
}

/**
 * Get all available timezones
 * @returns {string[]} - Array of timezone abbreviations
 */
export function getAllTimezones() {
    const timezones = new Set([
        ...Object.values(CITY_TIMEZONES),
        ...Object.values(COUNTRY_TIMEZONES)
    ]);
    return Array.from(timezones).sort();
}

/**
 * Format timezone for display (can be expanded for work hours format)
 * @param {string} timezone - Timezone abbreviation
 * @returns {string} - Formatted timezone for work hours
 */
export function formatTimezoneForWorkHours(timezone) {
    if (!timezone) return '';
    return timezone;
} 
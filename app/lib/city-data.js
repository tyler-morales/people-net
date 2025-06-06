// Common cities for location dropdown suggestions
// Format: "City, State/Province, Country" for easy geocoding
export const commonCities = [
    // USA - Major Tech Hubs
    "San Francisco, CA, USA",
    "San Jose, CA, USA",
    "Los Angeles, CA, USA",
    "Seattle, WA, USA",
    "New York, NY, USA",
    "Boston, MA, USA",
    "Austin, TX, USA",
    "Denver, CO, USA",
    "Chicago, IL, USA",
    "Philadelphia, PA, USA",
    "Washington, DC, USA",
    "Atlanta, GA, USA",
    "Miami, FL, USA",
    "Portland, OR, USA",

    // Canada
    "Toronto, ON, Canada",
    "Vancouver, BC, Canada",
    "Montreal, QC, Canada",
    "Calgary, AB, Canada",

    // India - Tech Centers
    "Bangalore, Karnataka, India",
    "Mumbai, Maharashtra, India",
    "Pune, Maharashtra, India",
    "Hyderabad, Telangana, India",
    "Chennai, Tamil Nadu, India",
    "New Delhi, Delhi, India",
    "Gurgaon, Haryana, India",

    // Europe
    "London, England, UK",
    "Dublin, Ireland",
    "Berlin, Germany",
    "Amsterdam, Netherlands",
    "Paris, France",
    "Zurich, Switzerland",
    "Stockholm, Sweden",

    // Other Global Cities
    "Tokyo, Japan",
    "Singapore",
    "Sydney, NSW, Australia",
    "Tel Aviv, Israel",
    "Sao Paulo, Brazil"
];

// Extract city name from full location string for display
export function extractCityName(location) {
    if (!location) return '';
    return location.split(',')[0].trim();
}

// Format location for consistent display
export function formatLocation(city, state = '', country = '') {
    let formatted = city;
    if (state) formatted += `, ${state}`;
    if (country) formatted += `, ${country}`;
    return formatted;
} 
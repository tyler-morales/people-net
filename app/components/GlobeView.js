'use client'
import { useState, useRef, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import Globe to avoid SSR issues
const Globe = dynamic(() => import('react-globe.gl'), {
    ssr: false,
    loading: () => <div className="flex items-center justify-center h-96">Loading Globe...</div>
});

// Geocoding utility to convert location strings to coordinates
const locationToCoordinates = {
    'New York': { lat: 40.7128, lng: -74.0060 },
    'London': { lat: 51.5074, lng: -0.1278 },
    'Philly': { lat: 39.9526, lng: -75.1652 },
    'Philadelphia': { lat: 39.9526, lng: -75.1652 },
    'Chicago': { lat: 41.8781, lng: -87.6298 },
    'San Francisco': { lat: 37.7749, lng: -122.4194 },
    'SF': { lat: 37.7749, lng: -122.4194 },
    'Los Angeles': { lat: 34.0522, lng: -118.2437 },
    'LA': { lat: 34.0522, lng: -118.2437 },
    'Seattle': { lat: 47.6062, lng: -122.3321 },
    'Boston': { lat: 42.3601, lng: -71.0589 },
    'Austin': { lat: 30.2672, lng: -97.7431 },
    'Denver': { lat: 39.7392, lng: -104.9903 },
    'Miami': { lat: 25.7617, lng: -80.1918 },
    'Toronto': { lat: 43.6532, lng: -79.3832 },
    'Vancouver': { lat: 49.2827, lng: -123.1207 },
    'Berlin': { lat: 52.5200, lng: 13.4050 },
    'Paris': { lat: 48.8566, lng: 2.3522 },
    'Tokyo': { lat: 35.6762, lng: 139.6503 },
    'Sydney': { lat: -33.8688, lng: 151.2093 },
    'Singapore': { lat: 1.3521, lng: 103.8198 },
    'Mumbai': { lat: 19.0760, lng: 72.8777 },
    'Bangalore': { lat: 12.9716, lng: 77.5946 },
    'Remote': { lat: 0, lng: 0 }, // Default for remote workers
    '': { lat: 0, lng: 0 } // Default for empty locations
};

// Function to parse location string and return coordinates
const parseLocation = (locationStr) => {
    if (!locationStr) return locationToCoordinates[''];

    // First check for exact matches
    const exactMatch = locationToCoordinates[locationStr];
    if (exactMatch) return exactMatch;

    // Check for partial matches (case insensitive)
    const lowerLocation = locationStr.toLowerCase();
    for (const [key, coords] of Object.entries(locationToCoordinates)) {
        if (key.toLowerCase().includes(lowerLocation) || lowerLocation.includes(key.toLowerCase())) {
            return coords;
        }
    }

    // Return default if no match found
    return locationToCoordinates[''];
};

export default function GlobeView({ people }) {
    const globeEl = useRef();
    const [selectedCity, setSelectedCity] = useState(null);
    const [globeReady, setGlobeReady] = useState(false);
    const [isRotating, setIsRotating] = useState(true);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [selectedContactRange, setSelectedContactRange] = useState(null);
    const [isExpanded, setIsExpanded] = useState(false);

    // Group people by location and create globe data
    const globeData = (() => {
        // Group people by location
        const locationGroups = people.reduce((acc, person) => {
            const location = person.location || 'Unknown';
            if (!acc[location]) {
                acc[location] = [];
            }
            acc[location].push(person);
            return acc;
        }, {});

        // Convert to globe points with proportional heights
        const allData = Object.entries(locationGroups).map(([location, peopleInLocation]) => {
            const coords = parseLocation(location);
            const count = peopleInLocation.length;

            return {
                lat: coords.lat,
                lng: coords.lng,
                location: location,
                count: count,
                people: peopleInLocation,
                color: getCityColor(count),
                size: getCitySize(count),
                height: getCityHeight(count)
            };
        });

        // Filter by selected location if any
        if (selectedLocation) {
            return allData.filter(item => item.location === selectedLocation);
        }

        // Filter by selected contact range if any
        if (selectedContactRange) {
            return allData.filter(item => {
                const count = item.count;
                if (selectedContactRange.minCount === 5) return count >= 5;
                if (selectedContactRange.minCount === 3) return count >= 3 && count <= 4;
                if (selectedContactRange.minCount === 2) return count === 2;
                return count === 1;
            });
        }

        return allData;
    })();

    // Handle escape key
    useEffect(() => {
        const handleEscape = (event) => {
            if (event.key === 'Escape' && isExpanded) {
                setIsExpanded(false);
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isExpanded]);

    // Color mapping based on number of people
    function getCityColor(count) {
        if (count >= 5) return '#ff6b6b';      // vibrant red for 5+ people
        if (count >= 3) return '#feca57';      // vibrant yellow for 3-4 people
        if (count >= 2) return '#45b7d1';      // vibrant blue for 2 people
        return '#4ecdc4';                      // vibrant teal for 1 person
    }

    // Size mapping - now fixed for all cities
    function getCitySize(count) {
        return 0.8; // Fixed size for all cities
    }

    // Height mapping based on number of people
    function getCityHeight(count) {
        return Math.min(0.1 + (count * 0.05), 0.5); // Scale from 0.1 to 0.5
    }

    const handlePointClick = useCallback((point, event) => {
        setSelectedCity(point);
    }, []);

    const handleGlobeReady = useCallback(() => {
        setGlobeReady(true);
        // Auto-rotate the globe
        if (globeEl.current) {
            globeEl.current.controls().autoRotate = isRotating;
            globeEl.current.controls().autoRotateSpeed = 0.5;
        }
    }, [isRotating]);

    const toggleRotation = useCallback(() => {
        setIsRotating(prev => {
            const newRotating = !prev;
            if (globeEl.current && globeEl.current.controls()) {
                globeEl.current.controls().autoRotate = newRotating;
            }
            return newRotating;
        });
    }, []);

    // Update rotation when state changes
    useEffect(() => {
        if (globeEl.current && globeEl.current.controls()) {
            globeEl.current.controls().autoRotate = isRotating;
        }
    }, [isRotating]);

    const handleLocationClick = (location) => {
        if (selectedLocation === location) {
            setSelectedLocation(null); // Deselect if already selected
            // Reset globe view to show all
            if (globeEl.current) {
                globeEl.current.pointOfView({ altitude: 2 }, 1000);
            }
        } else {
            setSelectedLocation(location);
            // Animate globe to focus on this location
            const coords = parseLocation(location);
            if (globeEl.current && coords.lat !== 0 && coords.lng !== 0) {
                globeEl.current.pointOfView({
                    lat: coords.lat,
                    lng: coords.lng,
                    altitude: 1.5 // Zoom in closer to the location
                }, 1500); // 1.5 second animation
            }
        }
        setSelectedCity(null); // Clear city selection
        setSelectedContactRange(null); // Clear range selection
    };

    const handleContactRangeClick = (range) => {
        if (selectedContactRange && selectedContactRange.minCount === range.minCount) {
            setSelectedContactRange(null); // Deselect if already selected
        } else {
            setSelectedContactRange(range);
        }
        setSelectedLocation(null); // Clear location selection
        setSelectedCity(null); // Clear city selection
    };

    return (
        <>
            {/* Regular View */}
            <div className="flex gap-6">
                {/* Globe Container - 70% width */}
                <div className="w-[70%]">
                    <div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <h3 className="text-lg font-semibold">Global Network View</h3>
                            {selectedLocation && (
                                <div className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                                    Filtered: {selectedLocation}
                                </div>
                            )}
                            {selectedContactRange && (
                                <div className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                                    Showing: {selectedContactRange.range}
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setIsExpanded(true)}
                                className="px-3 py-2 text-sm rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                            >
                                🔍 Expand
                            </button>
                            <button
                                onClick={toggleRotation}
                                className={`px-3 py-2 text-sm rounded-lg transition-colors ${isRotating
                                    ? 'bg-red-500 text-white hover:bg-red-600'
                                    : 'bg-green-500 text-white hover:bg-green-600'
                                    }`}
                            >
                                {isRotating ? '⏸️ Stop' : '▶️ Rotate'}
                            </button>
                            <div className="text-sm text-gray-600">
                                {selectedLocation || selectedContactRange
                                    ? `Showing ${globeData.length} location${globeData.length === 1 ? '' : 's'}`
                                    : `${people.length} contacts • ${globeData.filter(p => p.lat !== 0 || p.lng !== 0).length} locations`
                                }
                            </div>
                        </div>
                    </div>

                    {/* Globe */}
                    <div className="relative bg-black rounded-lg overflow-hidden" style={{ height: '600px' }}>
                        <Globe
                            ref={globeEl}
                            globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
                            backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
                            pointsData={globeData}
                            pointLat={d => d.lat}
                            pointLng={d => d.lng}
                            pointColor={d => d.color}
                            pointAltitude={d => d.height}
                            pointRadius={d => d.size}
                            pointLabel={d => `
                                <div style="color: white; background: rgba(0,0,0,0.8); padding: 8px; border-radius: 4px; max-width: 250px;">
                                    <div style="font-weight: bold; margin-bottom: 4px;">📍 ${d.location}</div>
                                    <div style="font-size: 12px; margin-bottom: 4px;">${d.count} contact${d.count === 1 ? '' : 's'}</div>
                                    <div style="font-size: 11px; color: #9ca3af;">
                                        ${d.people.slice(0, 3).map(p => p.name).join(', ')}${d.count > 3 ? ` +${d.count - 3} more` : ''}
                                    </div>
                                </div>
                            `}
                            onPointClick={handlePointClick}
                            onGlobeReady={handleGlobeReady}
                            showAtmosphere={true}
                            atmosphereColor="lightskyblue"
                            atmosphereAltitude={0.25}
                            enableZoom={true}
                            showGraticules={false}
                        />
                    </div>

                    {/* Globe Controls */}
                    <div className="mt-4 text-sm text-gray-600">
                        <div className="flex items-center gap-6">
                            <div>🖱️ Drag to rotate • 🔍 Scroll to zoom • 🎯 Click locations for details</div>
                            {globeReady && (
                                <div className="ml-auto flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full ${isRotating ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                                        <span className="text-xs">{isRotating ? 'Auto-rotating' : 'Rotation stopped'}</span>
                                    </div>
                                    <div>
                                        <span className="text-green-600">● </span>
                                        Globe loaded successfully
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar - 30% width */}
                <div className="w-[30%] space-y-6">
                    {/* Location Distribution */}
                    <div className="bg-white p-4 rounded-lg border border-gray-300">
                        <h3 className="font-semibold mb-3">Location Distribution</h3>
                        <div className="mt-6">
                            {/* Bar Chart Container */}
                            <div className="h-40 bg-gray-50 p-4 rounded flex items-end justify-around gap-2">
                                {Object.entries(
                                    people.reduce((acc, person) => {
                                        const location = person.location || 'Unknown';
                                        acc[location] = (acc[location] || 0) + 1;
                                        return acc;
                                    }, {})
                                )
                                    .sort(([, a], [, b]) => b - a)
                                    .slice(0, 6)
                                    .map(([location, count]) => {
                                        const maxCount = Math.max(...Object.values(
                                            people.reduce((acc, person) => {
                                                const loc = person.location || 'Unknown';
                                                acc[loc] = (acc[loc] || 0) + 1;
                                                return acc;
                                            }, {})
                                        ));

                                        // Calculate height in pixels (20px minimum, up to 120px)
                                        const maxHeight = 120;
                                        const minHeight = 20;
                                        const barHeight = minHeight + ((count / maxCount) * (maxHeight - minHeight));
                                        const isSelected = selectedLocation === location;
                                        const isOtherSelected = selectedLocation && selectedLocation !== location;

                                        return (
                                            <div
                                                key={location}
                                                className="flex flex-col items-center w-16 cursor-pointer group"
                                                onClick={() => handleLocationClick(location)}
                                            >
                                                {/* Count label */}
                                                <div className={`text-xs font-semibold mb-1 transition-colors ${isSelected ? 'text-blue-700' :
                                                    isOtherSelected ? 'text-gray-400' : 'text-gray-700'
                                                    }`}>
                                                    {count}
                                                </div>

                                                {/* Bar */}
                                                <div
                                                    className={`w-full rounded-t-md transition-all duration-300 ease-out group-hover:opacity-80 ${isSelected ? 'bg-blue-700 shadow-lg' :
                                                        isOtherSelected ? 'bg-blue-300' : 'bg-blue-500'
                                                        }`}
                                                    style={{
                                                        height: `${barHeight}px`,
                                                        minHeight: '20px'
                                                    }}
                                                ></div>

                                                {/* Location label */}
                                                <div className={`text-xs mt-2 text-center leading-tight w-full transition-colors ${isSelected ? 'text-blue-700 font-semibold' :
                                                    isOtherSelected ? 'text-gray-400' : 'text-gray-600'
                                                    }`}>
                                                    <div className="truncate">
                                                        {location.length > 10 ? location.substring(0, 10) + '...' : location}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>
                    </div>

                    {/* Selected City Details */}
                    {selectedCity && (
                        <div className="bg-white p-4 rounded-lg border border-gray-300">
                            <h3 className="font-semibold mb-3">📍 {selectedCity.location}</h3>
                            <div className="space-y-3">
                                <div className="text-sm text-gray-600">
                                    <strong>{selectedCity.count}</strong> contact{selectedCity.count === 1 ? '' : 's'} in this city
                                </div>

                                <div className="space-y-2">
                                    {selectedCity.people.map((person, index) => (
                                        <div key={index} className="text-sm border-l-2 border-blue-200 pl-3">
                                            <div className="font-medium">{person.name}</div>
                                            <div className="text-gray-600 text-xs">
                                                {person.role} at {person.company}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-3">
                                    <button
                                        onClick={() => setSelectedCity(null)}
                                        className="text-blue-600 hover:text-blue-800 text-sm"
                                    >
                                        Clear selection
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Location Legend */}
                    <div className="bg-white p-4 rounded-lg border border-gray-300">
                        <h3 className="font-semibold mb-3">Location Legend</h3>
                        <div className="space-y-2 text-sm">
                            {[
                                { range: '5+ contacts', color: '#ff6b6b', minCount: 5 },
                                { range: '3-4 contacts', color: '#feca57', minCount: 3 },
                                { range: '2 contacts', color: '#45b7d1', minCount: 2 },
                                { range: '1 contact', color: '#4ecdc4', minCount: 1 }
                            ].map((item) => {
                                // Find locations that match this color range
                                const matchingLocations = Object.entries(
                                    people.reduce((acc, person) => {
                                        const location = person.location || 'Unknown';
                                        acc[location] = (acc[location] || 0) + 1;
                                        return acc;
                                    }, {})
                                ).filter(([, count]) => {
                                    if (item.minCount === 5) return count >= 5;
                                    if (item.minCount === 3) return count >= 3 && count <= 4;
                                    if (item.minCount === 2) return count === 2;
                                    return count === 1;
                                });

                                return (
                                    <div key={item.range} className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-4 h-4 rounded-full cursor-pointer hover:scale-110 transition-transform"
                                                style={{ backgroundColor: item.color }}
                                                onClick={() => handleContactRangeClick(item)}
                                            ></div>
                                            <span>{item.range}</span>
                                            <span className="text-gray-500 ml-auto">
                                                {matchingLocations.length} cities
                                            </span>
                                        </div>

                                        {/* Show matching locations when this color is selected */}
                                        {selectedContactRange && selectedContactRange.minCount === item.minCount && (
                                            <div className="ml-6 text-xs space-y-2">
                                                <div className="text-blue-600 font-medium">
                                                    Cities in this range:
                                                </div>
                                                {matchingLocations.map(([location, count]) => {
                                                    // Get contacts for this location
                                                    const contactsInLocation = people.filter(person =>
                                                        (person.location || 'Unknown') === location
                                                    );

                                                    return (
                                                        <div key={location} className="space-y-1">
                                                            <div className="text-blue-700 font-medium">
                                                                📍 {location} ({count} contact{count === 1 ? '' : 's'})
                                                            </div>
                                                            <div className="ml-4 space-y-1">
                                                                {contactsInLocation.map((person, idx) => (
                                                                    <div key={idx} className="text-gray-600 text-xs">
                                                                        • {person.name} - {person.role} at {person.company}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            {/* Clear filter button */}
                            {(selectedContactRange || selectedLocation) && (
                                <div className="pt-2 border-t border-gray-200">
                                    <button
                                        onClick={() => {
                                            setSelectedContactRange(null);
                                            setSelectedLocation(null);
                                            setSelectedCity(null);
                                        }}
                                        className="text-xs text-blue-600 hover:text-blue-800 underline"
                                    >
                                        Clear filter • Show all locations
                                    </button>
                                </div>
                            )}

                            <div className="text-xs text-gray-500 mt-2">
                                • Cylinder height = number of contacts
                            </div>
                        </div>
                    </div>

                    {/* Instructions */}
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <h3 className="font-semibold mb-2 text-blue-900">How to use</h3>
                        <ul className="text-sm text-blue-800 space-y-1">
                            <li>• Drag to rotate the globe</li>
                            <li>• Scroll to zoom in/out</li>
                            <li>• Click locations to see all contacts</li>
                            <li>• Cylinder height shows contact density</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Expanded Full-Screen View */}
            {isExpanded && (
                <div className="fixed inset-0 z-50 bg-black">
                    {/* Full Screen Globe */}
                    <div className="w-full h-full relative">
                        <Globe
                            ref={globeEl}
                            globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
                            backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
                            pointsData={globeData}
                            pointLat={d => d.lat}
                            pointLng={d => d.lng}
                            pointColor={d => d.color}
                            pointAltitude={d => d.height}
                            pointRadius={d => d.size}
                            pointLabel={d => `
                                <div style="color: white; background: rgba(0,0,0,0.8); padding: 8px; border-radius: 4px; max-width: 250px;">
                                    <div style="font-weight: bold; margin-bottom: 4px;">📍 ${d.location}</div>
                                    <div style="font-size: 12px; margin-bottom: 4px;">${d.count} contact${d.count === 1 ? '' : 's'}</div>
                                    <div style="font-size: 11px; color: #9ca3af;">
                                        ${d.people.slice(0, 3).map(p => p.name).join(', ')}${d.count > 3 ? ` +${d.count - 3} more` : ''}
                                    </div>
                                </div>
                            `}
                            onPointClick={handlePointClick}
                            onGlobeReady={handleGlobeReady}
                            showAtmosphere={true}
                            atmosphereColor="lightskyblue"
                            atmosphereAltitude={0.25}
                            enableZoom={true}
                            showGraticules={false}
                            width={window.innerWidth}
                            height={window.innerHeight}
                        />
                    </div>

                    {/* Close Button */}
                    <button
                        onClick={() => setIsExpanded(false)}
                        className="absolute top-6 right-6 p-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white hover:bg-white/20 transition-all duration-300 shadow-lg"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>

                    {/* Glassy Controls Panel - Top Left */}
                    <div className="absolute top-6 left-6 p-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-lg">
                        <div className="flex items-center gap-4">
                            <h3 className="text-white font-semibold">Global Network</h3>
                            {selectedLocation && (
                                <div className="px-3 py-1 bg-blue-500/30 text-blue-100 text-sm rounded-full backdrop-blur-sm">
                                    {selectedLocation}
                                </div>
                            )}
                            {selectedContactRange && (
                                <div className="px-3 py-1 bg-blue-500/30 text-blue-100 text-sm rounded-full backdrop-blur-sm">
                                    {selectedContactRange.range}
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-4 mt-3">
                            <button
                                onClick={toggleRotation}
                                className={`px-3 py-2 text-sm rounded-lg transition-all duration-300 backdrop-blur-sm border border-white/20 ${isRotating
                                    ? 'bg-red-500/80 text-white hover:bg-red-500'
                                    : 'bg-green-500/80 text-white hover:bg-green-500'
                                    }`}
                            >
                                {isRotating ? '⏸️ Stop' : '▶️ Rotate'}
                            </button>
                            <div className="text-sm text-white/80">
                                {selectedLocation || selectedContactRange
                                    ? `${globeData.length} location${globeData.length === 1 ? '' : 's'}`
                                    : `${people.length} contacts • ${globeData.filter(p => p.lat !== 0 || p.lng !== 0).length} locations`
                                }
                            </div>
                        </div>
                    </div>

                    {/* Glassy Location Distribution Panel - Bottom Left */}
                    <div className="absolute bottom-6 left-6 p-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-lg max-w-md">
                        <h3 className="text-white font-semibold mb-3">Location Distribution</h3>
                        <div className="h-32 bg-black/20 backdrop-blur-sm p-3 rounded-lg flex items-end justify-around gap-2">
                            {Object.entries(
                                people.reduce((acc, person) => {
                                    const location = person.location || 'Unknown';
                                    acc[location] = (acc[location] || 0) + 1;
                                    return acc;
                                }, {})
                            )
                                .sort(([, a], [, b]) => b - a)
                                .slice(0, 6)
                                .map(([location, count]) => {
                                    const maxCount = Math.max(...Object.values(
                                        people.reduce((acc, person) => {
                                            const loc = person.location || 'Unknown';
                                            acc[loc] = (acc[loc] || 0) + 1;
                                            return acc;
                                        }, {})
                                    ));

                                    const maxHeight = 80;
                                    const minHeight = 15;
                                    const barHeight = minHeight + ((count / maxCount) * (maxHeight - minHeight));
                                    const isSelected = selectedLocation === location;
                                    const isOtherSelected = selectedLocation && selectedLocation !== location;

                                    return (
                                        <div
                                            key={location}
                                            className="flex flex-col items-center w-12 cursor-pointer group"
                                            onClick={() => handleLocationClick(location)}
                                        >
                                            <div className={`text-xs font-semibold mb-1 transition-colors ${isSelected ? 'text-blue-300' :
                                                isOtherSelected ? 'text-white/40' : 'text-white/80'
                                                }`}>
                                                {count}
                                            </div>

                                            <div
                                                className={`w-full rounded-t-md transition-all duration-300 ease-out group-hover:opacity-80 ${isSelected ? 'bg-blue-400 shadow-lg' :
                                                    isOtherSelected ? 'bg-blue-300/50' : 'bg-blue-500'
                                                    }`}
                                                style={{
                                                    height: `${barHeight}px`,
                                                    minHeight: '15px'
                                                }}
                                            ></div>

                                            <div className={`text-xs mt-1 text-center leading-tight w-full transition-colors ${isSelected ? 'text-blue-300 font-semibold' :
                                                isOtherSelected ? 'text-white/40' : 'text-white/80'
                                                }`}>
                                                <div className="truncate">
                                                    {location.length > 8 ? location.substring(0, 8) + '...' : location}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    </div>

                    {/* Glassy Location Legend Panel - Bottom Right */}
                    <div className="absolute bottom-6 right-6 p-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-lg max-w-sm max-h-96 overflow-y-auto">
                        <h3 className="text-white font-semibold mb-3">Location Legend</h3>
                        <div className="space-y-2 text-sm">
                            {[
                                { range: '5+ contacts', color: '#ff6b6b', minCount: 5 },
                                { range: '3-4 contacts', color: '#feca57', minCount: 3 },
                                { range: '2 contacts', color: '#45b7d1', minCount: 2 },
                                { range: '1 contact', color: '#4ecdc4', minCount: 1 }
                            ].map((item) => {
                                const matchingLocations = Object.entries(
                                    people.reduce((acc, person) => {
                                        const location = person.location || 'Unknown';
                                        acc[location] = (acc[location] || 0) + 1;
                                        return acc;
                                    }, {})
                                ).filter(([, count]) => {
                                    if (item.minCount === 5) return count >= 5;
                                    if (item.minCount === 3) return count >= 3 && count <= 4;
                                    if (item.minCount === 2) return count === 2;
                                    return count === 1;
                                });

                                return (
                                    <div key={item.range} className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-4 h-4 rounded-full cursor-pointer hover:scale-110 transition-transform border border-white/20"
                                                style={{ backgroundColor: item.color }}
                                                onClick={() => handleContactRangeClick(item)}
                                            ></div>
                                            <span className="text-white/90">{item.range}</span>
                                            <span className="text-white/60 ml-auto">
                                                {matchingLocations.length} cities
                                            </span>
                                        </div>

                                        {selectedContactRange && selectedContactRange.minCount === item.minCount && (
                                            <div className="ml-6 text-xs space-y-2 max-h-40 overflow-y-auto">
                                                <div className="text-blue-300 font-medium">
                                                    Cities in this range:
                                                </div>
                                                {matchingLocations.slice(0, 3).map(([location, count]) => {
                                                    const contactsInLocation = people.filter(person =>
                                                        (person.location || 'Unknown') === location
                                                    );

                                                    return (
                                                        <div key={location} className="space-y-1">
                                                            <div className="text-blue-200 font-medium">
                                                                📍 {location} ({count})
                                                            </div>
                                                            <div className="ml-4 space-y-1">
                                                                {contactsInLocation.slice(0, 2).map((person, idx) => (
                                                                    <div key={idx} className="text-white/70 text-xs">
                                                                        • {person.name}
                                                                    </div>
                                                                ))}
                                                                {contactsInLocation.length > 2 && (
                                                                    <div className="text-white/50 text-xs">
                                                                        +{contactsInLocation.length - 2} more
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                                {matchingLocations.length > 3 && (
                                                    <div className="text-white/50 text-xs">
                                                        +{matchingLocations.length - 3} more cities
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            {(selectedContactRange || selectedLocation) && (
                                <div className="pt-2 border-t border-white/20">
                                    <button
                                        onClick={() => {
                                            setSelectedContactRange(null);
                                            setSelectedLocation(null);
                                            setSelectedCity(null);
                                        }}
                                        className="text-xs text-blue-300 hover:text-blue-200 underline"
                                    >
                                        Clear filter
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ESC Hint */}
                    <div className="absolute top-6 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-black/20 backdrop-blur-sm border border-white/20 rounded-full text-white/70 text-sm">
                        Press <kbd className="px-2 py-1 bg-white/20 rounded text-xs">ESC</kbd> to exit fullscreen
                    </div>
                </div>
            )}
        </>
    );
} 
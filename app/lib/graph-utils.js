import { strengthToNumber } from './connection-utils';

// Graph utility functions
export function getNodeRadius(strength) {
    const radiusMap = {
        'fleeting': 15,
        'acquaintance': 18,
        'casual': 21,
        'working': 24,
        'strong': 27,
        'core': 30
    };
    return radiusMap[strength] || 15;
}

export function getNodeColor(strength) {
    const colorMap = {
        'fleeting': '#6366f1',      // Cold - Indigo (1)
        'acquaintance': '#3b82f6',  // Cool - Blue (2) 
        'casual': '#10b981',        // Cool-Neutral - Green (3)
        'working': '#f59e0b',       // Warm-Neutral - Yellow (4)
        'strong': '#f97316',        // Warm - Orange (5)
        'core': '#ef4444'           // Hot - Red (6)
    };
    return colorMap[strength] || '#6b7280';
}

export function getStrokeWidth(strength) {
    const widthMap = {
        'fleeting': 1,
        'acquaintance': 2,
        'casual': 3,
        'working': 4,
        'strong': 5,
        'core': 6
    };
    return widthMap[strength] || 1;
}

export function calculateGraphLayout(people, width, height) {
    const calculatedNodes = [
        { id: 'you', name: 'You', x: width / 2, y: height / 2, radius: 30, color: '#3b82f6' },
        ...people.map((person, index) => {
            const angle = (index * 2 * Math.PI) / people.length;
            const radius = 200;
            return {
                id: person.id,
                name: person.name,
                company: person.company,
                role: person.role,
                strength: person.connection?.strength,
                connection: person.connection,
                x: Math.round((width / 2 + Math.cos(angle) * radius) * 100) / 100,
                y: Math.round((height / 2 + Math.sin(angle) * radius) * 100) / 100,
                radius: getNodeRadius(person.connection?.strength),
                color: getNodeColor(person.connection?.strength)
            };
        })
    ];

    return calculatedNodes;
}

export function calculateGraphLinks(people, graphFilter) {
    let calculatedLinks = [];

    if (graphFilter === 'all' || graphFilter === 'direct') {
        // Direct connections to "you"
        const directLinks = people
            .filter(person => !person.connection?.introducedBy && person.connection?.introducedByType === 'direct')
            .map(person => ({
                source: 'you',
                target: person.id,
                strength: person.connection?.strength,
                strokeWidth: getStrokeWidth(person.connection?.strength),
                type: 'direct',
                strokeStyle: 'solid'
            }));
        calculatedLinks = [...calculatedLinks, ...directLinks];
    }

    if (graphFilter === 'all' || graphFilter === 'introduced') {
        // Indirect connections through existing people
        const indirectLinks = people
            .filter(person => person.connection?.introducedBy && person.connection?.introducedByType === 'existing')
            .map(person => ({
                source: person.connection.introducedBy,
                target: person.id,
                strength: person.connection?.strength,
                strokeWidth: Math.max(1, getStrokeWidth(person.connection?.strength) - 1),
                type: 'introduced',
                strokeStyle: 'dashed'
            }));
        calculatedLinks = [...calculatedLinks, ...indirectLinks];

        // Also add connections from "you" to introducers if not already direct
        const introducerLinks = people
            .filter(person => person.connection?.introducedBy && person.connection?.introducedByType === 'existing')
            .map(person => person.connection.introducedBy)
            .filter((introducerId, index, arr) => arr.indexOf(introducerId) === index) // unique
            .filter(introducerId => !people.find(p => p.id === introducerId && p.connection?.introducedByType === 'direct'))
            .map(introducerId => ({
                source: 'you',
                target: introducerId,
                strength: 'casual',
                strokeWidth: 2,
                type: 'connector',
                strokeStyle: 'dotted'
            }));
        calculatedLinks = [...calculatedLinks, ...introducerLinks];
    }

    if (graphFilter === 'all' || graphFilter === 'external') {
        // Show connections to "you" for people introduced by external contacts
        const externalLinks = people
            .filter(person => person.connection?.introducedByType === 'external')
            .map(person => ({
                source: 'you',
                target: person.id,
                strength: person.connection?.strength,
                strokeWidth: getStrokeWidth(person.connection?.strength),
                type: 'external',
                strokeStyle: 'solid'
            }));
        calculatedLinks = [...calculatedLinks, ...externalLinks];
    }

    return calculatedLinks;
} 
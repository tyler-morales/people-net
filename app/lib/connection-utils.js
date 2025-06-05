// Helper functions for connection strength
export const strengthToNumber = (strength) => {
    const strengthMap = {
        'fleeting': 1,
        'acquaintance': 2,
        'casual': 3,
        'working': 4,
        'strong': 5,
        'core': 6
    };
    return strengthMap[strength] || 3;
};

export const numberToStrength = (number) => {
    const numberMap = {
        1: 'fleeting',
        2: 'acquaintance',
        3: 'casual',
        4: 'working',
        5: 'strong',
        6: 'core'
    };
    return numberMap[number] || 'casual';
};

export const getStrengthLabel = (strength) => {
    const labelMap = {
        'fleeting': 'Fleeting (1)',
        'acquaintance': 'Acquaintance (2)',
        'casual': 'Casual (3)',
        'working': 'Working (4)',
        'strong': 'Strong (5)',
        'core': 'Core (6)'
    };
    return labelMap[strength] || 'Casual (3)';
}; 
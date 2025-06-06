import { useState, useMemo } from 'react';

export function usePeopleSort(people) {
    const [sortBy, setSortBy] = useState('none'); // 'none', 'name-asc', 'name-desc', 'date-asc', 'date-desc'

    const sortedPeople = useMemo(() => {
        if (sortBy === 'none') return people;

        return [...people].sort((a, b) => {
            switch (sortBy) {
                case 'name-asc':
                    return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
                case 'name-desc':
                    return b.name.toLowerCase().localeCompare(a.name.toLowerCase());
                case 'date-asc':
                    const dateA = a.dateMet ? new Date(a.dateMet) : new Date(0);
                    const dateB = b.dateMet ? new Date(b.dateMet) : new Date(0);
                    return dateA - dateB;
                case 'date-desc':
                    const dateA2 = a.dateMet ? new Date(a.dateMet) : new Date(0);
                    const dateB2 = b.dateMet ? new Date(b.dateMet) : new Date(0);
                    return dateB2 - dateA2;
                default:
                    return 0;
            }
        });
    }, [people, sortBy]);

    return {
        sortBy,
        setSortBy,
        sortedPeople
    };
} 
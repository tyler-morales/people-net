import { useState, useMemo, useEffect } from 'react';

export function useTableFilters(people) {
    const [globalSearch, setGlobalSearch] = useState('');
    const [columnFilters, setColumnFilters] = useState({
        company: [],
        role: [],
        location: [],
        team: [],
        connectionStrength: '',
        connectionType: '',
        dateRange: { start: '', end: '' }
    });

    // Helper function to check if a value matches a search term
    const matchesSearch = (value, searchTerm) => {
        if (!searchTerm) return true;
        if (!value) return false;
        return value.toString().toLowerCase().includes(searchTerm.toLowerCase());
    };

    // Helper function to check if value matches any of the selected filters
    const matchesMultipleFilters = (value, filterArray) => {
        if (!filterArray || filterArray.length === 0) return true;
        if (!value) return false;
        return filterArray.some(filter =>
            value.toString().toLowerCase().includes(filter.toLowerCase())
        );
    };

    // Helper function to check date range
    const isInDateRange = (date, dateRange) => {
        if (!dateRange.start && !dateRange.end) return true;
        if (!date) return false;

        const itemDate = new Date(date);
        const startDate = dateRange.start ? new Date(dateRange.start) : null;
        const endDate = dateRange.end ? new Date(dateRange.end) : null;

        if (startDate && itemDate < startDate) return false;
        if (endDate && itemDate > endDate) return false;

        return true;
    };

    // Check if any filters are active
    const hasActiveFilters = useMemo(() => {
        return globalSearch ||
            columnFilters.company.length > 0 ||
            columnFilters.role.length > 0 ||
            columnFilters.location.length > 0 ||
            columnFilters.team.length > 0 ||
            columnFilters.connectionStrength ||
            columnFilters.connectionType ||
            columnFilters.dateRange.start ||
            columnFilters.dateRange.end;
    }, [globalSearch, columnFilters]);

    // Clear all filters function
    const clearAllFilters = () => {
        setGlobalSearch('');
        setColumnFilters({
            company: [],
            role: [],
            location: [],
            team: [],
            connectionStrength: '',
            connectionType: '',
            dateRange: { start: '', end: '' }
        });
    };

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (event) => {
            // Cmd/Ctrl + K to focus search (common pattern)
            if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
                event.preventDefault();
                const searchInput = document.querySelector('input[placeholder*="Search across all fields"]');
                if (searchInput) {
                    searchInput.focus();
                    searchInput.select();
                }
            }

            // Escape to clear all filters
            if (event.key === 'Escape' && hasActiveFilters) {
                clearAllFilters();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [hasActiveFilters]);

    // Main filtering logic
    const filteredPeople = useMemo(() => {
        return people.filter(person => {
            // Global search - searches across all text fields
            if (globalSearch) {
                const searchFields = [
                    person.name,
                    person.company,
                    person.role,
                    person.team,
                    person.location,
                    person.workHours,
                    person.notes,
                    person.connection?.type,
                    person.connection?.strength,
                    person.connection?.notes,
                    person.connection?.introducedByName,
                    // Also search interactions
                    ...person.interactions.map(interaction =>
                        typeof interaction === 'string' ? interaction : interaction.text
                    )
                ].filter(Boolean); // Remove null/undefined values

                const globalMatch = searchFields.some(field =>
                    matchesSearch(field, globalSearch)
                );

                if (!globalMatch) return false;
            }

            // Multi-select column filters
            if (!matchesMultipleFilters(person.company, columnFilters.company)) {
                return false;
            }

            if (!matchesMultipleFilters(person.role, columnFilters.role)) {
                return false;
            }

            if (!matchesMultipleFilters(person.location, columnFilters.location)) {
                return false;
            }

            if (!matchesMultipleFilters(person.team, columnFilters.team)) {
                return false;
            }

            // Single-select filters (unchanged)
            if (columnFilters.connectionStrength && person.connection?.strength !== columnFilters.connectionStrength) {
                return false;
            }

            if (columnFilters.connectionType && person.connection?.type !== columnFilters.connectionType) {
                return false;
            }

            if (!isInDateRange(person.dateMet, columnFilters.dateRange)) {
                return false;
            }

            return true;
        });
    }, [people, globalSearch, columnFilters]);

    // Update column filter - handle both arrays and single values
    const updateColumnFilter = (column, value) => {
        setColumnFilters(prev => ({
            ...prev,
            [column]: value
        }));
    };

    // Update date range filter
    const updateDateRangeFilter = (start, end) => {
        setColumnFilters(prev => ({
            ...prev,
            dateRange: { start, end }
        }));
    };

    // Clear specific filter
    const clearFilter = (filterType) => {
        if (filterType === 'global') {
            setGlobalSearch('');
        } else if (filterType === 'dateRange') {
            updateDateRangeFilter('', '');
        } else if (['company', 'role', 'location', 'team'].includes(filterType)) {
            // Clear multi-select filters
            updateColumnFilter(filterType, []);
        } else {
            // Clear single-select filters
            updateColumnFilter(filterType, '');
        }
    };

    // Get unique values for dropdown filters
    const getUniqueValues = (field) => {
        const values = people.map(person => {
            if (field === 'connectionStrength') return person.connection?.strength;
            if (field === 'connectionType') return person.connection?.type;
            return person[field];
        }).filter(Boolean);

        return [...new Set(values)].sort();
    };

    return {
        globalSearch,
        setGlobalSearch,
        columnFilters,
        updateColumnFilter,
        updateDateRangeFilter,
        clearAllFilters,
        clearFilter,
        filteredPeople,
        hasActiveFilters,
        getUniqueValues
    };
} 
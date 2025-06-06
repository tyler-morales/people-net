import { useState, useMemo } from 'react';

export function useBatchSelection(people) {
    const [selectedIds, setSelectedIds] = useState(new Set());

    const selectedCount = selectedIds.size;
    const totalCount = people.length;
    const isAllSelected = totalCount > 0 && selectedIds.size === totalCount;
    const isIndeterminate = selectedIds.size > 0 && selectedIds.size < totalCount;

    const selectedPeople = useMemo(() => {
        return people.filter(person => selectedIds.has(person.id));
    }, [people, selectedIds]);

    const toggleSelectAll = () => {
        if (isAllSelected) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(people.map(person => person.id)));
        }
    };

    const toggleSelectPerson = (personId) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(personId)) {
                newSet.delete(personId);
            } else {
                newSet.add(personId);
            }
            return newSet;
        });
    };

    const clearSelection = () => {
        setSelectedIds(new Set());
    };

    const isSelected = (personId) => {
        return selectedIds.has(personId);
    };

    return {
        selectedIds,
        selectedCount,
        totalCount,
        isAllSelected,
        isIndeterminate,
        selectedPeople,
        toggleSelectAll,
        toggleSelectPerson,
        clearSelection,
        isSelected
    };
} 
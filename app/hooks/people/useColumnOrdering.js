import { useState, useEffect } from 'react';
import userPreferences from '../../lib/user-preferences';

export function useColumnOrdering() {
    const [columnOrder, setColumnOrder] = useState([]);
    const [isDefaultColumnOrder, setIsDefaultColumnOrder] = useState(true);
    const [hasReorderedThisSession, setHasReorderedThisSession] = useState(false);

    // Load column order from preferences on mount
    useEffect(() => {
        const savedOrder = userPreferences.getColumnOrder();
        setColumnOrder(savedOrder);
        setIsDefaultColumnOrder(userPreferences.isDefaultColumnOrder());
    }, []);

    // Handle column reordering
    const handleColumnReorder = (activeId, overId) => {
        if (activeId === overId) return;

        setColumnOrder(prevOrder => {
            const activeIndex = prevOrder.findIndex(col => col.id === activeId);
            const overIndex = prevOrder.findIndex(col => col.id === overId);

            if (activeIndex === -1 || overIndex === -1) return prevOrder;

            // Create new array with reordered columns
            const newOrder = [...prevOrder];
            const [movedColumn] = newOrder.splice(activeIndex, 1);
            newOrder.splice(overIndex, 0, movedColumn);

            // Save to preferences
            userPreferences.setColumnOrder(newOrder);

            // Update reactive state
            setIsDefaultColumnOrder(userPreferences.isDefaultColumnOrder());

            // Mark that user has reordered columns this session
            if (!hasReorderedThisSession) {
                setHasReorderedThisSession(true);
            }

            return newOrder;
        });
    };

    // Reset to default order
    const resetColumnOrder = () => {
        userPreferences.resetColumnOrder();
        const defaultOrder = userPreferences.getColumnOrder();
        setColumnOrder(defaultOrder);
        setIsDefaultColumnOrder(true);
    };

    // Get column by ID
    const getColumn = (id) => {
        return columnOrder.find(col => col.id === id);
    };

    // Get sorted columns (excluding certain ones from reordering)
    const getSortableColumns = () => {
        return columnOrder.filter(col => col.id !== 'select' && col.id !== 'actions');
    };

    const getFixedColumns = () => {
        return columnOrder.filter(col => col.id === 'select' || col.id === 'actions');
    };

    return {
        columnOrder,
        setColumnOrder,
        handleColumnReorder,
        resetColumnOrder,
        isDefaultColumnOrder,
        hasReorderedThisSession,
        getColumn,
        getSortableColumns,
        getFixedColumns
    };
} 
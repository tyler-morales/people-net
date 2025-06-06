import { useState, useEffect } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    SortableContext,
    horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import SortableHeader from '../ui/SortableHeader';
import ConnectionStrengthTooltip from '../ui/ConnectionStrengthTooltip';
import SelectionCheckbox from '../ui/SelectionCheckbox';
import BatchActionsBar from '../ui/BatchActionsBar';
import GlobalSearch from '../ui/GlobalSearch';
import ColumnFilters from '../ui/ColumnFilters';
import FilterStatusBar from '../ui/FilterStatusBar';
import FilterPresets from '../ui/FilterPresets';
import DraggableTableHeader from '../ui/DraggableTableHeader';
import DynamicPersonRow from './DynamicPersonRow';
import { usePeopleSort } from '../../hooks/people/usePeopleSort';
import { usePersonEditor } from '../../hooks/people/usePersonEditor';
import { useBatchSelection } from '../../hooks/people/useBatchSelection';
import { useTableFilters } from '../../hooks/people/useTableFilters';
import { useColumnOrdering } from '../../hooks/people/useColumnOrdering';
import ColumnReorderNotification from '../ui/ColumnReorderNotification';
import { getTimezoneFromLocation } from '../../utils/timezone-utils';

export default function PersonTable({
    people,
    setPeople,
    showToast,
    saveUndoState,
    handleFieldFocus,
    originalValues,
    setOriginalValues
}) {
    const [selectedPersonId, setSelectedPersonId] = useState(null);
    const [showColumnFilters, setShowColumnFilters] = useState(false);

    // Column ordering hook
    const {
        columnOrder,
        handleColumnReorder,
        resetColumnOrder,
        isDefaultColumnOrder,
        hasReorderedThisSession
    } = useColumnOrdering();

    // Use our new filtering hook
    const {
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
    } = useTableFilters(people);

    // Apply sorting to filtered people instead of all people
    const { sortBy, setSortBy, sortedPeople } = usePeopleSort(filteredPeople);

    const {
        editingField,
        editingDateId,
        setEditingDateId,
        handleInlineEdit,
        handleInlineBlur
    } = usePersonEditor();

    // Use filtered people for batch selection
    const {
        selectedCount,
        isAllSelected,
        isIndeterminate,
        selectedPeople,
        toggleSelectAll,
        toggleSelectPerson,
        clearSelection,
        isSelected
    } = useBatchSelection(sortedPeople);

    // Drag and drop sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor)
    );

    // Handle drag end
    const handleDragEnd = (event) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            handleColumnReorder(active.id, over.id);
            showToast('Column order updated!', 'success');
        }
    };

    // Handler for loading filter presets
    const handleLoadPreset = (search, filters) => {
        setGlobalSearch(search);
        Object.entries(filters).forEach(([key, value]) => {
            if (key === 'dateRange') {
                updateDateRangeFilter(value.start, value.end);
            } else {
                updateColumnFilter(key, value);
            }
        });
        showToast('Filter preset loaded', 'success');
    };

    const handleEditChange = (e, id) => {
        const { name, value } = e.target;
        setPeople((prev) =>
            prev.map((p) => {
                if (p.id === id) {
                    let updatedPerson;
                    if (name.startsWith("connection.")) {
                        updatedPerson = {
                            ...p,
                            connection: {
                                ...p.connection,
                                [name.split(".")[1]]: value,
                            },
                        };
                    } else {
                        updatedPerson = { ...p, [name]: value };
                    }

                    // Auto-fill work hours with timezone when location changes
                    if (name === 'location' && value) {
                        const timezone = getTimezoneFromLocation(value);
                        if (timezone) {
                            updatedPerson.workHours = timezone;
                        }
                    }

                    return updatedPerson;
                }
                return p;
            })
        );
    };

    const handleEditBlur = (e, id, fieldName) => {
        const person = people.find(p => p.id === id);
        const key = `${id}-${fieldName}`;
        const originalValue = originalValues[key];

        // Helper to get nested property value
        const getFieldValue = (person, fieldName) => {
            if (fieldName.startsWith('connection.')) {
                const connectionField = fieldName.split('.')[1];
                return person.connection?.[connectionField] || '';
            }
            return person[fieldName] || '';
        };

        const currentValue = getFieldValue(person, fieldName);

        // Only show toast if value actually changed
        if (person && originalValue !== undefined && originalValue !== currentValue) {
            // Clean up field name for display
            const displayFieldName = fieldName
                .replace('connection.', '')
                .replace(/([A-Z])/g, ' $1')
                .replace(/^./, str => str.toUpperCase())
                .replace('Introduced By Type', 'connection method')
                .replace('Introduced By Name', 'external introducer')
                .replace('Introduced By', 'introducer');

            showToast(`Updated ${displayFieldName} for ${person.name}`, 'success');
        }

        // Clean up the stored original value
        setOriginalValues(prev => {
            const newValues = { ...prev };
            delete newValues[key];
            return newValues;
        });
    };

    const handleInteractionAdd = (id) => {
        setPeople((prev) =>
            prev.map((p) =>
                p.id === id
                    ? {
                        ...p,
                        interactions: [...p.interactions, {
                            text: "",
                            date: new Date().toISOString().split('T')[0]
                        }],
                    }
                    : p
            )
        );
    };

    const handleInteractionChange = (id, index, value) => {
        setPeople((prev) =>
            prev.map((p) =>
                p.id === id
                    ? {
                        ...p,
                        interactions: p.interactions.map((inter, i) =>
                            i === index
                                ? typeof inter === 'string'
                                    ? { text: value, date: new Date().toISOString().split('T')[0] }
                                    : { ...inter, text: value }
                                : inter
                        ),
                    }
                    : p
            )
        );
    };

    const handleDateEditStart = (id, index) => {
        // Track original date value and save undo state
        const person = people.find(p => p.id === id);
        const interaction = person.interactions[index];
        const originalDate = typeof interaction === 'string' ? '' : (interaction.date || '');
        const fieldName = `interactions.${index}.date`;

        // Save undo state before making any changes
        saveUndoState('update', id, fieldName, originalDate, people);
        handleFieldFocus(id, fieldName, originalDate);

        // Convert string interaction to object when starting to edit date
        setPeople((prev) =>
            prev.map((p) =>
                p.id === id
                    ? {
                        ...p,
                        interactions: p.interactions.map((inter, i) =>
                            i === index && typeof inter === 'string'
                                ? { text: inter, date: new Date().toISOString().split('T')[0] }
                                : inter
                        ),
                    }
                    : p
            )
        );
        setEditingDateId(`${id}-${index}`);
    };

    const handleInteractionDateChange = (id, index, newDate) => {
        setPeople((prev) =>
            prev.map((p) =>
                p.id === id
                    ? {
                        ...p,
                        interactions: p.interactions.map((inter, i) =>
                            i === index
                                ? { ...inter, date: newDate }
                                : inter
                        ),
                    }
                    : p
            )
        );
        setEditingDateId(null);

        // Check if date actually changed and show toast
        const key = `${id}-interactions.${index}.date`;
        const originalValue = originalValues[key];
        if (originalValue !== undefined && originalValue !== newDate) {
            const person = people.find(p => p.id === id);
            if (person) {
                showToast(`Updated interaction date for ${person.name}`, 'success');
            }
        }

        // Clean up stored original value
        setOriginalValues(prev => {
            const newValues = { ...prev };
            delete newValues[key];
            return newValues;
        });
    };

    const handleInteractionRemove = (id, index) => {
        setPeople((prev) =>
            prev.map((p) =>
                p.id === id
                    ? {
                        ...p,
                        interactions: p.interactions.filter((_, i) => i !== index),
                    }
                    : p
            )
        );
    };

    const handleDeletePerson = (personToDelete) => {
        // Save undo state before deletion
        saveUndoState('delete', personToDelete.id, null, personToDelete.name, people);

        setPeople(people.filter((p) => p.id !== personToDelete.id));
        showToast(`Deleted ${personToDelete.name} from your network`, 'error');
    };

    const handleBatchDelete = () => {
        if (selectedCount === 0) return;

        // Save undo state for batch delete
        const selectedPersonsData = selectedPeople.map(person => ({
            id: person.id,
            name: person.name,
            data: person
        }));

        // Save a batch undo state
        saveUndoState('batchDelete', null, null, `${selectedCount} people`, people);

        // Remove selected people
        setPeople(prev => prev.filter(person => !isSelected(person.id)));

        // Show toast and clear selection
        showToast(`Deleted ${selectedCount} ${selectedCount === 1 ? 'person' : 'people'} from your network`, 'error');
        clearSelection();
    };

    return (
        <>
            {/* Search and Filter Interface */}
            <div className="mb-6 space-y-8">
                {/* Global Search */}
                <div className="flex items-center gap-4">
                    <GlobalSearch
                        value={globalSearch}
                        onChange={setGlobalSearch}
                        placeholder="Search across all fields..."
                    />
                    <div className="text-sm text-gray-600">
                        {filteredPeople.length} of {people.length} people
                    </div>
                </div>

                {/* Filter Presets */}
                <FilterPresets
                    globalSearch={globalSearch}
                    columnFilters={columnFilters}
                    onLoadPreset={handleLoadPreset}
                    hasActiveFilters={hasActiveFilters}
                />

                {/* Column Filters */}
                <ColumnFilters
                    columnFilters={columnFilters}
                    updateColumnFilter={updateColumnFilter}
                    updateDateRangeFilter={updateDateRangeFilter}
                    clearFilter={clearFilter}
                    getUniqueValues={getUniqueValues}
                    isVisible={showColumnFilters}
                    onToggle={() => setShowColumnFilters(!showColumnFilters)}
                />

                {/* Filter Status Bar */}
                <FilterStatusBar
                    globalSearch={globalSearch}
                    columnFilters={columnFilters}
                    hasActiveFilters={hasActiveFilters}
                    filteredCount={filteredPeople.length}
                    totalCount={people.length}
                    clearAllFilters={clearAllFilters}
                    clearFilter={clearFilter}
                    updateColumnFilter={updateColumnFilter}
                />
            </div>

            <BatchActionsBar
                selectedCount={selectedCount}
                onBatchDelete={handleBatchDelete}
                onClearSelection={clearSelection}
            />

            {/* Column Controls - only show reset button if columns have been reordered */}
            {!isDefaultColumnOrder && (
                <div className="mb-4 flex items-center justify-end">
                    <button
                        onClick={() => {
                            resetColumnOrder();
                            showToast('Column order reset to default', 'success');
                        }}
                        className="text-sm text-blue-600 hover:text-blue-800 underline"
                    >
                        Reset to Default Order
                    </button>
                </div>
            )}

            {/* Column Reorder Notification */}
            <ColumnReorderNotification
                show={hasReorderedThisSession && !isDefaultColumnOrder}
            />

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <table className="w-full table-auto border border-black mb-4">
                    <thead>
                        <SortableContext
                            items={columnOrder.map(col => col.id)}
                            strategy={horizontalListSortingStrategy}
                        >
                            <tr className="bg-blue-100">
                                {columnOrder.map((column) => (
                                    <DraggableTableHeader
                                        key={column.id}
                                        column={column}
                                        currentSort={sortBy}
                                        onSortChange={setSortBy}
                                        // Selection props (for select column)
                                        checked={isAllSelected}
                                        indeterminate={isIndeterminate}
                                        onChange={toggleSelectAll}
                                    />
                                ))}
                            </tr>
                        </SortableContext>
                    </thead>
                    <tbody>
                        {sortedPeople.map((person, index) => (
                            <DynamicPersonRow
                                key={person.id}
                                person={person}
                                index={index}
                                people={people}
                                selectedPersonId={selectedPersonId}
                                setSelectedPersonId={setSelectedPersonId}
                                editingField={editingField}
                                handleInlineEdit={(personId, field) =>
                                    handleInlineEdit(personId, field, handleFieldFocus, people)
                                }
                                handleInlineBlur={(e, id, fieldName) =>
                                    handleInlineBlur(e, id, fieldName, handleEditBlur)
                                }
                                handleEditChange={handleEditChange}
                                handleFieldFocus={handleFieldFocus}
                                handleDeletePerson={handleDeletePerson}
                                showToast={showToast}
                                // Selection props
                                isSelected={isSelected(person.id)}
                                onToggleSelect={() => toggleSelectPerson(person.id)}
                                // Person details props
                                handleInteractionChange={handleInteractionChange}
                                handleInteractionAdd={handleInteractionAdd}
                                handleInteractionRemove={handleInteractionRemove}
                                handleDateEditStart={handleDateEditStart}
                                editingDateId={editingDateId}
                                handleInteractionDateChange={handleInteractionDateChange}
                                setEditingDateId={setEditingDateId}
                                originalValues={originalValues}
                                setOriginalValues={setOriginalValues}
                                // Column ordering
                                columnOrder={columnOrder}
                            />
                        ))}
                    </tbody>
                </table>
            </DndContext>

            {/* No results message */}
            {sortedPeople.length === 0 && people.length > 0 && (
                <div className="text-center py-8 text-gray-500">
                    <p className="text-lg">No people match your current filters</p>
                    <button
                        onClick={clearAllFilters}
                        className="mt-2 text-blue-600 hover:text-blue-800 underline"
                    >
                        Clear all filters
                    </button>
                </div>
            )}
        </>
    );
} 
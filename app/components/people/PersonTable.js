import { useState } from 'react';
import SortableHeader from '../ui/SortableHeader';
import ConnectionStrengthTooltip from '../ui/ConnectionStrengthTooltip';
import SelectionCheckbox from '../ui/SelectionCheckbox';
import BatchActionsBar from '../ui/BatchActionsBar';
import PersonRow from './PersonRow';
import { usePeopleSort } from '../../hooks/people/usePeopleSort';
import { usePersonEditor } from '../../hooks/people/usePersonEditor';
import { useBatchSelection } from '../../hooks/people/useBatchSelection';

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
    const { sortBy, setSortBy, sortedPeople } = usePeopleSort(people);
    const {
        editingField,
        editingDateId,
        setEditingDateId,
        handleInlineEdit,
        handleInlineBlur
    } = usePersonEditor();

    const {
        selectedCount,
        isAllSelected,
        isIndeterminate,
        selectedPeople,
        toggleSelectAll,
        toggleSelectPerson,
        clearSelection,
        isSelected
    } = useBatchSelection(people);

    const handleEditChange = (e, id) => {
        const { name, value } = e.target;
        setPeople((prev) =>
            prev.map((p) =>
                p.id === id
                    ? name.startsWith("connection.")
                        ? {
                            ...p,
                            connection: {
                                ...p.connection,
                                [name.split(".")[1]]: value,
                            },
                        }
                        : { ...p, [name]: value }
                    : p
            )
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
            <BatchActionsBar
                selectedCount={selectedCount}
                onBatchDelete={handleBatchDelete}
                onClearSelection={clearSelection}
            />

            <table className="w-full table-auto border border-black mb-4">
                <thead>
                    <tr className="bg-blue-100">
                        <th className="text-left p-2 border-b w-12">
                            <SelectionCheckbox
                                checked={isAllSelected}
                                indeterminate={isIndeterminate}
                                onChange={toggleSelectAll}
                                aria-label="Select all people"
                            />
                        </th>
                        <SortableHeader
                            sortKey="name"
                            currentSort={sortBy}
                            onSortChange={setSortBy}
                        >
                            Name
                        </SortableHeader>
                        <th className="text-left p-2 border-b">Company</th>
                        <th className="text-left p-2 border-b">Role</th>
                        <SortableHeader
                            sortKey="date"
                            currentSort={sortBy}
                            onSortChange={setSortBy}
                        >
                            Date Met
                        </SortableHeader>
                        <th className="text-left p-2 border-b">
                            Connection Strength
                            <ConnectionStrengthTooltip />
                        </th>
                        <th className="text-left p-2 border-b">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedPeople.map((person, index) => (
                        <PersonRow
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
                        />
                    ))}
                </tbody>
            </table>
        </>
    );
} 
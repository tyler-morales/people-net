import { useState } from 'react';

export function usePersonEditor() {
    const [editingField, setEditingField] = useState(null);
    const [editingDateId, setEditingDateId] = useState(null);

    // Helper to get nested property value
    const getFieldValue = (person, fieldName) => {
        if (fieldName.startsWith('connection.')) {
            const connectionField = fieldName.split('.')[1];
            return person.connection?.[connectionField] || '';
        }
        if (fieldName.startsWith('interactions.')) {
            const parts = fieldName.split('.');
            const index = parseInt(parts[1]);
            const subField = parts[2];
            const interaction = person.interactions[index];
            if (subField === 'text') {
                return typeof interaction === 'string' ? interaction : (interaction?.text || '');
            }
            if (subField === 'date') {
                return typeof interaction === 'string' ? '' : (interaction?.date || '');
            }
        }
        return person[fieldName] || '';
    };

    const handleInlineEdit = (personId, field, handleFieldFocus, people) => {
        const person = people.find(p => p.id === personId);
        const currentValue = getFieldValue(person, field);

        // Save undo state and track original value when starting to edit
        handleFieldFocus(personId, field, currentValue);
        setEditingField(`${personId}-${field}`);
    };

    const handleInlineBlur = (e, id, fieldName, handleEditBlur) => {
        setEditingField(null);
        if (e && id && fieldName) {
            handleEditBlur(e, id, fieldName);
        }
    };

    return {
        editingField,
        setEditingField,
        editingDateId,
        setEditingDateId,
        getFieldValue,
        handleInlineEdit,
        handleInlineBlur
    };
} 
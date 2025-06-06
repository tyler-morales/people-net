export default function InteractionsList({
    person,
    onInteractionChange,
    onInteractionAdd,
    onInteractionRemove,
    onDateEditStart,
    editingDateId,
    onDateChange,
    onDateEditEnd,
    handleFieldFocus,
    handleInlineBlur,
    showToast,
    originalValues,
    setOriginalValues
}) {
    const handleInteractionDateChange = (index, newDate) => {
        onDateChange(person.id, index, newDate);
        onDateEditEnd();

        // Check if date actually changed and show toast
        const key = `${person.id}-interactions.${index}.date`;
        const originalValue = originalValues[key];
        if (originalValue !== undefined && originalValue !== newDate) {
            showToast(`Updated interaction date for ${person.name}`, 'success');
        }

        // Clean up stored original value
        setOriginalValues(prev => {
            const newValues = { ...prev };
            delete newValues[key];
            return newValues;
        });
    };

    const handleDateEditStart = (index) => {
        // Track original date value and save undo state
        const interaction = person.interactions[index];
        const originalDate = typeof interaction === 'string' ? '' : (interaction.date || '');
        const fieldName = `interactions.${index}.date`;

        handleFieldFocus(person.id, fieldName, originalDate);
        onDateEditStart(person.id, index);
    };

    return (
        <div className="mt-6">
            <h4 className="font-semibold text-lg mb-3">Interactions</h4>
            <ul className="space-y-2">
                {person.interactions.map((interaction, i) => (
                    <li key={i} className="flex items-center gap-3 p-3 bg-gray-100 rounded-lg">
                        <input
                            type="text"
                            value={typeof interaction === 'string' ? interaction : interaction.text}
                            onFocus={(e) => handleFieldFocus(person.id, `interactions.${i}.text`, e.target.value)}
                            onChange={(e) => onInteractionChange(person.id, i, e.target.value)}
                            onBlur={(e) => handleInlineBlur(e, person.id, `interactions.${i}.text`)}
                            className="flex-1 border border-gray-300 rounded px-3 py-2"
                            placeholder="Enter interaction"
                        />
                        {editingDateId === `${person.id}-${i}` ? (
                            <input
                                type="date"
                                value={typeof interaction === 'string' ? new Date().toISOString().split('T')[0] : (interaction.date || new Date().toISOString().split('T')[0])}
                                onFocus={(e) => handleFieldFocus(person.id, `interactions.${i}.date`, e.target.value)}
                                onChange={(e) => handleInteractionDateChange(i, e.target.value)}
                                onBlur={() => onDateEditEnd()}
                                className="border border-gray-300 rounded px-3 py-2"
                                autoFocus
                            />
                        ) : (
                            <button
                                className="text-sm text-gray-600 hover:text-blue-600 hover:underline min-w-max cursor-pointer"
                                onClick={() => handleDateEditStart(i)}
                                title="Click to edit date"
                            >
                                {typeof interaction === 'string' ? 'Add date' : (interaction.date || 'Add date')}
                            </button>
                        )}
                        <button
                            onClick={() => onInteractionRemove(person.id, i)}
                            className="text-red-600 hover:text-red-800 px-2 py-1 rounded cursor-pointer"
                            title="Remove interaction"
                        >
                            ×
                        </button>
                    </li>
                ))}
            </ul>
            <button
                onClick={() => onInteractionAdd(person.id)}
                className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
            >
                + Add New Interaction
            </button>
        </div>
    );
} 
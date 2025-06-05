'use client'
import { Fragment, useState } from 'react';
import { strengthToNumber, numberToStrength, getStrengthLabel } from '../lib/connection-utils';

export default function TableView({
    people,
    setPeople,
    showToast,
    saveUndoState,
    handleFieldFocus,
    originalValues,
    setOriginalValues
}) {
    const [selectedPersonId, setSelectedPersonId] = useState(null);
    const [editingDateId, setEditingDateId] = useState(null);
    const [editingField, setEditingField] = useState(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [sortBy, setSortBy] = useState('none'); // 'none', 'name-asc', 'name-desc', 'date-asc', 'date-desc'

    const [newPerson, setNewPerson] = useState({
        name: '',
        company: '',
        team: '',
        role: '',
        location: '',
        workHours: '',
        notes: '',
        dateMet: new Date().toISOString().split('T')[0],
        connection: {
            source: 'you',
            type: 'collaborated',
            strength: 'casual',
            notes: '',
            introducedBy: '',
            introducedByName: '',
            introducedByType: 'direct'
        },
        interactions: []
    });

    // Sorting function
    const getSortedPeople = () => {
        if (sortBy === 'none') return people;

        const sorted = [...people].sort((a, b) => {
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

        return sorted;
    };

    const sortedPeople = getSortedPeople();

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

    const handleNewPersonChange = (e) => {
        const { name, value } = e.target;
        if (name.startsWith('connection.')) {
            setNewPerson(prev => ({
                ...prev,
                connection: {
                    ...prev.connection,
                    [name.split('.')[1]]: value
                }
            }));
        } else {
            setNewPerson(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleAddPerson = (e) => {
        e.preventDefault();
        if (!newPerson.name.trim()) return;

        const personToAdd = {
            ...newPerson,
            id: newPerson.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
            interactions: newPerson.interactions.length > 0 ? newPerson.interactions : [
                { text: '', date: newPerson.dateMet }
            ]
        };

        // Save undo state before adding
        saveUndoState('add', personToAdd.id, null, newPerson.name, people);

        setPeople(prev => [...prev, personToAdd]);

        // Show success toast
        showToast(`Added ${newPerson.name} to your network!`, 'success');

        // Reset form
        setNewPerson({
            name: '',
            company: '',
            team: '',
            role: '',
            location: '',
            workHours: '',
            notes: '',
            dateMet: new Date().toISOString().split('T')[0],
            connection: {
                source: 'you',
                type: 'collaborated',
                strength: 'casual',
                notes: '',
                introducedBy: null,
                introducedByName: '',
                introducedByType: 'direct'
            },
            interactions: []
        });
        setShowAddForm(false);
    };

    const handleInlineEdit = (personId, field) => {
        const person = people.find(p => p.id === personId);
        const currentValue = getFieldValue(person, field);

        // Save undo state and track original value when starting to edit
        handleFieldFocus(personId, field, currentValue);
        setEditingField(`${personId}-${field}`);
    };

    const handleInlineBlur = (e, id, fieldName) => {
        setEditingField(null);
        if (e && id && fieldName) {
            handleEditBlur(e, id, fieldName);
        }
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

    return (
        <>
            {/* Add Person Button & Form */}
            <div className="mb-6">
                {!showAddForm ? (
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium cursor-pointer"
                    >
                        + Add New Person
                    </button>
                ) : (
                    <div className="bg-gray-50 border border-gray-300 rounded-lg p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Add New Person</h3>
                            <button
                                onClick={() => setShowAddForm(false)}
                                className="text-gray-500 hover:text-gray-700 text-xl cursor-pointer"
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleAddPerson} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Basic Information */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Name *
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={newPerson.name}
                                        onChange={handleNewPersonChange}
                                        required
                                        className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                                        placeholder="Enter full name"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Company
                                    </label>
                                    <input
                                        type="text"
                                        name="company"
                                        value={newPerson.company}
                                        onChange={handleNewPersonChange}
                                        className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                                        placeholder="Enter company"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Team
                                    </label>
                                    <input
                                        type="text"
                                        name="team"
                                        value={newPerson.team}
                                        onChange={handleNewPersonChange}
                                        className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                                        placeholder="Enter team"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Role
                                    </label>
                                    <input
                                        type="text"
                                        name="role"
                                        value={newPerson.role}
                                        onChange={handleNewPersonChange}
                                        className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                                        placeholder="Enter role"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Location
                                    </label>
                                    <input
                                        type="text"
                                        name="location"
                                        value={newPerson.location}
                                        onChange={handleNewPersonChange}
                                        className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                                        placeholder="Enter location"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Work Hours
                                    </label>
                                    <input
                                        type="text"
                                        name="workHours"
                                        value={newPerson.workHours}
                                        onChange={handleNewPersonChange}
                                        className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                                        placeholder="e.g., 9am-5pm EST"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Date Met
                                    </label>
                                    <input
                                        type="date"
                                        name="dateMet"
                                        value={newPerson.dateMet}
                                        onChange={handleNewPersonChange}
                                        className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Connection Strength
                                    </label>
                                    <div className="space-y-2">
                                        <input
                                            type="range"
                                            name="connection.strength"
                                            min="1"
                                            max="6"
                                            value={strengthToNumber(newPerson.connection.strength)}
                                            onChange={(e) => {
                                                const strengthName = numberToStrength(parseInt(e.target.value));
                                                handleNewPersonChange({
                                                    target: { name: 'connection.strength', value: strengthName }
                                                });
                                            }}
                                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                                            style={{
                                                background: `linear-gradient(to right, #6366f1 0%, #3b82f6 20%, #10b981 40%, #f59e0b 60%, #f97316 80%, #ef4444 100%)`
                                            }}
                                        />
                                        <div className="text-center text-sm font-medium text-gray-700">
                                            {getStrengthLabel(newPerson.connection.strength)}
                                        </div>
                                        <div className="flex justify-between text-xs text-gray-500">
                                            <span>Fleeting</span>
                                            <span>Acquaintance</span>
                                            <span>Casual</span>
                                            <span>Working</span>
                                            <span>Strong</span>
                                            <span>Core</span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        How do you know them?
                                    </label>
                                    <div className="space-y-2">
                                        <div>
                                            <label className="flex items-center">
                                                <input
                                                    type="radio"
                                                    name="connection.introducedByType"
                                                    value="direct"
                                                    checked={newPerson.connection.introducedByType === 'direct'}
                                                    onChange={handleNewPersonChange}
                                                    className="mr-2"
                                                />
                                                I know them directly
                                            </label>
                                        </div>

                                        <div>
                                            <label className="flex items-center">
                                                <input
                                                    type="radio"
                                                    name="connection.introducedByType"
                                                    value="existing"
                                                    checked={newPerson.connection.introducedByType === 'existing'}
                                                    onChange={handleNewPersonChange}
                                                    className="mr-2"
                                                />
                                                Through someone in my network
                                            </label>
                                            {newPerson.connection.introducedByType === 'existing' && (
                                                <select
                                                    name="connection.introducedBy"
                                                    value={newPerson.connection.introducedBy || ''}
                                                    onChange={handleNewPersonChange}
                                                    className="mt-1 w-full border border-gray-300 rounded px-3 py-2"
                                                >
                                                    <option value="">Select person...</option>
                                                    {people.map(person => (
                                                        <option key={person.id} value={person.id}>
                                                            {person.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            )}
                                        </div>

                                        <div>
                                            <label className="flex items-center">
                                                <input
                                                    type="radio"
                                                    name="connection.introducedByType"
                                                    value="external"
                                                    checked={newPerson.connection.introducedByType === 'external'}
                                                    onChange={handleNewPersonChange}
                                                    className="mr-2"
                                                />
                                                Through someone else
                                            </label>
                                            {newPerson.connection.introducedByType === 'external' && (
                                                <input
                                                    type="text"
                                                    name="connection.introducedByName"
                                                    value={newPerson.connection.introducedByName || ''}
                                                    onChange={handleNewPersonChange}
                                                    placeholder="Enter their name..."
                                                    className="mt-1 w-full border border-gray-300 rounded px-3 py-2"
                                                />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Connection Details */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Connection Type
                                    </label>
                                    <select
                                        name="connection.type"
                                        value={newPerson.connection.type}
                                        onChange={handleNewPersonChange}
                                        className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                                    >
                                        <option value="collaborated">Collaborated</option>
                                        <option value="mentored">Mentored</option>
                                        <option value="coordinated">Coordinated</option>
                                        <option value="reviewed_code">Reviewed Code</option>
                                        <option value="led_meeting">Led Meeting</option>
                                        <option value="inspired_me">Inspired Me</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Connection Notes
                                    </label>
                                    <textarea
                                        name="connection.notes"
                                        value={newPerson.connection.notes}
                                        onChange={handleNewPersonChange}
                                        rows="2"
                                        className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                                        placeholder="Describe how you connected..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Additional Notes
                                    </label>
                                    <textarea
                                        name="notes"
                                        value={newPerson.notes}
                                        onChange={handleNewPersonChange}
                                        rows="2"
                                        className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                                        placeholder="Any additional information..."
                                    />
                                </div>
                            </div>

                            {/* Form Actions */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="submit"
                                    className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded font-medium cursor-pointer"
                                >
                                    Add Person
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowAddForm(false)}
                                    className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded font-medium cursor-pointer"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>

            <table className="w-full table-auto border border-black mb-4">
                <thead>
                    <tr className="bg-blue-100">
                        <th className="text-left p-2 border-b">
                            <button
                                onClick={() => {
                                    if (sortBy === 'name-asc') {
                                        setSortBy('name-desc');
                                    } else {
                                        setSortBy('name-asc');
                                    }
                                }}
                                className="flex items-center gap-1 hover:text-blue-700 cursor-pointer"
                            >
                                Name
                                {sortBy === 'name-asc' && <span className="text-blue-600">↑</span>}
                                {sortBy === 'name-desc' && <span className="text-blue-600">↓</span>}
                                {!sortBy.startsWith('name') && <span className="text-gray-400">↕</span>}
                            </button>
                        </th>
                        <th className="text-left p-2 border-b">Company</th>
                        <th className="text-left p-2 border-b">Role</th>
                        <th className="text-left p-2 border-b">
                            <button
                                onClick={() => {
                                    if (sortBy === 'date-asc') {
                                        setSortBy('date-desc');
                                    } else {
                                        setSortBy('date-asc');
                                    }
                                }}
                                className="flex items-center gap-1 hover:text-blue-700 cursor-pointer"
                            >
                                Date Met
                                {sortBy === 'date-asc' && <span className="text-blue-600">↑</span>}
                                {sortBy === 'date-desc' && <span className="text-blue-600">↓</span>}
                                {!sortBy.startsWith('date') && <span className="text-gray-400">↕</span>}
                            </button>
                        </th>
                        <th className="text-left p-2 border-b">
                            Connection Strength
                            <button
                                className="ml-2 cursor-pointer text-sm rounded-full bg-blue-400 text-white w-[20px] h-[20px]"
                                popoverTarget="strength-tooltip"
                                popoverTargetAction="toggle"
                                title="Click for strength definitions"
                                style={{ anchorName: '--strength-button' }}
                            >
                                <span className="inline-block" style={{ marginRight: '2px' }}>?</span>
                            </button>
                        </th>
                        <th className="text-left p-2 border-b">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedPeople.map((person, index) => (
                        <Fragment key={person.id}>
                            <tr className={`border-t ${index % 2 === 0 ? 'bg-white' : 'bg-gray-100'}`}>
                                <td className="p-2 border-b">
                                    {editingField === `${person.id}-name` ? (
                                        <input
                                            name="name"
                                            value={person.name}
                                            onFocus={(e) => handleFieldFocus(person.id, 'name', e.target.value)}
                                            onChange={(e) => handleEditChange(e, person.id)}
                                            onBlur={(e) => handleInlineBlur(e, person.id, 'name')}
                                            className="border p-1 w-full rounded"
                                            autoFocus
                                        />
                                    ) : (
                                        <div
                                            className="border border-transparent p-1 rounded cursor-text hover:bg-gray-100"
                                            onClick={() => handleInlineEdit(person.id, 'name')}
                                            onFocus={(e) => handleInlineEdit(person.id, 'name')}
                                            tabIndex="0"
                                            title="Edit name"
                                        >
                                            {person.name}
                                        </div>
                                    )}
                                </td>
                                <td className="p-2 border-b">
                                    {editingField === `${person.id}-company` ? (
                                        <input
                                            name="company"
                                            value={person.company}
                                            onFocus={(e) => handleFieldFocus(person.id, 'company', e.target.value)}
                                            onChange={(e) => handleEditChange(e, person.id)}
                                            onBlur={(e) => handleInlineBlur(e, person.id, 'company')}
                                            className="border p-1 w-full rounded"
                                            autoFocus
                                        />
                                    ) : (
                                        <div
                                            className="border border-transparent p-1 rounded cursor-text hover:bg-gray-100"
                                            onClick={() => handleInlineEdit(person.id, 'company')}
                                            onFocus={(e) => handleInlineEdit(person.id, 'company')}
                                            tabIndex="0"
                                            title="Edit company"
                                        >
                                            {person.company}
                                        </div>
                                    )}
                                </td>
                                <td className="p-2 border-b">
                                    {editingField === `${person.id}-role` ? (
                                        <input
                                            name="role"
                                            value={person.role}
                                            onFocus={(e) => handleFieldFocus(person.id, 'role', e.target.value)}
                                            onChange={(e) => handleEditChange(e, person.id)}
                                            onBlur={(e) => handleInlineBlur(e, person.id, 'role')}
                                            className="border p-1 w-full rounded"
                                            autoFocus
                                        />
                                    ) : (
                                        <div
                                            className="border border-transparent p-1 rounded cursor-text hover:bg-blue-50"
                                            onClick={() => handleInlineEdit(person.id, 'role')}
                                            onFocus={(e) => handleInlineEdit(person.id, 'role')}
                                            tabIndex="0"
                                            title="Edit role"
                                        >
                                            {person.role}
                                        </div>
                                    )}
                                </td>
                                <td className="p-2 border-b">
                                    {editingField === `${person.id}-dateMet` ? (
                                        <input
                                            type="date"
                                            name="dateMet"
                                            value={person.dateMet || ''}
                                            onFocus={(e) => handleFieldFocus(person.id, 'dateMet', e.target.value)}
                                            onChange={(e) => handleEditChange(e, person.id)}
                                            onBlur={(e) => handleInlineBlur(e, person.id, 'dateMet')}
                                            className="border p-1 w-full rounded"
                                            autoFocus
                                        />
                                    ) : (
                                        <div
                                            className="border border-transparent p-1 rounded cursor-text hover:bg-gray-100"
                                            onClick={() => handleInlineEdit(person.id, 'dateMet')}
                                            onFocus={(e) => handleInlineEdit(person.id, 'dateMet')}
                                            tabIndex="0"
                                            title="Edit date met"
                                        >
                                            {person.dateMet ? new Date(person.dateMet).toLocaleDateString() : 'Add date met'}
                                        </div>
                                    )}
                                </td>
                                <td className="p-2 border-b">
                                    <select
                                        name="connection.strength"
                                        value={person.connection?.strength}
                                        onFocus={(e) => handleFieldFocus(person.id, 'connection.strength', e.target.value)}
                                        onChange={(e) => {
                                            handleEditChange(e, person.id);
                                            showToast(`Updated connection strength for ${person.name}`, 'success');
                                        }}
                                        className="border p-1 w-full rounded bg-white"
                                    >
                                        <option value="fleeting">Fleeting (1)</option>
                                        <option value="acquaintance">Acquaintance (2)</option>
                                        <option value="casual">Casual (3)</option>
                                        <option value="working">Working (4)</option>
                                        <option value="strong">Strong (5)</option>
                                        <option value="core">Core (6)</option>
                                    </select>
                                </td>
                                <td className="p-2 border-b">
                                    <button className="text-purple-500 cursor-pointer" onClick={() => setSelectedPersonId(selectedPersonId === person.id ? null : person.id)}>
                                        {selectedPersonId === person.id ? 'Close' : 'View'}
                                    </button>
                                    <button className="text-red-600 ml-2 cursor-pointer" onClick={() => handleDeletePerson(person)}>
                                        Delete
                                    </button>
                                </td>
                            </tr>
                            {selectedPersonId === person.id && (
                                <tr className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                                    <td colSpan={6} className="p-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Left Column - Basic Information */}
                                            <div className="space-y-4">
                                                <h4 className="font-semibold text-lg mb-3">Basic Information</h4>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Team</label>
                                                    <input
                                                        name="team"
                                                        value={person.team || ''}
                                                        onFocus={(e) => handleFieldFocus(person.id, 'team', e.target.value)}
                                                        onChange={(e) => handleEditChange(e, person.id)}
                                                        onBlur={(e) => handleInlineBlur(e, person.id, 'team')}
                                                        className="w-full border border-gray-300 rounded px-3 py-2"
                                                        placeholder="Enter team"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                                                    <input
                                                        name="location"
                                                        value={person.location || ''}
                                                        onFocus={(e) => handleFieldFocus(person.id, 'location', e.target.value)}
                                                        onChange={(e) => handleEditChange(e, person.id)}
                                                        onBlur={(e) => handleInlineBlur(e, person.id, 'location')}
                                                        className="w-full border border-gray-300 rounded px-3 py-2"
                                                        placeholder="Enter location"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Work Hours</label>
                                                    <input
                                                        name="workHours"
                                                        value={person.workHours || ''}
                                                        onFocus={(e) => handleFieldFocus(person.id, 'workHours', e.target.value)}
                                                        onChange={(e) => handleEditChange(e, person.id)}
                                                        onBlur={(e) => handleInlineBlur(e, person.id, 'workHours')}
                                                        className="w-full border border-gray-300 rounded px-3 py-2"
                                                        placeholder="e.g., 9am-5pm EST"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                                                    <textarea
                                                        name="notes"
                                                        value={person.notes || ''}
                                                        onFocus={(e) => handleFieldFocus(person.id, 'notes', e.target.value)}
                                                        onChange={(e) => handleEditChange(e, person.id)}
                                                        onBlur={(e) => handleInlineBlur(e, person.id, 'notes')}
                                                        rows="3"
                                                        className="w-full border border-gray-300 rounded px-3 py-2"
                                                        placeholder="Additional notes..."
                                                    />
                                                </div>
                                            </div>

                                            {/* Right Column - Connection Information */}
                                            <div className="space-y-4">
                                                <h4 className="font-semibold text-lg mb-3">Connection Details</h4>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Connection Type</label>
                                                    <select
                                                        name="connection.type"
                                                        value={person.connection?.type || 'collaborated'}
                                                        onFocus={(e) => handleFieldFocus(person.id, 'connection.type', e.target.value)}
                                                        onChange={(e) => handleEditChange(e, person.id)}
                                                        onBlur={(e) => handleInlineBlur(e, person.id, 'connection.type')}
                                                        className="w-full border border-gray-300 rounded px-3 py-2"
                                                    >
                                                        <option value="collaborated">Collaborated</option>
                                                        <option value="mentored">Mentored</option>
                                                        <option value="coordinated">Coordinated</option>
                                                        <option value="reviewed_code">Reviewed Code</option>
                                                        <option value="led_meeting">Led Meeting</option>
                                                        <option value="inspired_me">Inspired Me</option>
                                                    </select>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">How do you know them?</label>
                                                    <div className="space-y-2">
                                                        <div>
                                                            <label className="flex items-center">
                                                                <input
                                                                    type="radio"
                                                                    name="connection.introducedByType"
                                                                    value="direct"
                                                                    checked={person.connection?.introducedByType === 'direct'}
                                                                    onFocus={() => handleFieldFocus(person.id, 'connection.introducedByType', person.connection?.introducedByType || 'direct')}
                                                                    onChange={(e) => handleEditChange(e, person.id)}
                                                                    onBlur={(e) => handleInlineBlur(e, person.id, 'connection.introducedByType')}
                                                                    className="mr-2"
                                                                />
                                                                I know them directly
                                                            </label>
                                                        </div>

                                                        <div>
                                                            <label className="flex items-center">
                                                                <input
                                                                    type="radio"
                                                                    name="connection.introducedByType"
                                                                    value="existing"
                                                                    checked={person.connection?.introducedByType === 'existing'}
                                                                    onFocus={() => handleFieldFocus(person.id, 'connection.introducedByType', person.connection?.introducedByType || 'direct')}
                                                                    onChange={(e) => handleEditChange(e, person.id)}
                                                                    onBlur={(e) => handleInlineBlur(e, person.id, 'connection.introducedByType')}
                                                                    className="mr-2"
                                                                />
                                                                Through someone in my network
                                                            </label>
                                                            {person.connection?.introducedByType === 'existing' && (
                                                                <select
                                                                    name="connection.introducedBy"
                                                                    value={person.connection?.introducedBy || ''}
                                                                    onFocus={(e) => handleFieldFocus(person.id, 'connection.introducedBy', e.target.value)}
                                                                    onChange={(e) => handleEditChange(e, person.id)}
                                                                    onBlur={(e) => handleInlineBlur(e, person.id, 'connection.introducedBy')}
                                                                    className="mt-1 w-full border border-gray-300 rounded px-3 py-2"
                                                                >
                                                                    <option value="">Select person...</option>
                                                                    {people.filter(p => p.id !== person.id).map(p => (
                                                                        <option key={p.id} value={p.id}>
                                                                            {p.name}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            )}
                                                        </div>

                                                        <div>
                                                            <label className="flex items-center">
                                                                <input
                                                                    type="radio"
                                                                    name="connection.introducedByType"
                                                                    value="external"
                                                                    checked={person.connection?.introducedByType === 'external'}
                                                                    onFocus={() => handleFieldFocus(person.id, 'connection.introducedByType', person.connection?.introducedByType || 'direct')}
                                                                    onChange={(e) => handleEditChange(e, person.id)}
                                                                    onBlur={(e) => handleInlineBlur(e, person.id, 'connection.introducedByType')}
                                                                    className="mr-2"
                                                                />
                                                                Through someone else
                                                            </label>
                                                            {person.connection?.introducedByType === 'external' && (
                                                                <input
                                                                    type="text"
                                                                    name="connection.introducedByName"
                                                                    value={person.connection?.introducedByName || ''}
                                                                    onFocus={(e) => handleFieldFocus(person.id, 'connection.introducedByName', e.target.value)}
                                                                    onChange={(e) => handleEditChange(e, person.id)}
                                                                    onBlur={(e) => handleInlineBlur(e, person.id, 'connection.introducedByName')}
                                                                    placeholder="Enter their name..."
                                                                    className="mt-1 w-full border border-gray-300 rounded px-3 py-2"
                                                                />
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Connection Notes</label>
                                                    <textarea
                                                        name="connection.notes"
                                                        value={person.connection?.notes || ''}
                                                        onFocus={(e) => handleFieldFocus(person.id, 'connection.notes', e.target.value)}
                                                        onChange={(e) => handleEditChange(e, person.id)}
                                                        onBlur={(e) => handleInlineBlur(e, person.id, 'connection.notes')}
                                                        rows="3"
                                                        className="w-full border border-gray-300 rounded px-3 py-2"
                                                        placeholder="Describe how you connected..."
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Interactions Section */}
                                        <div className="mt-6">
                                            <h4 className="font-semibold text-lg mb-3">Interactions</h4>
                                            <ul className="space-y-2">
                                                {person.interactions.map((interaction, i) => (
                                                    <li key={i} className="flex items-center gap-3 p-3 bg-gray-100 rounded-lg">
                                                        <input
                                                            type="text"
                                                            value={typeof interaction === 'string' ? interaction : interaction.text}
                                                            onFocus={(e) => handleFieldFocus(person.id, `interactions.${i}.text`, e.target.value)}
                                                            onChange={(e) => handleInteractionChange(person.id, i, e.target.value)}
                                                            onBlur={(e) => handleInlineBlur(e, person.id, `interactions.${i}.text`)}
                                                            className="flex-1 border border-gray-300 rounded px-3 py-2"
                                                            placeholder="Enter interaction"
                                                        />
                                                        {editingDateId === `${person.id}-${i}` ? (
                                                            <input
                                                                type="date"
                                                                value={typeof interaction === 'string' ? new Date().toISOString().split('T')[0] : (interaction.date || new Date().toISOString().split('T')[0])}
                                                                onFocus={(e) => handleFieldFocus(person.id, `interactions.${i}.date`, e.target.value)}
                                                                onChange={(e) => handleInteractionDateChange(person.id, i, e.target.value)}
                                                                onBlur={() => setEditingDateId(null)}
                                                                className="border border-gray-300 rounded px-3 py-2"
                                                                autoFocus
                                                            />
                                                        ) : (
                                                            <button
                                                                className="text-sm text-gray-600 hover:text-blue-600 hover:underline min-w-max cursor-pointer"
                                                                onClick={() => handleDateEditStart(person.id, i)}
                                                                title="Click to edit date"
                                                            >
                                                                {typeof interaction === 'string' ? 'Add date' : (interaction.date || 'Add date')}
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handleInteractionRemove(person.id, i)}
                                                            className="text-red-600 hover:text-red-800 px-2 py-1 rounded cursor-pointer"
                                                            title="Remove interaction"
                                                        >
                                                            ×
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                            <button
                                                onClick={() => handleInteractionAdd(person.id)}
                                                className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
                                            >
                                                + Add New Interaction
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </Fragment>
                    ))}
                </tbody>
            </table>

            {/* Connection Strength Legend */}
            <div
                id="strength-tooltip"
                popover="auto"
                className="bg-white border border-gray-300 rounded-lg shadow-lg p-4 w-96"
                style={{
                    positionAnchor: '--strength-button',
                    left: 'anchor(left)',
                    top: 'anchor(bottom)',
                    transform: 'translateX(-100%)',
                    marginTop: '8px'
                }}
            >
                <div className="mb-2 font-semibold">Relationship Strength Tiers</div>
                <div className="space-y-2 text-sm">
                    <div><strong>Fleeting (1):</strong> Brief interaction, no lasting impact</div>
                    <div><strong>Acquaintance (2):</strong> Light connection, you know <em>of</em> them</div>
                    <div><strong>Casual (3):</strong> Friendly or familiar, occasional conversations</div>
                    <div><strong>Working (4):</strong> Collaborated together on a project</div>
                    <div><strong>Strong (5):</strong> Meaningful shared history, solid trust</div>
                    <div><strong>Core (6):</strong> Foundational relationship, emotionally defining</div>
                </div>
            </div>
        </>
    );
} 
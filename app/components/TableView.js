'use client'
import { useState } from 'react';
import AddPersonForm from './people/AddPersonForm';
import PersonTable from './people/PersonTable';

export default function TableView({
    people,
    setPeople,
    showToast,
    saveUndoState,
    handleFieldFocus,
    originalValues,
    setOriginalValues
}) {
    const [showAddForm, setShowAddForm] = useState(false);
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
                    <AddPersonForm
                        newPerson={newPerson}
                        setNewPerson={setNewPerson}
                        onSubmit={handleAddPerson}
                        onCancel={() => setShowAddForm(false)}
                        people={people}
                    />
                )}
            </div>

            <PersonTable
                people={people}
                setPeople={setPeople}
                showToast={showToast}
                saveUndoState={saveUndoState}
                handleFieldFocus={handleFieldFocus}
                originalValues={originalValues}
                setOriginalValues={setOriginalValues}
            />
        </>
    );
} 
'use client'
import { useState } from 'react';
import AddPersonForm from './people/AddPersonForm';
import PersonTable from './people/PersonTable';
import { LiquidButton, LiquidCard } from './ui/LiquidGlass';

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
        organization: '',
        group: '',
        description: '',
        location: '',
        workHours: '',
        notes: '',
        dateMet: new Date().toISOString().split('T')[0],
        connection: {
            source: 'you',
            type: 'friend',
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
        console.log('Form submitted with data:', newPerson);

        if (!newPerson.name.trim()) {
            console.log('Form validation failed: name is empty');
            showToast('Please enter a name', 'error');
            return;
        }

        const personToAdd = {
            ...newPerson,
            id: newPerson.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
            interactions: newPerson.interactions.length > 0 ? newPerson.interactions : [
                { text: '', date: newPerson.dateMet }
            ]
        };

        console.log('Person to add:', personToAdd);

        // Save undo state before adding
        saveUndoState('add', personToAdd.id, null, newPerson.name, people);

        setPeople(prev => {
            const newPeople = [...prev, personToAdd];
            console.log('Updated people array:', newPeople);
            return newPeople;
        });

        // Show success toast
        showToast(`Added ${newPerson.name} to your network!`, 'success');

        // Reset form
        setNewPerson({
            name: '',
            organization: '',
            group: '',
            description: '',
            location: '',
            workHours: '',
            notes: '',
            dateMet: new Date().toISOString().split('T')[0],
            connection: {
                source: 'you',
                type: 'friend',
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
        <div className="space-y-liquid">
            {/* Add Person Button & Form */}
            <LiquidCard morphIn>
                {!showAddForm ? (
                    <div className="text-center">
                        <LiquidButton
                            onClick={() => setShowAddForm(true)}
                            variant="primary"
                            size="medium"
                            className="font-semibold text-lg px-8 py-4"
                        >
                            <span className="flex items-center gap-3">
                                <span className="text-2xl">✨</span>
                                Add New Contact
                            </span>
                        </LiquidButton>
                        <p className="mt-4 text-gray-600 dark:text-gray-400">
                            Build your network by adding friends, family, colleagues, and acquaintances
                        </p>
                    </div>
                ) : (
                    <AddPersonForm
                        newPerson={newPerson}
                        setNewPerson={setNewPerson}
                        onSubmit={handleAddPerson}
                        onCancel={() => setShowAddForm(false)}
                        people={people}
                    />
                )}
            </LiquidCard>

            <LiquidCard floating>
                <PersonTable
                    people={people}
                    setPeople={setPeople}
                    showToast={showToast}
                    saveUndoState={saveUndoState}
                    handleFieldFocus={handleFieldFocus}
                    originalValues={originalValues}
                    setOriginalValues={setOriginalValues}
                />
            </LiquidCard>
        </div>
    );
} 
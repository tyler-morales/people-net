'use client'
import { useState } from 'react';
import DynamicCityPicker from './ui/DynamicCityPicker';
import FormDropdown from './ui/FormDropdown';
import { initialPeople } from '../lib/people-data';

export default function UserProfileModal({ userProfile, people, onSave, onClose }) {
    const [name, setName] = useState(userProfile.name || 'You');
    const [role, setRole] = useState(userProfile.role || '');
    const [company, setCompany] = useState(userProfile.company || '');
    const [team, setTeam] = useState(userProfile.team || '');
    const [location, setLocation] = useState(userProfile.location || '');
    const [workHours, setWorkHours] = useState(userProfile.workHours || '');
    const [notes, setNotes] = useState(userProfile.notes || '');
    const [color, setColor] = useState(userProfile.color || '#3b82f6');

    // Helper function to get unique values for dropdowns
    const getUniqueValues = (field) => {
        // Combine current people data with initial people data
        const allPeople = [...people, ...initialPeople];
        const values = allPeople.map(person => person[field]).filter(Boolean);
        return [...new Set(values)].sort();
    };

    const handleSave = () => {
        onSave({
            name,
            role,
            company,
            team,
            location,
            workHours,
            notes,
            color
        });
        onClose();
    };

    const handleFieldChange = (e) => {
        const { name, value } = e.target;
        switch (name) {
            case 'name':
                setName(value);
                break;
            case 'role':
                setRole(value);
                break;
            case 'company':
                setCompany(value);
                break;
            case 'team':
                setTeam(value);
                break;
            case 'location':
                setLocation(value);
                break;
            case 'workHours':
                setWorkHours(value);
                break;
            case 'notes':
                setNotes(value);
                break;
        }
    };

    const handleKeyDown = (event) => {
        if (event.key === 'Escape') {
            onClose();
        } else if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
            handleSave();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
            <div
                className="bg-white rounded-lg p-6 w-[500px] max-h-[90vh] overflow-y-auto shadow-xl"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={handleKeyDown}
            >
                <h2 className="text-xl font-bold mb-4">✏️ Edit Your Profile</h2>

                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Your Name *
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={name}
                                onChange={handleFieldChange}
                                className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Your name"
                                autoFocus
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Your Role
                            </label>
                            <FormDropdown
                                name="role"
                                value={role}
                                onChange={handleFieldChange}
                                options={getUniqueValues('role')}
                                placeholder="Enter or select your role"
                                className="border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Your Company
                            </label>
                            <FormDropdown
                                name="company"
                                value={company}
                                onChange={handleFieldChange}
                                options={getUniqueValues('company')}
                                placeholder="Enter or select your company"
                                className="border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Your Team
                            </label>
                            <FormDropdown
                                name="team"
                                value={team}
                                onChange={handleFieldChange}
                                options={getUniqueValues('team')}
                                placeholder="Enter or select your team"
                                className="border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Your Location
                            </label>
                            <DynamicCityPicker
                                name="location"
                                value={location}
                                onChange={handleFieldChange}
                                placeholder="Search for a city..."
                                className="border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                showCountryInfo={true}
                                showPopulation={false}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Your Work Hours
                            </label>
                            <FormDropdown
                                name="workHours"
                                value={workHours}
                                onChange={handleFieldChange}
                                options={getUniqueValues('workHours')}
                                placeholder="Enter or select work hours"
                                className="border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            About You (Notes)
                        </label>
                        <textarea
                            name="notes"
                            value={notes}
                            onChange={handleFieldChange}
                            className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Add any notes about yourself..."
                            rows="3"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Node Color
                        </label>
                        <div className="flex gap-2">
                            {[
                                { color: '#3b82f6', name: 'Blue' },
                                { color: '#10b981', name: 'Green' },
                                { color: '#f59e0b', name: 'Yellow' },
                                { color: '#ef4444', name: 'Red' },
                                { color: '#8b5cf6', name: 'Purple' },
                                { color: '#06b6d4', name: 'Cyan' },
                            ].map(({ color: colorOption, name: colorName }) => (
                                <button
                                    key={colorOption}
                                    onClick={() => setColor(colorOption)}
                                    className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${color === colorOption ? 'border-gray-800 ring-2 ring-blue-500' : 'border-gray-300'
                                        }`}
                                    style={{ backgroundColor: colorOption }}
                                    title={colorName}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 mt-6">
                    <button
                        onClick={handleSave}
                        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors focus:ring-2 focus:ring-blue-500"
                    >
                        Save Changes
                    </button>
                    <button
                        onClick={onClose}
                        className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400 transition-colors"
                    >
                        Cancel
                    </button>
                </div>

                <div className="mt-3 text-xs text-gray-500 text-center">
                    Press <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Esc</kbd> to cancel •
                    <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs mx-1">Ctrl+Enter</kbd> to save
                </div>
            </div>
        </div>
    );
} 
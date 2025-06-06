import InteractionsList from './InteractionsList';
import FormDropdown from '../ui/FormDropdown';
import DynamicCityPicker from '../ui/DynamicCityPicker';
import { commonCities } from '../../lib/city-data';

export default function PersonDetails({
    person,
    people,
    handleEditChange,
    handleFieldFocus,
    handleInlineBlur,
    handleInteractionChange,
    handleInteractionAdd,
    handleInteractionRemove,
    handleDateEditStart,
    editingDateId,
    handleInteractionDateChange,
    setEditingDateId,
    originalValues,
    setOriginalValues,
    showToast
}) {
    // Helper function to get unique values for dropdowns
    const getUniqueValues = (field) => {
        const values = people.map(person => person[field]).filter(Boolean);
        return [...new Set(values)].sort();
    };

    // Enhanced location options - combine existing data with common cities
    const getLocationOptions = () => {
        const existingLocations = getUniqueValues('location');
        const allLocations = [...new Set([...existingLocations, ...commonCities])];
        return allLocations.sort();
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column - Basic Information */}
            <div className="space-y-4">
                <h4 className="font-semibold text-lg mb-3">Basic Information</h4>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Team</label>
                    <FormDropdown
                        name="team"
                        value={person.team || ''}
                        onChange={(e) => handleEditChange(e, person.id)}
                        onFocus={(e) => handleFieldFocus(person.id, 'team', e.target.value)}
                        onBlur={(e) => handleInlineBlur(e, person.id, 'team')}
                        options={getUniqueValues('team')}
                        placeholder="Enter or select team"
                        className="w-full border border-gray-300 rounded px-3 py-2"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                    <FormDropdown
                        name="role"
                        value={person.role || ''}
                        onChange={(e) => handleEditChange(e, person.id)}
                        onFocus={(e) => handleFieldFocus(person.id, 'role', e.target.value)}
                        onBlur={(e) => handleInlineBlur(e, person.id, 'role')}
                        options={getUniqueValues('role')}
                        placeholder="Enter or select role"
                        className="w-full border border-gray-300 rounded px-3 py-2"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                    <FormDropdown
                        name="company"
                        value={person.company || ''}
                        onChange={(e) => handleEditChange(e, person.id)}
                        onFocus={(e) => handleFieldFocus(person.id, 'company', e.target.value)}
                        onBlur={(e) => handleInlineBlur(e, person.id, 'company')}
                        options={getUniqueValues('company')}
                        placeholder="Enter or select company"
                        className="w-full border border-gray-300 rounded px-3 py-2"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <DynamicCityPicker
                        name="location"
                        value={person.location || ''}
                        onChange={(e) => handleEditChange(e, person.id)}
                        onFocus={(e) => handleFieldFocus(person.id, 'location', e.target.value)}
                        onBlur={(e) => handleInlineBlur(e, person.id, 'location')}
                        placeholder="Search for a city..."
                        className="w-full border border-gray-300 rounded px-3 py-2"
                        showCountryInfo={true}
                        showPopulation={false}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Work Hours</label>
                    <FormDropdown
                        name="workHours"
                        value={person.workHours || ''}
                        onChange={(e) => handleEditChange(e, person.id)}
                        onFocus={(e) => handleFieldFocus(person.id, 'workHours', e.target.value)}
                        onBlur={(e) => handleInlineBlur(e, person.id, 'workHours')}
                        options={getUniqueValues('workHours')}
                        placeholder="Enter or select work hours"
                        className="w-full border border-gray-300 rounded px-3 py-2"
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

            {/* Interactions Section - Full Width */}
            <div className="md:col-span-2 mt-6">
                <InteractionsList
                    person={person}
                    handleInteractionChange={handleInteractionChange}
                    handleInteractionAdd={handleInteractionAdd}
                    handleInteractionRemove={handleInteractionRemove}
                    handleDateEditStart={handleDateEditStart}
                    editingDateId={editingDateId}
                    handleInteractionDateChange={handleInteractionDateChange}
                    setEditingDateId={setEditingDateId}
                />
            </div>
        </div>
    );
} 
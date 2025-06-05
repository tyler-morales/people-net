import ConnectionStrengthSelector from '../ui/ConnectionStrengthSelector';
import FormDropdown from '../ui/FormDropdown';
import DynamicCityPicker from '../ui/DynamicCityPicker';
import { commonCities } from '../../lib/city-data';

export default function AddPersonForm({
    newPerson,
    setNewPerson,
    onSubmit,
    onCancel,
    people
}) {
    const handleChange = (e) => {
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
        <div className="bg-gray-50 border border-gray-300 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Add New Person</h3>
                <button
                    onClick={onCancel}
                    className="text-gray-500 hover:text-gray-700 text-xl cursor-pointer"
                >
                    ×
                </button>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
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
                            onChange={handleChange}
                            required
                            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                            placeholder="Enter full name"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Company
                        </label>
                        <FormDropdown
                            name="company"
                            value={newPerson.company}
                            onChange={handleChange}
                            options={getUniqueValues('company')}
                            placeholder="Enter or select company"
                            className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Team
                        </label>
                        <FormDropdown
                            name="team"
                            value={newPerson.team}
                            onChange={handleChange}
                            options={getUniqueValues('team')}
                            placeholder="Enter or select team"
                            className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Role
                        </label>
                        <FormDropdown
                            name="role"
                            value={newPerson.role}
                            onChange={handleChange}
                            options={getUniqueValues('role')}
                            placeholder="Enter or select role"
                            className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Location
                        </label>
                        <DynamicCityPicker
                            name="location"
                            value={newPerson.location}
                            onChange={handleChange}
                            placeholder="Search for a city..."
                            className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                            showCountryInfo={true}
                            showPopulation={false}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Work Hours
                        </label>
                        <FormDropdown
                            name="workHours"
                            value={newPerson.workHours}
                            onChange={handleChange}
                            options={getUniqueValues('workHours')}
                            placeholder="Enter or select work hours"
                            className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
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
                            onChange={handleChange}
                            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Connection Strength
                        </label>
                        <ConnectionStrengthSelector
                            value={newPerson.connection.strength}
                            onChange={(value) => handleChange({ target: { name: 'connection.strength', value } })}
                            variant="slider"
                        />
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
                                        onChange={handleChange}
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
                                        onChange={handleChange}
                                        className="mr-2"
                                    />
                                    Through someone in my network
                                </label>
                                {newPerson.connection.introducedByType === 'existing' && (
                                    <select
                                        name="connection.introducedBy"
                                        value={newPerson.connection.introducedBy || ''}
                                        onChange={handleChange}
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
                                        onChange={handleChange}
                                        className="mr-2"
                                    />
                                    Through someone else
                                </label>
                                {newPerson.connection.introducedByType === 'external' && (
                                    <input
                                        type="text"
                                        name="connection.introducedByName"
                                        value={newPerson.connection.introducedByName || ''}
                                        onChange={handleChange}
                                        placeholder="Enter their name..."
                                        className="mt-1 w-full border border-gray-300 rounded px-3 py-2"
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Connection Type */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Connection Type
                    </label>
                    <select
                        name="connection.type"
                        value={newPerson.connection.type}
                        onChange={handleChange}
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

                {/* Notes */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Notes
                    </label>
                    <textarea
                        name="notes"
                        value={newPerson.notes}
                        onChange={handleChange}
                        rows="3"
                        className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                        placeholder="Additional notes about this person..."
                    />
                </div>

                {/* Connection Notes */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Connection Notes
                    </label>
                    <textarea
                        name="connection.notes"
                        value={newPerson.connection.notes}
                        onChange={handleChange}
                        rows="2"
                        className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                        placeholder="How you met, context of your relationship..."
                    />
                </div>

                <div className="flex gap-3 pt-4">
                    <button
                        type="submit"
                        className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium cursor-pointer"
                    >
                        Add Person
                    </button>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-2 rounded-lg font-medium cursor-pointer"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
} 
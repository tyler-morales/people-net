import ConnectionStrengthSelector from '../ui/ConnectionStrengthSelector';
import FormDropdown from '../ui/FormDropdown';
import DynamicCityPicker from '../ui/DynamicCityPicker';
import { commonCities } from '../../lib/city-data';
import { getTimezoneFromLocation } from '../../utils/timezone-utils';
import { LiquidButton } from '../ui/LiquidGlass';

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
            setNewPerson(prev => {
                const updatedPerson = {
                    ...prev,
                    [name]: value
                };

                // Auto-fill work hours with timezone when location changes
                if (name === 'location' && value) {
                    const timezone = getTimezoneFromLocation(value);
                    if (timezone) {
                        updatedPerson.workHours = timezone;
                    }
                }

                return updatedPerson;
            });
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
        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Add New Contact</h3>
                <button
                    onClick={onCancel}
                    className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-xl cursor-pointer"
                >
                    ×
                </button>
            </div>

            <form onSubmit={(e) => {
                console.log('Form onSubmit triggered!', e);
                onSubmit(e);
            }} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Basic Information */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Name *
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={newPerson.name}
                            onChange={handleChange}
                            required
                            className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 focus:outline-none focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            placeholder="Enter full name"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Organization
                        </label>
                        <FormDropdown
                            name="organization"
                            value={newPerson.organization}
                            onChange={handleChange}
                            options={getUniqueValues('organization')}
                            placeholder="Enter or select organization"
                            className="border border-gray-300 dark:border-gray-600 rounded px-3 py-2 focus:outline-none focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Group
                        </label>
                        <FormDropdown
                            name="group"
                            value={newPerson.group}
                            onChange={handleChange}
                            options={getUniqueValues('group')}
                            placeholder="Enter or select group"
                            className="border border-gray-300 dark:border-gray-600 rounded px-3 py-2 focus:outline-none focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Description
                        </label>
                        <textarea
                            name="description"
                            value={newPerson.description}
                            onChange={handleChange}
                            rows="3"
                            className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 focus:outline-none focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            placeholder="Describe this person, their interests, what they do..."
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
                            Time Zone / Availability
                        </label>
                        <FormDropdown
                            name="workHours"
                            value={newPerson.workHours}
                            onChange={handleChange}
                            options={getUniqueValues('workHours')}
                            placeholder="Enter or select time zone"
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
                        <option value="friend">Friend</option>
                        <option value="family">Family</option>
                        <option value="neighbor">Neighbor</option>
                        <option value="shared_interest">Shared Interest</option>
                        <option value="activity_partner">Activity Partner</option>
                        <option value="online_friend">Online Friend</option>
                        <option value="colleague">Colleague</option>
                        <option value="mentor">Mentor</option>
                        <option value="acquaintance">Acquaintance</option>
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

                <div className="flex gap-3 pt-6">
                    <LiquidButton
                        type="submit"
                        variant="primary"
                        className="flex-1 py-3 font-semibold"
                    >
                        <span className="flex items-center justify-center gap-2">
                            <span>✨</span>
                            Add Contact
                        </span>
                    </LiquidButton>
                    <LiquidButton
                        type="button"
                        onClick={onCancel}
                        variant="secondary"
                        className="px-8 py-3 font-medium"
                    >
                        Cancel
                    </LiquidButton>
                </div>
            </form>
        </div>
    );
} 
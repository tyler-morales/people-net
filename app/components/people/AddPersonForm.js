import ConnectionStrengthSelector from '../ui/ConnectionStrengthSelector';

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
                        <input
                            type="text"
                            name="company"
                            value={newPerson.company}
                            onChange={handleChange}
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
                            onChange={handleChange}
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
                            onChange={handleChange}
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
                            onChange={handleChange}
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
                            onChange={handleChange}
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

                {/* Connection Details */}
                <div className="space-y-4">
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
                            onChange={handleChange}
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
                        onClick={onCancel}
                        className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded font-medium cursor-pointer"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
} 
import { Fragment } from 'react';
import ConnectionStrengthSelector from '../ui/ConnectionStrengthSelector';
import SelectionCheckbox from '../ui/SelectionCheckbox';
import PersonDetails from './PersonDetails';
import FormDropdown from '../ui/FormDropdown';

export default function PersonRow({
    person,
    index,
    people,
    selectedPersonId,
    setSelectedPersonId,
    editingField,
    handleInlineEdit,
    handleInlineBlur,
    handleEditChange,
    handleFieldFocus,
    handleDeletePerson,
    showToast,
    // Selection props
    isSelected,
    onToggleSelect,
    // Person details props
    handleInteractionChange,
    handleInteractionAdd,
    handleInteractionRemove,
    handleDateEditStart,
    editingDateId,
    handleInteractionDateChange,
    setEditingDateId,
    originalValues,
    setOriginalValues
}) {
    // Helper function to get unique values for dropdowns
    const getUniqueValues = (field) => {
        const values = people.map(person => person[field]).filter(Boolean);
        return [...new Set(values)].sort();
    };

    return (
        <Fragment>
            <tr className={`border-t ${index % 2 === 0 ? 'bg-white' : 'bg-gray-100'}`}>
                <td className="p-2 border-b w-12">
                    <SelectionCheckbox
                        checked={isSelected}
                        onChange={onToggleSelect}
                        aria-label={`Select ${person.name}`}
                    />
                </td>
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
                        <FormDropdown
                            name="company"
                            value={person.company}
                            onChange={(e) => handleEditChange(e, person.id)}
                            onFocus={(e) => handleFieldFocus(person.id, 'company', e.target.value)}
                            onBlur={(e) => handleInlineBlur(e, person.id, 'company')}
                            options={getUniqueValues('company')}
                            placeholder="Enter or select company"
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
                        <FormDropdown
                            name="role"
                            value={person.role}
                            onChange={(e) => handleEditChange(e, person.id)}
                            onFocus={(e) => handleFieldFocus(person.id, 'role', e.target.value)}
                            onBlur={(e) => handleInlineBlur(e, person.id, 'role')}
                            options={getUniqueValues('role')}
                            placeholder="Enter or select role"
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
                    <ConnectionStrengthSelector
                        value={person.connection?.strength}
                        onChange={(value) => {
                            handleEditChange({ target: { name: 'connection.strength', value } }, person.id);
                        }}
                        onFocus={(e) => handleFieldFocus(person.id, 'connection.strength', e.target.value)}
                        showToast={showToast}
                        personName={person.name}
                        variant="select"
                    />
                </td>
                <td className="p-2 border-b">
                    <button
                        className="text-purple-500 cursor-pointer"
                        onClick={() => setSelectedPersonId(selectedPersonId === person.id ? null : person.id)}
                    >
                        {selectedPersonId === person.id ? 'Close' : 'View'}
                    </button>
                    <button
                        className="text-red-600 ml-2 cursor-pointer"
                        onClick={() => handleDeletePerson(person)}
                    >
                        Delete
                    </button>
                </td>
            </tr>
            {selectedPersonId === person.id && (
                <tr className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td colSpan={7} className="p-4">
                        <PersonDetails
                            person={person}
                            people={people}
                            handleEditChange={handleEditChange}
                            handleFieldFocus={handleFieldFocus}
                            handleInlineBlur={handleInlineBlur}
                            handleInteractionChange={handleInteractionChange}
                            handleInteractionAdd={handleInteractionAdd}
                            handleInteractionRemove={handleInteractionRemove}
                            handleDateEditStart={handleDateEditStart}
                            editingDateId={editingDateId}
                            handleInteractionDateChange={handleInteractionDateChange}
                            setEditingDateId={setEditingDateId}
                            originalValues={originalValues}
                            setOriginalValues={setOriginalValues}
                            showToast={showToast}
                        />
                    </td>
                </tr>
            )}
        </Fragment>
    );
} 
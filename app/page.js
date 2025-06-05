'use client'
import { React, Fragment, useState } from "react";
import { initialPeople } from "./lib/people-data";

export default function Home() {
  const [people, setPeople] = useState(initialPeople);
  const [selectedPersonId, setSelectedPersonId] = useState(null);
  const [editingDateId, setEditingDateId] = useState(null); // personId-interactionIndex
  const [editingField, setEditingField] = useState(null); // personId-fieldName

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

  const handleInlineEdit = (personId, field) => {
    setEditingField(`${personId}-${field}`);
  };

  const handleInlineBlur = () => {
    setEditingField(null);
  };

  const handleInteractionAdd = (id) => {
    setPeople((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
            ...p,
            interactions: [...p.interactions, {
              text: "",
              date: new Date().toISOString().split('T')[0] // YYYY-MM-DD format
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
                  ? { text: value, date: new Date().toISOString().split('T')[0] }  // Convert string to object
                  : { ...inter, text: value }  // Update existing object
                : inter
            ),
          }
          : p
      )
    );
  };

  const handleDateEditStart = (id, index) => {
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
                ? { ...inter, date: newDate }  // Now we know it's always an object
                : inter
            ),
          }
          : p
      )
    );
    setEditingDateId(null); // Close the date picker after selection
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

  return (
    <main className="p-8">
      <header className="mb-6">
        <h1 className="text-4xl font-bold">🌐 PeopleNet</h1>
        <h2 className="text-lg text-gray-600">Connecting you and your organization.</h2>
      </header>

      <table className="w-full table-auto border border-black mb-4">
        <thead>
          <tr className="bg-blue-100">
            <th className="text-left p-2 border-b">Name</th>
            <th className="text-left p-2 border-b">Company</th>
            <th className="text-left p-2 border-b">Role</th>
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
          {people.map((person, index) => (
            <Fragment key={person.id}>
              <tr className={`border-t ${index % 2 === 0 ? 'bg-white' : 'bg-gray-100'}`}>
                <td className="p-2 border-b">
                  {editingField === `${person.id}-name` ? (
                    <input
                      name="name"
                      value={person.name}
                      onChange={(e) => handleEditChange(e, person.id)}
                      onBlur={handleInlineBlur}
                      className="border p-1 w-full rounded"
                      autoFocus
                    />
                  ) : (
                    <div
                      className="border border-transparent p-1 rounded cursor-text hover:bg-gray-100"
                      onClick={() => handleInlineEdit(person.id, 'name')}
                      onFocus={() => handleInlineEdit(person.id, 'name')}
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
                      onChange={(e) => handleEditChange(e, person.id)}
                      onBlur={handleInlineBlur}
                      className="border p-1 w-full rounded"
                      autoFocus
                    />
                  ) : (
                    <div
                      className="border border-transparent p-1 rounded cursor-text hover:bg-gray-100"
                      onClick={() => handleInlineEdit(person.id, 'company')}
                      onFocus={() => handleInlineEdit(person.id, 'company')}
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
                      onChange={(e) => handleEditChange(e, person.id)}
                      onBlur={handleInlineBlur}
                      className="border p-1 w-full rounded"
                      autoFocus
                    />
                  ) : (
                    <div
                      className="border border-transparent p-1 rounded cursor-text hover:bg-blue-50"
                      onClick={() => handleInlineEdit(person.id, 'role')}
                      onFocus={() => handleInlineEdit(person.id, 'role')}
                      tabIndex="0"
                      title="Edit role"
                    >
                      {person.role}
                    </div>
                  )}
                </td>
                <td className="p-2 border-b">
                  <select name="connection.strength" value={person.connection?.strength} onChange={(e) => handleEditChange(e, person.id)} className="border p-1 w-full rounded bg-white">
                    <option value="fleeting">Fleeting (1)</option>
                    <option value="acquaintance">Acquaintance (2)</option>
                    <option value="casual">Casual (3)</option>
                    <option value="working">Working (4)</option>
                    <option value="strong">Strong (5)</option>
                    <option value="core">Core (6)</option>
                  </select>
                </td>
                <td className="p-2 border-b">
                  <button className="text-purple-500" onClick={() => setSelectedPersonId(selectedPersonId === person.id ? null : person.id)}>
                    {selectedPersonId === person.id ? 'Close' : 'View'}
                  </button>
                  <button className="text-red-600 ml-2" onClick={() => setPeople(people.filter((p) => p.id !== person.id))}>
                    Delete
                  </button>
                </td>
              </tr>
              {selectedPersonId === person.id && (
                <tr className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                  <td colSpan={5} className="p-4">
                    <div className="mb-2">
                      <strong>Connection</strong>
                      <div className="mt-1">
                        <label className="block text-sm">Type:</label>
                        <select name="connection.type" value={person.connection?.type} onChange={(e) => handleEditChange(e, person.id)} className="border p-1">
                          <option value="collaborated">Collaborated</option>
                          <option value="mentored">Mentored</option>
                          <option value="coordinated">Coordinated</option>
                          <option value="reviewed_code">Reviewed Code</option>
                          <option value="led_meeting">Led Meeting</option>
                          <option value="inspired_me">Inspired Me</option>
                        </select>
                      </div>
                      <div className="mt-1">
                        <label className="block text-sm">Notes:</label>
                        <textarea name="connection.notes" value={person.connection?.notes} onChange={(e) => handleEditChange(e, person.id)} className="border p-1 w-full" />
                      </div>
                    </div>
                    <div className="mb-2">
                      <strong>Interactions</strong>
                      <ul className="list-disc ml-4">
                        {person.interactions.map((interaction, i) => (
                          <li key={i} className="mb-2">
                            <div className="flex items-center justify-between">
                              <input
                                type="text"
                                value={typeof interaction === 'string' ? interaction : interaction.text}
                                onChange={(e) => handleInteractionChange(person.id, i, e.target.value)}
                                className="p-1 flex-1 mr-2 bg-gray-200 rounded"
                                placeholder="Enter interaction"
                              />
                              {editingDateId === `${person.id}-${i}` ? (
                                <input
                                  type="date"
                                  value={typeof interaction === 'string' ? new Date().toISOString().split('T')[0] : (interaction.date || new Date().toISOString().split('T')[0])}
                                  onChange={(e) => handleInteractionDateChange(person.id, i, e.target.value)}
                                  onBlur={() => setEditingDateId(null)}
                                  className="text-sm border rounded px-2 py-1"
                                  autoFocus
                                />
                              ) : (
                                <span
                                  className="text-sm text-gray-500 min-w-max cursor-pointer hover:text-blue-600 hover:underline"
                                  onClick={() => handleDateEditStart(person.id, i)}
                                  title="Click to edit date"
                                >
                                  {typeof interaction === 'string' ? 'No date' : interaction.date}
                                </span>
                              )}
                              <button
                                onClick={() => handleInteractionRemove(person.id, i)}
                                className="text-red-600 hover:text-red-800 ml-2 px-2"
                                title="Remove interaction"
                              >
                                ×
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                      <button onClick={() => handleInteractionAdd(person.id)} className="mt-2 text-sm text-blue-600">+ Add New Interaction</button>
                    </div>
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>

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
    </main>
  );
}

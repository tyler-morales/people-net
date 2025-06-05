'use client'
import { React, Fragment, useState, useEffect, useRef } from "react";
import { initialPeople } from "./lib/people-data";

export default function Home() {
  const [people, setPeople] = useState(initialPeople);
  const [activeTab, setActiveTab] = useState('table'); // New tab state
  const [selectedPersonId, setSelectedPersonId] = useState(null);
  const [editingDateId, setEditingDateId] = useState(null); // personId-interactionIndex
  const [editingField, setEditingField] = useState(null); // personId-fieldName
  const [showAddForm, setShowAddForm] = useState(false);

  // Graph-related state (moved from graph page)
  const svgRef = useRef(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [links, setLinks] = useState([]);
  const [graphFilter, setGraphFilter] = useState('all'); // New filter state

  // Graph dimensions
  const width = 800;
  const height = 600;

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
      introducedBy: null,
      introducedByName: '',
      introducedByType: 'direct'
    },
    interactions: []
  });

  // Graph calculation effect (moved from graph page)
  useEffect(() => {
    const calculatedNodes = [
      { id: 'you', name: 'You', x: width / 2, y: height / 2, radius: 30, color: '#3b82f6' },
      ...people.map((person, index) => {
        const angle = (index * 2 * Math.PI) / people.length;
        const radius = 200;
        return {
          id: person.id,
          name: person.name,
          company: person.company,
          role: person.role,
          strength: person.connection?.strength,
          connection: person.connection,
          x: Math.round((width / 2 + Math.cos(angle) * radius) * 100) / 100,
          y: Math.round((height / 2 + Math.sin(angle) * radius) * 100) / 100,
          radius: getNodeRadius(person.connection?.strength),
          color: getNodeColor(person.connection?.strength)
        };
      })
    ];

    // Calculate links based on filter
    let calculatedLinks = [];

    if (graphFilter === 'all' || graphFilter === 'direct') {
      // Direct connections to "you"
      const directLinks = people
        .filter(person => !person.connection?.introducedBy && person.connection?.introducedByType === 'direct')
        .map(person => ({
          source: 'you',
          target: person.id,
          strength: person.connection?.strength,
          strokeWidth: getStrokeWidth(person.connection?.strength),
          type: 'direct',
          strokeStyle: 'solid'
        }));
      calculatedLinks = [...calculatedLinks, ...directLinks];
    }

    if (graphFilter === 'all' || graphFilter === 'introduced') {
      // Indirect connections through existing people
      const indirectLinks = people
        .filter(person => person.connection?.introducedBy && person.connection?.introducedByType === 'existing')
        .map(person => ({
          source: person.connection.introducedBy,
          target: person.id,
          strength: person.connection?.strength,
          strokeWidth: Math.max(1, getStrokeWidth(person.connection?.strength) - 1),
          type: 'introduced',
          strokeStyle: 'dashed'
        }));
      calculatedLinks = [...calculatedLinks, ...indirectLinks];

      // Also add connections from "you" to introducers if not already direct
      const introducerLinks = people
        .filter(person => person.connection?.introducedBy && person.connection?.introducedByType === 'existing')
        .map(person => person.connection.introducedBy)
        .filter((introducerId, index, arr) => arr.indexOf(introducerId) === index) // unique
        .filter(introducerId => !people.find(p => p.id === introducerId && p.connection?.introducedByType === 'direct'))
        .map(introducerId => ({
          source: 'you',
          target: introducerId,
          strength: 'casual',
          strokeWidth: 2,
          type: 'connector',
          strokeStyle: 'dotted'
        }));
      calculatedLinks = [...calculatedLinks, ...introducerLinks];
    }

    if (graphFilter === 'all' || graphFilter === 'external') {
      // Show connections to "you" for people introduced by external contacts
      const externalLinks = people
        .filter(person => person.connection?.introducedByType === 'external')
        .map(person => ({
          source: 'you',
          target: person.id,
          strength: person.connection?.strength,
          strokeWidth: getStrokeWidth(person.connection?.strength),
          type: 'external',
          strokeStyle: 'solid'
        }));
      calculatedLinks = [...calculatedLinks, ...externalLinks];
    }

    setNodes(calculatedNodes);
    setLinks(calculatedLinks);
  }, [people, width, height, graphFilter]);

  // Graph utility functions (moved from graph page)
  function getNodeRadius(strength) {
    const radiusMap = {
      'fleeting': 15,
      'acquaintance': 18,
      'casual': 21,
      'working': 24,
      'strong': 27,
      'core': 30
    };
    return radiusMap[strength] || 15;
  }

  function getNodeColor(strength) {
    const colorMap = {
      'fleeting': '#ef4444',
      'acquaintance': '#f97316',
      'casual': '#f59e0b',
      'working': '#10b981',
      'strong': '#3b82f6',
      'core': '#8b5cf6'
    };
    return colorMap[strength] || '#6b7280';
  }

  function getStrokeWidth(strength) {
    const widthMap = {
      'fleeting': 1,
      'acquaintance': 2,
      'casual': 3,
      'working': 4,
      'strong': 5,
      'core': 6
    };
    return widthMap[strength] || 1;
  }

  function handleNodeClick(node) {
    setSelectedNode(selectedNode?.id === node.id ? null : node);
  }

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

    setPeople(prev => [...prev, personToAdd]);

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

  // Tab content renderers
  const renderTableView = () => (
    <>
      {/* Add Person Button & Form */}
      <div className="mb-6">
        {!showAddForm ? (
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium"
          >
            + Add New Person
          </button>
        ) : (
          <div className="bg-gray-50 border border-gray-300 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Add New Person</h3>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-gray-500 hover:text-gray-700 text-xl"
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
                  <select
                    name="connection.strength"
                    value={newPerson.connection.strength}
                    onChange={handleNewPersonChange}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                  >
                    <option value="fleeting">Fleeting (1)</option>
                    <option value="acquaintance">Acquaintance (2)</option>
                    <option value="casual">Casual (3)</option>
                    <option value="working">Working (4)</option>
                    <option value="strong">Strong (5)</option>
                    <option value="core">Core (6)</option>
                  </select>
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
                  className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded font-medium"
                >
                  Add Person
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded font-medium"
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
            <th className="text-left p-2 border-b">Name</th>
            <th className="text-left p-2 border-b">Company</th>
            <th className="text-left p-2 border-b">Role</th>
            <th className="text-left p-2 border-b">Connected Through</th>
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
                <td className="p-2 border-b text-sm">
                  {person.connection?.introducedByType === 'direct' ? (
                    <span className="text-green-600">Direct</span>
                  ) : person.connection?.introducedByType === 'existing' ? (
                    <span className="text-blue-600">
                      {people.find(p => p.id === person.connection.introducedBy)?.name || 'Unknown'}
                    </span>
                  ) : person.connection?.introducedByType === 'external' ? (
                    <span className="text-purple-600">
                      {person.connection.introducedByName || 'External'}
                    </span>
                  ) : (
                    <span className="text-gray-400">Unknown</span>
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
    </>
  );

  const renderGraphView = () => (
    <div className="flex gap-6">
      {/* Graph */}
      <div className="flex-1">
        {/* Filter Controls */}
        <div className="mb-4 flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">
            Connection View:
          </label>
          <select
            value={graphFilter}
            onChange={(e) => setGraphFilter(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1 text-sm"
          >
            <option value="all">All Connections</option>
            <option value="direct">Direct Only</option>
            <option value="introduced">Through Others</option>
            <option value="external">External Introductions</option>
          </select>
        </div>

        <svg
          ref={svgRef}
          width={width}
          height={height}
          className="border border-gray-300 rounded-lg bg-gray-50"
        >
          {/* Define line patterns for different connection types */}
          <defs>
            <pattern id="dashed" patternUnits="userSpaceOnUse" width="10" height="1">
              <rect width="5" height="1" fill="#6b7280" />
              <rect x="5" width="5" height="1" fill="transparent" />
            </pattern>
            <pattern id="dotted" patternUnits="userSpaceOnUse" width="6" height="1">
              <rect width="2" height="1" fill="#6b7280" />
              <rect x="2" width="4" height="1" fill="transparent" />
            </pattern>
          </defs>

          {/* Links */}
          {links.map((link, index) => {
            const sourceNode = nodes.find(n => n.id === link.source);
            const targetNode = nodes.find(n => n.id === link.target);

            let stroke = "#6b7280";
            let strokeDasharray = "none";

            if (link.strokeStyle === 'dashed') {
              strokeDasharray = "8,4";
            } else if (link.strokeStyle === 'dotted') {
              strokeDasharray = "2,3";
            }

            return (
              <line
                key={index}
                x1={sourceNode.x}
                y1={sourceNode.y}
                x2={targetNode.x}
                y2={targetNode.y}
                stroke={stroke}
                strokeWidth={link.strokeWidth}
                strokeDasharray={strokeDasharray}
                opacity={0.6}
              />
            );
          })}

          {/* Nodes */}
          {nodes.map((node) => (
            <g key={node.id}>
              <circle
                cx={node.x}
                cy={node.y}
                r={node.radius}
                fill={node.color}
                stroke={selectedNode?.id === node.id ? '#000' : '#fff'}
                strokeWidth={selectedNode?.id === node.id ? 3 : 2}
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => handleNodeClick(node)}
              />
              <text
                x={node.x}
                y={node.y + node.radius + 15}
                textAnchor="middle"
                className="text-sm font-medium fill-gray-700"
                style={{ pointerEvents: 'none' }}
              >
                {node.name}
              </text>
            </g>
          ))}
        </svg>
      </div>

      {/* Legend & Details */}
      <div className="w-80 space-y-6">
        {/* Connection Types Legend */}
        <div className="bg-white p-4 rounded-lg border border-gray-300">
          <h3 className="font-semibold mb-3">Connection Types</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-6 h-0.5 bg-gray-500"></div>
              <span>Direct connection</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-0.5 border-t-2 border-dashed border-gray-500"></div>
              <span>Introduced by network</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-0.5 border-t-2 border-dotted border-gray-500"></div>
              <span>External introduction</span>
            </div>
          </div>
        </div>

        {/* Connection Strength Legend */}
        <div className="bg-white p-4 rounded-lg border border-gray-300">
          <h3 className="font-semibold mb-3">Connection Strength</h3>
          <div className="space-y-2">
            {[
              { name: 'Fleeting', color: '#ef4444' },
              { name: 'Acquaintance', color: '#f97316' },
              { name: 'Casual', color: '#f59e0b' },
              { name: 'Working', color: '#10b981' },
              { name: 'Strong', color: '#3b82f6' },
              { name: 'Core', color: '#8b5cf6' }
            ].map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: item.color }}
                ></div>
                <span className="text-sm">{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Node Details */}
        {selectedNode && selectedNode.id !== 'you' && (
          <div className="bg-white p-4 rounded-lg border border-gray-300">
            <h3 className="font-semibold mb-3">Selected Person</h3>
            <div className="space-y-2 text-sm">
              <div><strong>Name:</strong> {selectedNode.name}</div>
              <div><strong>Company:</strong> {selectedNode.company}</div>
              <div><strong>Role:</strong> {selectedNode.role}</div>
              <div><strong>Connection:</strong> {selectedNode.strength}</div>
              {selectedNode.connection?.introducedByType === 'existing' && selectedNode.connection?.introducedBy && (
                <div><strong>Introduced by:</strong> {people.find(p => p.id === selectedNode.connection.introducedBy)?.name || 'Unknown'}</div>
              )}
              {selectedNode.connection?.introducedByType === 'external' && selectedNode.connection?.introducedByName && (
                <div><strong>Introduced by:</strong> {selectedNode.connection.introducedByName}</div>
              )}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h3 className="font-semibold mb-2 text-blue-900">How to use</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Click on any node to see details</li>
            <li>• Node size = connection strength</li>
            <li>• Line style = connection type</li>
            <li>• Use filter to focus on specific connections</li>
          </ul>
        </div>
      </div>
    </div>
  );

  return (
    <main className="">
      {/* Tab Navigation */}
      <div className="mt-2 flex gap-4 border-b border-gray-300">
        <button
          onClick={() => setActiveTab('table')}
          className={`pb-2 px-1 border-b-2 transition-colors ${activeTab === 'table'
            ? 'border-blue-500 text-blue-600 font-semibold'
            : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
        >
          🗒️ Table
        </button>
        <button
          onClick={() => setActiveTab('graph')}
          className={`pb-2 px-1 border-b-2 transition-colors ${activeTab === 'graph'
            ? 'border-blue-500 text-blue-600 font-semibold'
            : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
        >
          🕸️ Graph
        </button>
      </div>

      <header className="my-4">
        <div>
          <h1 className="text-4xl font-bold">🌐 PeopleNet</h1>
          <h2 className="text-lg text-gray-600">
            {activeTab === 'table'
              ? 'Manage your professional network in a table format.'
              : 'Visual network of your professional relationships.'
            }
          </h2>
        </div>
      </header>

      {/* Render content based on active tab */}
      {activeTab === 'table' ? renderTableView() : renderGraphView()}
    </main>
  );
}

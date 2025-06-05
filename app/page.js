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

  // Toast notification state
  const [toast, setToast] = useState(null);

  // Track original values for change detection
  const [originalValues, setOriginalValues] = useState({});

  // Undo functionality
  const [undoHistory, setUndoHistory] = useState([]);
  const [canUndo, setCanUndo] = useState(false);

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
      introducedBy: '',
      introducedByName: '',
      introducedByType: ''
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

  // Undo functionality
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Check for Cmd+Z (Mac) or Ctrl+Z (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undoHistory]);

  // Save state before making changes
  const saveUndoState = (action, targetId = null, fieldName = null, oldValue = null) => {
    const undoState = {
      timestamp: Date.now(),
      action,
      targetId,
      fieldName,
      oldValue,
      previousPeople: JSON.parse(JSON.stringify(people)) // Deep copy
    };

    setUndoHistory(prev => {
      const newHistory = [...prev, undoState];
      // Keep only last 10 actions to prevent memory issues
      return newHistory.slice(-10);
    });
    setCanUndo(true);
  };

  const handleUndo = () => {
    if (undoHistory.length === 0) return;

    const lastAction = undoHistory[undoHistory.length - 1];
    setPeople(lastAction.previousPeople);

    // Remove the last action from history
    setUndoHistory(prev => prev.slice(0, -1));
    setCanUndo(undoHistory.length > 1);

    // Show undo toast
    let undoMessage = 'Undid last action';
    if (lastAction.action === 'update' && lastAction.targetId) {
      const person = lastAction.previousPeople.find(p => p.id === lastAction.targetId);
      undoMessage = `Undid update to ${person?.name || 'person'}`;
    } else if (lastAction.action === 'delete' && lastAction.targetId) {
      undoMessage = `Restored ${lastAction.oldValue}`;
    } else if (lastAction.action === 'add' && lastAction.oldValue) {
      undoMessage = `Removed ${lastAction.oldValue}`;
    }

    showToast(undoMessage, 'info');
  };

  // Toast helper function
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000); // Auto-hide after 3 seconds
  };

  // Track original value when field gains focus
  const handleFieldFocus = (personId, fieldName, currentValue) => {
    const key = `${personId}-${fieldName}`;

    // Only save if we haven't already saved for this field
    if (!(key in originalValues)) {
      setOriginalValues(prev => ({
        ...prev,
        [key]: currentValue
      }));

      // Save undo state when editing begins (before any changes)
      saveUndoState('update', personId, fieldName, currentValue);
    }
  };

  // Helper to get nested property value
  const getFieldValue = (person, fieldName) => {
    if (fieldName.startsWith('connection.')) {
      const connectionField = fieldName.split('.')[1];
      return person.connection?.[connectionField] || '';
    }
    if (fieldName.startsWith('interactions.')) {
      const parts = fieldName.split('.');
      const index = parseInt(parts[1]);
      const subField = parts[2];
      const interaction = person.interactions[index];
      if (subField === 'text') {
        return typeof interaction === 'string' ? interaction : (interaction?.text || '');
      }
      if (subField === 'date') {
        return typeof interaction === 'string' ? '' : (interaction?.date || '');
      }
    }
    return person[fieldName] || '';
  };

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

  const handleEditBlur = (e, id, fieldName) => {
    const person = people.find(p => p.id === id);
    const key = `${id}-${fieldName}`;
    const originalValue = originalValues[key];
    const currentValue = getFieldValue(person, fieldName);

    // Only show toast if value actually changed
    if (person && originalValue !== undefined && originalValue !== currentValue) {
      // Clean up field name for display
      const displayFieldName = fieldName
        .replace('connection.', '')
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .replace('Introduced By Type', 'connection method')
        .replace('Introduced By Name', 'external introducer')
        .replace('Introduced By', 'introducer');

      showToast(`Updated ${displayFieldName} for ${person.name}`, 'success');
    }

    // Clean up the stored original value
    setOriginalValues(prev => {
      const newValues = { ...prev };
      delete newValues[key];
      return newValues;
    });
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

    // Save undo state before adding
    saveUndoState('add', personToAdd.id, null, newPerson.name);

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

  const handleInlineEdit = (personId, field) => {
    const person = people.find(p => p.id === personId);
    const currentValue = getFieldValue(person, field);

    // Save undo state and track original value when starting to edit
    handleFieldFocus(personId, field, currentValue);
    setEditingField(`${personId}-${field}`);
  };

  const handleInlineBlur = (e, id, fieldName) => {
    setEditingField(null);
    if (e && id && fieldName) {
      handleEditBlur(e, id, fieldName);
    }
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
    // Track original date value and save undo state
    const person = people.find(p => p.id === id);
    const interaction = person.interactions[index];
    const originalDate = typeof interaction === 'string' ? '' : (interaction.date || '');
    const fieldName = `interactions.${index}.date`;

    // Save undo state before making any changes
    saveUndoState('update', id, fieldName, originalDate);
    handleFieldFocus(id, fieldName, originalDate);

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

    // Check if date actually changed and show toast
    const key = `${id}-interactions.${index}.date`;
    const originalValue = originalValues[key];
    if (originalValue !== undefined && originalValue !== newDate) {
      const person = people.find(p => p.id === id);
      if (person) {
        showToast(`Updated interaction date for ${person.name}`, 'success');
      }
    }

    // Clean up stored original value
    setOriginalValues(prev => {
      const newValues = { ...prev };
      delete newValues[key];
      return newValues;
    });
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

  // Handle person deletion with undo support
  const handleDeletePerson = (personToDelete) => {
    // Save undo state before deletion
    saveUndoState('delete', personToDelete.id, null, personToDelete.name);

    setPeople(people.filter((p) => p.id !== personToDelete.id));
    showToast(`Deleted ${personToDelete.name} from your network`, 'error');
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
                    <input
                      name="company"
                      value={person.company}
                      onFocus={(e) => handleFieldFocus(person.id, 'company', e.target.value)}
                      onChange={(e) => handleEditChange(e, person.id)}
                      onBlur={(e) => handleInlineBlur(e, person.id, 'company')}
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
                    <input
                      name="role"
                      value={person.role}
                      onFocus={(e) => handleFieldFocus(person.id, 'role', e.target.value)}
                      onChange={(e) => handleEditChange(e, person.id)}
                      onBlur={(e) => handleInlineBlur(e, person.id, 'role')}
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
                  <select
                    name="connection.strength"
                    value={person.connection?.strength}
                    onFocus={(e) => handleFieldFocus(person.id, 'connection.strength', e.target.value)}
                    onChange={(e) => {
                      handleEditChange(e, person.id);
                      showToast(`Updated connection strength for ${person.name}`, 'success');
                    }}
                    className="border p-1 w-full rounded bg-white"
                  >
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
                  <button className="text-red-600 ml-2" onClick={() => handleDeletePerson(person)}>
                    Delete
                  </button>
                </td>
              </tr>
              {selectedPersonId === person.id && (
                <tr className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                  <td colSpan={5} className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Left Column - Basic Information */}
                      <div className="space-y-4">
                        <h4 className="font-semibold text-lg mb-3">Basic Information</h4>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Team</label>
                          <input
                            name="team"
                            value={person.team || ''}
                            onFocus={(e) => handleFieldFocus(person.id, 'team', e.target.value)}
                            onChange={(e) => handleEditChange(e, person.id)}
                            onBlur={(e) => handleInlineBlur(e, person.id, 'team')}
                            className="w-full border border-gray-300 rounded px-3 py-2"
                            placeholder="Enter team"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                          <input
                            name="location"
                            value={person.location || ''}
                            onFocus={(e) => handleFieldFocus(person.id, 'location', e.target.value)}
                            onChange={(e) => handleEditChange(e, person.id)}
                            onBlur={(e) => handleInlineBlur(e, person.id, 'location')}
                            className="w-full border border-gray-300 rounded px-3 py-2"
                            placeholder="Enter location"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Work Hours</label>
                          <input
                            name="workHours"
                            value={person.workHours || ''}
                            onFocus={(e) => handleFieldFocus(person.id, 'workHours', e.target.value)}
                            onChange={(e) => handleEditChange(e, person.id)}
                            onBlur={(e) => handleInlineBlur(e, person.id, 'workHours')}
                            className="w-full border border-gray-300 rounded px-3 py-2"
                            placeholder="e.g., 9am-5pm EST"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Date Met</label>
                          <input
                            type="date"
                            name="dateMet"
                            value={person.dateMet || ''}
                            onFocus={(e) => handleFieldFocus(person.id, 'dateMet', e.target.value)}
                            onChange={(e) => handleEditChange(e, person.id)}
                            onBlur={(e) => handleInlineBlur(e, person.id, 'dateMet')}
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
                    </div>

                    {/* Interactions Section */}
                    <div className="mt-6">
                      <h4 className="font-semibold text-lg mb-3">Interactions</h4>
                      <ul className="space-y-2">
                        {person.interactions.map((interaction, i) => (
                          <li key={i} className="flex items-center gap-3 p-3 bg-gray-100 rounded-lg">
                            <input
                              type="text"
                              value={typeof interaction === 'string' ? interaction : interaction.text}
                              onFocus={(e) => handleFieldFocus(person.id, `interactions.${i}.text`, e.target.value)}
                              onChange={(e) => handleInteractionChange(person.id, i, e.target.value)}
                              onBlur={(e) => handleInlineBlur(e, person.id, `interactions.${i}.text`)}
                              className="flex-1 border border-gray-300 rounded px-3 py-2"
                              placeholder="Enter interaction"
                            />
                            {editingDateId === `${person.id}-${i}` ? (
                              <input
                                type="date"
                                value={typeof interaction === 'string' ? new Date().toISOString().split('T')[0] : (interaction.date || new Date().toISOString().split('T')[0])}
                                onFocus={(e) => handleFieldFocus(person.id, `interactions.${i}.date`, e.target.value)}
                                onChange={(e) => handleInteractionDateChange(person.id, i, e.target.value)}
                                onBlur={() => setEditingDateId(null)}
                                className="border border-gray-300 rounded px-3 py-2"
                                autoFocus
                              />
                            ) : (
                              <button
                                className="text-sm text-gray-600 hover:text-blue-600 hover:underline min-w-max"
                                onClick={() => handleDateEditStart(person.id, i)}
                                title="Click to edit date"
                              >
                                {typeof interaction === 'string' ? 'Add date' : (interaction.date || 'Add date')}
                              </button>
                            )}
                            <button
                              onClick={() => handleInteractionRemove(person.id, i)}
                              className="text-red-600 hover:text-red-800 px-2 py-1 rounded"
                              title="Remove interaction"
                            >
                              ×
                            </button>
                          </li>
                        ))}
                      </ul>
                      <button
                        onClick={() => handleInteractionAdd(person.id)}
                        className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        + Add New Interaction
                      </button>
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

  // Toast Component
  const Toast = () => {
    if (!toast) return null;

    return (
      <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300">
        <div className={`px-4 py-3 rounded-lg shadow-lg border max-w-sm ${toast.type === 'success'
          ? 'bg-green-50 border-green-200 text-green-800'
          : toast.type === 'error'
            ? 'bg-red-50 border-red-200 text-red-800'
            : toast.type === 'info'
              ? 'bg-blue-50 border-blue-200 text-blue-800'
              : 'bg-gray-50 border-gray-200 text-gray-800'
          }`}>
          <div className="flex items-center gap-2">
            {toast.type === 'success' && (
              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
            {toast.type === 'error' && (
              <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )}
            {toast.type === 'info' && (
              <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            )}
            <span className="text-sm font-medium">{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="ml-2 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  };

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

        {/* Undo indicator */}
        {canUndo && (
          <div className="ml-auto flex items-center text-sm text-gray-500">
            <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">
              {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}+Z
            </kbd>
            <span className="ml-2">to undo</span>
          </div>
        )}
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

      {/* Toast Notification */}
      <Toast />
    </main>
  );
}

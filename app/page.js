'use client'
import { useState, useEffect } from "react";
import { initialPeople } from "./lib/people-data";
import { useToast } from "./hooks/useToast";
import { useUndo } from "./hooks/useUndo";
import TabNavigation from "./components/TabNavigation";
import TableView from "./components/TableView";
import GraphView from "./components/GraphView";
import QuickNote from "./components/QuickNote";
import Toast from "./components/Toast";

export default function Home() {
  const [people, setPeople] = useState([]);
  const [activeTab, setActiveTab] = useState('table');
  const [isLoaded, setIsLoaded] = useState(false);

  // Custom hooks
  const { toast, showToast, hideToast } = useToast();
  const { canUndo, saveUndoState, handleUndo } = useUndo(showToast);

  // Track original values for change detection
  const [originalValues, setOriginalValues] = useState({});

  // Load data from localStorage on initial mount
  useEffect(() => {
    try {
      const savedPeople = localStorage.getItem('peopleNet');
      if (savedPeople) {
        const parsedPeople = JSON.parse(savedPeople);
        setPeople(parsedPeople);
        showToast(`Loaded ${parsedPeople.length} contacts from storage`, 'info');
      } else {
        // No saved data, use initial data
        setPeople(initialPeople);
        showToast('Welcome to PeopleNet! Add your first contact to get started.', 'info');
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      setPeople(initialPeople);
      showToast('Error loading saved data, using defaults', 'error');
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save to localStorage whenever people data changes (but only after initial load)
  useEffect(() => {
    if (isLoaded && people.length >= 0) {
      try {
        localStorage.setItem('peopleNet', JSON.stringify(people));
        console.log('Data saved to localStorage:', people.length, 'contacts');
      } catch (error) {
        console.error('Error saving to localStorage:', error);
        showToast('Error saving data to storage', 'error');
      }
    }
  }, [people, isLoaded]);

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
      saveUndoState('update', personId, fieldName, currentValue, people);
    }
  };

  // Listen for undo requests from the hook
  useEffect(() => {
    const handleUndoRequest = () => {
      const restoredPeople = handleUndo(setPeople);
      if (restoredPeople) {
        // Clear any stored original values when undoing
        setOriginalValues({});
      }
    };

    window.addEventListener('undo-requested', handleUndoRequest);
    return () => window.removeEventListener('undo-requested', handleUndoRequest);
  }, [handleUndo]);

  // Show loading state until data is loaded
  if (!isLoaded) {
    return (
      <main className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your network...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="">
      {/* Tab Navigation */}
      <TabNavigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        canUndo={canUndo}
      />

      <header className="my-4">
        <div>
          <h1 className="text-4xl font-bold">🌐 PeopleNet</h1>
          <h2 className="text-lg text-gray-600">
            {activeTab === 'table'
              ? 'Manage your professional network in a table format.'
              : 'Visual network of your professional relationships.'
            }
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {people.length === 0
              ? 'Your network is empty. Add your first contact below!'
              : `${people.length} contact${people.length === 1 ? '' : 's'} in your network`
            }
          </p>
        </div>
      </header>

      {/* Render content based on active tab */}
      {activeTab === 'table' ? (
        <TableView
          people={people}
          setPeople={setPeople}
          showToast={showToast}
          saveUndoState={saveUndoState}
          handleFieldFocus={handleFieldFocus}
          originalValues={originalValues}
          setOriginalValues={setOriginalValues}
        />
      ) : (
        <GraphView people={people} />
      )}

      {/* Floating Quick Note Button */}
      <QuickNote
        people={people}
        setPeople={setPeople}
        showToast={showToast}
        saveUndoState={saveUndoState}
      />

      {/* Toast Notification */}
      <Toast toast={toast} onClose={hideToast} />
    </main>
  );
}

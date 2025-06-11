'use client'
import { useState, useEffect, useRef } from "react";
import { initialPeople } from "./lib/people-data";
import { useToast } from "./hooks/useToast";
import { useUndo } from "./hooks/useUndo";
import TabNavigation from "./components/TabNavigation";
import TableView from "./components/TableView";
import GraphView from "./components/GraphView";
import GlobeView from "./components/GlobeView";
import TimezoneChart from "./components/TimezoneChart";
import QuickNote from "./components/QuickNote";
import Toast from "./components/Toast";
import ApiUsageMonitor from "./components/ui/ApiUsageMonitor";
import ThemeToggle from "./components/ui/ThemeToggle";
import { LiquidCard } from "./components/ui/LiquidGlass";

export default function Home() {
  const [people, setPeople] = useState([]);
  const [activeTab, setActiveTab] = useState('table');
  const [isLoaded, setIsLoaded] = useState(false);

  // API Monitor easter egg state
  const [forceShowApiMonitor, setForceShowApiMonitor] = useState(false);
  const apiMonitorRef = useRef(null);

  // Custom hooks
  const { toast, showToast, hideToast } = useToast();
  const { canUndo, saveUndoState, handleUndo } = useUndo(showToast);

  // Track original values for change detection
  const [originalValues, setOriginalValues] = useState({});

  // Keyboard shortcut easter egg: Ctrl+Shift+A to toggle API monitor
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'A') {
        event.preventDefault();
        setForceShowApiMonitor(prev => {
          const newState = !prev;
          if (newState) {
            console.log('%c🎉 Developer Easter Egg Activated!', 'color: #ff6b35; font-size: 16px; font-weight: bold;');
            console.log('%c🔓 Hidden API Monitor unlocked with Ctrl+Shift+A', 'color: #4CAF50; font-weight: bold;');
            showToast('🔓 Developer secret unlocked!', 'info');
          } else {
            console.log('%c🔒 Hidden API Monitor concealed', 'color: #666; font-weight: bold;');
            showToast('🔒 Developer mode hidden', 'info');
          }
          return newState;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showToast]);

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
        showToast('Welcome to ConnectNet! Add your first contact to get started.', 'info');
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

  const getTabSubtitle = () => {
    switch (activeTab) {
      case 'table':
        return 'Manage and track your personal connections';
      case 'graph':
        return 'Visualize your network relationships';
      case 'globe':
        return 'Explore your global connections';
      case 'timezone':
        return 'See when your contacts are available across timezones';
      default:
        return 'Your personal network hub';
    }
  };

  // Show loading state until data is loaded
  if (!isLoaded) {
    return (
      <main className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-900 transition-colors duration-200">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading your network...</p>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen relative">
      {/* Liquid background with nostalgic gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-purple-25 to-pink-50 dark:from-gray-900 dark:via-blue-950 dark:to-purple-950 transition-all duration-500"></div>

      {/* Floating orbs for ambiance */}
      <div className="fixed top-20 left-20 w-64 h-64 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="fixed bottom-20 right-20 w-96 h-96 bg-gradient-to-r from-pink-400/15 to-orange-400/15 rounded-full blur-3xl animate-pulse delay-1000"></div>

      <main className="relative z-10 container-liquid py-8">
        {/* Tab Navigation */}
        <TabNavigation
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          canUndo={canUndo}
        />

        <header className="my-8">
          <LiquidCard morphIn floating className="border-0">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                  🌐 ConnectNet
                </h1>
                <h2 className="text-xl text-gray-700 dark:text-gray-300 font-medium">
                  {getTabSubtitle()}
                </h2>
                <p className="text-base text-gray-600 dark:text-gray-400 mt-2">
                  {people.length === 0
                    ? 'Your network is empty. Add your first contact below!'
                    : `${people.length} contact${people.length === 1 ? '' : 's'} in your network`
                  }
                </p>
              </div>
              <ThemeToggle />
            </div>
          </LiquidCard>
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
        ) : activeTab === 'graph' ? (
          <GraphView people={people} />
        ) : activeTab === 'globe' ? (
          <GlobeView people={people} />
        ) : activeTab === 'timezone' ? (
          <TimezoneChart people={people} />
        ) : null}

        {/* Floating Quick Note Button */}
        <QuickNote
          people={people}
          setPeople={setPeople}
          showToast={showToast}
          saveUndoState={saveUndoState}
        />

        {/* Toast Notification */}
        <Toast toast={toast} onClose={hideToast} />

        {/* API Usage Monitor */}
        <ApiUsageMonitor ref={apiMonitorRef} forceVisible={forceShowApiMonitor} />
      </main>
    </div>
  );
}

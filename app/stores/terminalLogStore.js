import { create } from 'zustand';

// Load saved calls from localStorage (SSR-safe)
const loadSavedApiCalls = () => {
    try {
        if (typeof window === 'undefined' || !window.localStorage) {
            return 0;
        }
        const saved = localStorage.getItem('cityService_savedApiCalls');
        return saved ? parseInt(saved, 10) : 0;
    } catch (error) {
        console.warn('Failed to load saved API calls count:', error);
        return 0;
    }
};

// Save saved calls to localStorage (SSR-safe)
const saveSavedApiCalls = (count) => {
    try {
        if (typeof window === 'undefined' || !window.localStorage) {
            return;
        }
        localStorage.setItem('cityService_savedApiCalls', count.toString());
    } catch (error) {
        console.warn('Failed to save API calls count:', error);
    }
};

const useTerminalLogStore = create((set, get) => ({
    logs: [],
    maxLogs: 50, // Keep last 50 logs
    savedApiCalls: loadSavedApiCalls(), // Load from localStorage on init

    // Add a new log entry
    addLog: (logEntry) => {
        const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
        const logWithTimestamp = { ...logEntry, timestamp, id: Date.now() + Math.random() };

        set((state) => ({
            logs: [...state.logs.slice(-(state.maxLogs - 1)), logWithTimestamp]
        }));
    },

    // Increment saved API calls counter and persist to localStorage
    incrementSavedCalls: () => {
        set((state) => {
            const newCount = state.savedApiCalls + 1;
            saveSavedApiCalls(newCount); // Persist to localStorage
            return { savedApiCalls: newCount };
        });
    },

    // Clear all logs
    clearLogs: () => set({ logs: [] }),

    // Reset saved calls counter and clear from localStorage
    resetSavedCalls: () => {
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                localStorage.removeItem('cityService_savedApiCalls');
            }
        } catch (error) {
            console.warn('Failed to clear saved API calls from localStorage:', error);
        }
        set({ savedApiCalls: 0 });
    },

    // Get logs count
    getLogsCount: () => get().logs.length,

    // Get saved calls count
    getSavedCalls: () => get().savedApiCalls,

    // Initialize with welcome message
    initializeLogs: () => {
        const currentLogs = get().logs;
        if (currentLogs.length === 0) {
            const welcomeLog = {
                timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
                type: 'system',
                message: 'City API logger initialized. Start searching to see live requests!',
                id: 'welcome-' + Date.now()
            };
            set({ logs: [welcomeLog] });
        }
    }
}));

export default useTerminalLogStore; 
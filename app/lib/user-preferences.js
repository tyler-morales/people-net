// User preferences management system
// Handles saving and loading user preferences from localStorage

const PREFERENCES_KEY = 'peopleNet_userPreferences';

// Default preferences structure
const DEFAULT_PREFERENCES = {
    table: {
        columnOrder: [
            { id: 'select', key: 'select', label: '', sortable: false, width: 'w-12' },
            { id: 'name', key: 'name', label: 'Name', sortable: true, width: 'w-48' },
            { id: 'company', key: 'company', label: 'Company', sortable: false, width: 'w-40' },
            { id: 'role', key: 'role', label: 'Role', sortable: false, width: 'w-32' },
            { id: 'date', key: 'date', label: 'Date Met', sortable: true, width: 'w-32' },
            { id: 'strength', key: 'strength', label: 'Connection Strength', sortable: false, width: 'w-40' },
            { id: 'actions', key: 'actions', label: 'Actions', sortable: false, width: 'w-24' }
        ],
        density: 'normal', // 'compact', 'normal', 'spacious'
        showColumnFilters: false
    },
    ui: {
        theme: 'light', // 'light', 'dark', 'auto'
        toastPosition: 'bottom-right',
        animationsEnabled: true
    },
    version: '1.0.0' // For future migrations
};

class UserPreferences {
    constructor() {
        this.preferences = null;
        this.initialize();
    }

    // Initialize preferences from localStorage
    initialize() {
        try {
            // Check if we're in browser environment
            if (typeof window === 'undefined' || !window.localStorage) {
                this.preferences = { ...DEFAULT_PREFERENCES };
                return;
            }

            const saved = localStorage.getItem(PREFERENCES_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);

                // Merge with defaults to ensure all keys exist
                this.preferences = this.mergeWithDefaults(parsed);

                // Validate column order integrity
                this.validateColumnOrder();
            } else {
                this.preferences = { ...DEFAULT_PREFERENCES };
            }
        } catch (error) {
            console.warn('Failed to load user preferences:', error);
            this.preferences = { ...DEFAULT_PREFERENCES };
        }
    }

    // Merge saved preferences with defaults
    mergeWithDefaults(saved) {
        const merged = { ...DEFAULT_PREFERENCES };

        if (saved.table) {
            merged.table = { ...merged.table, ...saved.table };
        }
        if (saved.ui) {
            merged.ui = { ...merged.ui, ...saved.ui };
        }
        if (saved.version) {
            merged.version = saved.version;
        }

        return merged;
    }

    // Validate that column order has all required columns
    validateColumnOrder() {
        const currentColumns = this.preferences.table.columnOrder;
        const defaultColumns = DEFAULT_PREFERENCES.table.columnOrder;

        // Check if we have all required columns
        const hasAllColumns = defaultColumns.every(defaultCol =>
            currentColumns.some(currentCol => currentCol.id === defaultCol.id)
        );

        if (!hasAllColumns) {
            console.warn('Column order missing required columns, resetting to default');
            this.preferences.table.columnOrder = [...defaultColumns];
            this.save();
        }
    }

    // Save preferences to localStorage
    save() {
        try {
            if (typeof window === 'undefined' || !window.localStorage) {
                return;
            }

            localStorage.setItem(PREFERENCES_KEY, JSON.stringify(this.preferences));
        } catch (error) {
            console.warn('Failed to save user preferences:', error);
        }
    }

    // Get column order
    getColumnOrder() {
        return this.preferences.table.columnOrder;
    }

    // Set column order
    setColumnOrder(columnOrder) {
        this.preferences.table.columnOrder = columnOrder;
        this.save();
    }

    // Check if column order is default
    isDefaultColumnOrder() {
        const current = this.preferences.table.columnOrder;
        const defaults = DEFAULT_PREFERENCES.table.columnOrder;

        if (current.length !== defaults.length) return false;

        return current.every((col, index) =>
            col.id === defaults[index].id
        );
    }

    // Reset column order to default
    resetColumnOrder() {
        this.preferences.table.columnOrder = [...DEFAULT_PREFERENCES.table.columnOrder];
        this.save();
    }

    // Get specific preference
    get(path) {
        const keys = path.split('.');
        let value = this.preferences;

        for (const key of keys) {
            if (value && typeof value === 'object' && key in value) {
                value = value[key];
            } else {
                return undefined;
            }
        }

        return value;
    }

    // Set specific preference
    set(path, value) {
        const keys = path.split('.');
        let current = this.preferences;

        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (!(key in current) || typeof current[key] !== 'object') {
                current[key] = {};
            }
            current = current[key];
        }

        current[keys[keys.length - 1]] = value;
        this.save();
    }

    // Export preferences for backup/sharing
    export() {
        return JSON.stringify(this.preferences, null, 2);
    }

    // Import preferences from backup
    import(preferencesJson) {
        try {
            const imported = JSON.parse(preferencesJson);
            this.preferences = this.mergeWithDefaults(imported);
            this.validateColumnOrder();
            this.save();
            return true;
        } catch (error) {
            console.error('Failed to import preferences:', error);
            return false;
        }
    }

    // Reset all preferences to defaults
    reset() {
        this.preferences = { ...DEFAULT_PREFERENCES };
        this.save();
    }
}

// Create singleton instance
const userPreferences = new UserPreferences();

export default userPreferences; 
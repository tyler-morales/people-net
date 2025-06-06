import { useState, useEffect } from 'react';

export default function FilterPresets({
    globalSearch,
    columnFilters,
    onLoadPreset,
    hasActiveFilters
}) {
    const [savedPresets, setSavedPresets] = useState([]);
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [presetName, setPresetName] = useState('');

    // Load saved presets from localStorage
    useEffect(() => {
        try {
            const saved = localStorage.getItem('peopleNet-filterPresets');
            if (saved) {
                setSavedPresets(JSON.parse(saved));
            }
        } catch (error) {
            console.error('Error loading filter presets:', error);
        }
    }, []);

    // Save presets to localStorage when they change
    const savePresetsToStorage = (presets) => {
        try {
            localStorage.setItem('peopleNet-filterPresets', JSON.stringify(presets));
            setSavedPresets(presets);
        } catch (error) {
            console.error('Error saving filter presets:', error);
        }
    };

    const saveCurrentPreset = () => {
        if (!presetName.trim() || !hasActiveFilters) return;

        const newPreset = {
            id: Date.now(),
            name: presetName.trim(),
            globalSearch,
            columnFilters,
            createdAt: new Date().toISOString()
        };

        const updatedPresets = [...savedPresets, newPreset];
        savePresetsToStorage(updatedPresets);

        setPresetName('');
        setShowSaveDialog(false);
    };

    const loadPreset = (preset) => {
        onLoadPreset(preset.globalSearch, preset.columnFilters);
    };

    const deletePreset = (presetId) => {
        const updatedPresets = savedPresets.filter(p => p.id !== presetId);
        savePresetsToStorage(updatedPresets);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString();
    };

    if (!hasActiveFilters && savedPresets.length === 0) {
        return null;
    }

    return (
        <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-700">Filter Presets</h3>

                {hasActiveFilters && (
                    <button
                        onClick={() => setShowSaveDialog(true)}
                        className="text-sm text-blue-600 hover:text-blue-800 underline"
                    >
                        Save current filters
                    </button>
                )}
            </div>

            {/* Save Dialog */}
            {showSaveDialog && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={presetName}
                            onChange={(e) => setPresetName(e.target.value)}
                            placeholder="Enter preset name..."
                            className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') saveCurrentPreset();
                                if (e.key === 'Escape') setShowSaveDialog(false);
                            }}
                            autoFocus
                        />
                        <button
                            onClick={saveCurrentPreset}
                            disabled={!presetName.trim()}
                            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Save
                        </button>
                        <button
                            onClick={() => setShowSaveDialog(false)}
                            className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Saved Presets */}
            {savedPresets.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {savedPresets.map(preset => (
                        <div
                            key={preset.id}
                            className="group inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-sm"
                        >
                            <button
                                onClick={() => loadPreset(preset)}
                                className="text-gray-700 hover:text-gray-900"
                                title={`Created ${formatDate(preset.createdAt)}`}
                            >
                                {preset.name}
                            </button>
                            <button
                                onClick={() => deletePreset(preset.id)}
                                className="text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                aria-label={`Delete ${preset.name} preset`}
                            >
                                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
} 
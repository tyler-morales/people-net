export default function FilterStatusBar({
    globalSearch,
    columnFilters,
    hasActiveFilters,
    filteredCount,
    totalCount,
    clearAllFilters,
    clearFilter,
    updateColumnFilter
}) {
    if (!hasActiveFilters) {
        return null;
    }

    // Get active filters for display
    const activeFilters = [];

    if (globalSearch) {
        activeFilters.push({
            type: 'global',
            label: 'Global Search',
            value: globalSearch
        });
    }

    // Add column filters
    Object.entries(columnFilters).forEach(([key, value]) => {
        if (key === 'dateRange') {
            if (value.start || value.end) {
                const dateDisplay = value.start && value.end
                    ? `${value.start} to ${value.end}`
                    : value.start
                        ? `From ${value.start}`
                        : `Until ${value.end}`;
                activeFilters.push({
                    type: key,
                    label: 'Date Range',
                    value: dateDisplay
                });
            }
        } else if (Array.isArray(value)) {
            // Handle multi-select filters
            if (value.length > 0) {
                const labels = {
                    company: 'Company',
                    role: 'Role',
                    team: 'Team',
                    location: 'Location'
                };

                // Add each selected value as a separate filter chip
                value.forEach(selectedValue => {
                    activeFilters.push({
                        type: key,
                        label: labels[key] || key,
                        value: selectedValue,
                        isMultiSelect: true
                    });
                });
            }
        } else if (value) {
            // Handle single-select filters
            const labels = {
                connectionStrength: 'Connection Strength',
                connectionType: 'Connection Type'
            };
            activeFilters.push({
                type: key,
                label: labels[key] || key,
                value: value
            });
        }
    });

    return (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    {/* Results count */}
                    <div className="text-sm text-blue-800 mb-2">
                        Showing {filteredCount} of {totalCount} people
                    </div>

                    {/* Active filters */}
                    <div className="flex flex-wrap gap-2">
                        {activeFilters.map((filter, index) => (
                            <div
                                key={`${filter.type}-${filter.value}-${index}`}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                            >
                                <span className="font-medium">{filter.label}:</span>
                                <span className="truncate max-w-32">{filter.value}</span>
                                <button
                                    onClick={() => {
                                        if (filter.isMultiSelect) {
                                            // For multi-select, remove just this value
                                            const currentValues = columnFilters[filter.type];
                                            const newValues = currentValues.filter(v => v !== filter.value);
                                            updateColumnFilter(filter.type, newValues);
                                        } else {
                                            // For single-select, clear the entire filter
                                            clearFilter(filter.type);
                                        }
                                    }}
                                    className="ml-1 text-blue-600 hover:text-blue-800 flex-shrink-0"
                                    aria-label={`Clear ${filter.label} filter: ${filter.value}`}
                                >
                                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Clear all button */}
                <button
                    onClick={clearAllFilters}
                    className="ml-3 px-3 py-1 text-sm text-blue-600 hover:text-blue-800 border border-blue-300 hover:border-blue-400 rounded"
                >
                    Clear All
                </button>
            </div>
        </div>
    );
} 
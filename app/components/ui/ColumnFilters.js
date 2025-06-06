import { useState } from 'react';
import SearchableDropdown from './SearchableDropdown';
import MultiSelectDropdown from './MultiSelectDropdown';
import DynamicMultiSelectCity from './DynamicMultiSelectCity';

// Select Filter Component (keeping for connection strength/type since they have fixed options)
export function SelectFilter({
    value,
    onChange,
    options,
    label,
    placeholder = "All",
    onClear
}) {
    return (
        <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-700">
                {label}
            </label>
            <div className="relative">
                <select
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                    <option value="">{placeholder}</option>
                    {options.map(option => (
                        <option key={option} value={option}>
                            {option.charAt(0).toUpperCase() + option.slice(1).replace('_', ' ')}
                        </option>
                    ))}
                </select>
                {value && (
                    <button
                        onClick={onClear}
                        className="absolute inset-y-0 right-8 pr-2 flex items-center text-gray-400 hover:text-gray-600"
                        aria-label={`Clear ${label} filter`}
                    >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>
        </div>
    );
}

// Date Range Filter Component
export function DateRangeFilter({
    startDate,
    endDate,
    onChange,
    label,
    onClear
}) {
    return (
        <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-700">
                {label}
            </label>
            <div className="flex gap-2">
                <input
                    type="date"
                    value={startDate}
                    onChange={(e) => onChange(e.target.value, endDate)}
                    className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="From"
                />
                <input
                    type="date"
                    value={endDate}
                    onChange={(e) => onChange(startDate, e.target.value)}
                    className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="To"
                />
                {(startDate || endDate) && (
                    <button
                        onClick={onClear}
                        className="px-2 flex items-center text-gray-400 hover:text-gray-600"
                        aria-label={`Clear ${label} filter`}
                    >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>
        </div>
    );
}

// Main Column Filters Container
export default function ColumnFilters({
    columnFilters,
    updateColumnFilter,
    updateDateRangeFilter,
    clearFilter,
    getUniqueValues,
    isVisible,
    onToggle
}) {
    if (!isVisible) {
        return (
            <div className="">
                <button
                    onClick={onToggle}
                    className="text-sm text-blue-600 hover:text-blue-800 underline cursor-pointer"
                >
                    Advanced Filters
                </button>
            </div>
        );
    }

    return (
        <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-900">Column Filters</h3>
                <button
                    onClick={onToggle}
                    className="text-sm text-gray-500 hover:text-gray-700 cursor-pointer"
                >
                    Hide filters
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MultiSelectDropdown
                    values={columnFilters.company}
                    onChange={(values) => updateColumnFilter('company', values)}
                    options={getUniqueValues('company')}
                    placeholder="Search companies..."
                    label="Company"
                    onClear={() => clearFilter('company')}
                    allowCustom={true}
                />

                <MultiSelectDropdown
                    values={columnFilters.role}
                    onChange={(values) => updateColumnFilter('role', values)}
                    options={getUniqueValues('role')}
                    placeholder="Search roles..."
                    label="Role"
                    onClear={() => clearFilter('role')}
                    allowCustom={true}
                />

                <MultiSelectDropdown
                    values={columnFilters.team}
                    onChange={(values) => updateColumnFilter('team', values)}
                    options={getUniqueValues('team')}
                    placeholder="Search teams..."
                    label="Team"
                    onClear={() => clearFilter('team')}
                    allowCustom={true}
                />

                <DynamicMultiSelectCity
                    values={columnFilters.location}
                    onChange={(values) => updateColumnFilter('location', values)}
                    placeholder="Search cities..."
                    label="Location"
                    onClear={() => clearFilter('location')}
                />

                <SelectFilter
                    value={columnFilters.connectionStrength}
                    onChange={(value) => updateColumnFilter('connectionStrength', value)}
                    options={['fleeting', 'acquaintance', 'casual', 'working', 'strong', 'core']}
                    label="Connection Strength"
                    placeholder="All strengths"
                    onClear={() => clearFilter('connectionStrength')}
                />

                <SelectFilter
                    value={columnFilters.connectionType}
                    onChange={(value) => updateColumnFilter('connectionType', value)}
                    options={['collaborated', 'mentored', 'coordinated', 'reviewed_code', 'led_meeting', 'inspired_me']}
                    label="Connection Type"
                    placeholder="All types"
                    onClear={() => clearFilter('connectionType')}
                />

                <DateRangeFilter
                    startDate={columnFilters.dateRange.start}
                    endDate={columnFilters.dateRange.end}
                    onChange={updateDateRangeFilter}
                    label="Date Met Range"
                    onClear={() => clearFilter('dateRange')}
                />
            </div>
        </div>
    );
} 
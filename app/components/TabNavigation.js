'use client'

export default function TabNavigation({ activeTab, setActiveTab, canUndo }) {
    return (
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
            <button
                onClick={() => setActiveTab('globe')}
                className={`pb-2 px-1 border-b-2 transition-colors ${activeTab === 'globe'
                    ? 'border-blue-500 text-blue-600 font-semibold'
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                    }`}
            >
                🌍 Globe
            </button>

            {/* Undo indicator */}
            {canUndo && (
                <div className="ml-auto flex items-center text-sm text-gray-500">
                    <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">
                        {typeof window !== 'undefined' && window.navigator.userAgent.toLowerCase().includes('mac') ? '⌘' : 'Ctrl'}+Z
                    </kbd>
                    <span className="ml-2">to undo</span>
                </div>
            )}
        </div>
    );
} 
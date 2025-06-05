export default function BatchActionsBar({
    selectedCount,
    onBatchDelete,
    onClearSelection
}) {
    if (selectedCount === 0) {
        return null;
    }

    return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <span className="text-blue-800 font-medium">
                    {selectedCount} {selectedCount === 1 ? 'person' : 'people'} selected
                </span>
                <button
                    onClick={onClearSelection}
                    className="text-blue-600 hover:text-blue-800 underline text-sm cursor-pointer"
                >
                    Clear selection
                </button>
            </div>
            <div className="flex items-center gap-2">
                <button
                    onClick={onBatchDelete}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium cursor-pointer flex items-center gap-2"
                >
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <polyline points="3,6 5,6 21,6"></polyline>
                        <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                    Delete Selected
                </button>
            </div>
        </div>
    );
} 
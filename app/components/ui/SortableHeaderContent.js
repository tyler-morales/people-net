export default function SortableHeaderContent({
    children,
    sortKey,
    currentSort,
    onSortChange,
    className = ""
}) {
    const handleSort = () => {
        const ascKey = `${sortKey}-asc`;
        const descKey = `${sortKey}-desc`;

        if (currentSort === ascKey) {
            onSortChange(descKey);
        } else {
            onSortChange(ascKey);
        }
    };

    const getSortIcon = () => {
        if (currentSort === `${sortKey}-asc`) {
            return <span className="text-blue-600">↑</span>;
        }
        if (currentSort === `${sortKey}-desc`) {
            return <span className="text-blue-600">↓</span>;
        }
        return <span className="text-gray-400">↕</span>;
    };

    return (
        <button
            onClick={handleSort}
            className={`flex items-center gap-1 hover:text-blue-700 cursor-pointer ${className}`}
        >
            {children}
            {getSortIcon()}
        </button>
    );
} 
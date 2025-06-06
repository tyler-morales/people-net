import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import SortableHeaderContent from './SortableHeaderContent';
import ConnectionStrengthTooltip from './ConnectionStrengthTooltip';
import SelectionCheckbox from './SelectionCheckbox';

export default function DraggableTableHeader({
    column,
    children,
    currentSort,
    onSortChange,
    // Selection props (for select column)
    checked,
    indeterminate,
    onChange,
    // Drag props
    isDragging = false,
    className = ''
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging: isSortableDragging,
    } = useSortable({
        id: column.id,
        disabled: column.id === 'select' || column.id === 'actions' // Disable drag for these columns
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isSortableDragging ? 0.5 : 1,
    };

    // Special handling for different column types
    const renderColumnContent = () => {
        switch (column.id) {
            case 'select':
                return (
                    <SelectionCheckbox
                        checked={checked}
                        indeterminate={indeterminate}
                        onChange={onChange}
                        aria-label="Select all people"
                    />
                );

            case 'strength':
                return (
                    <span className="flex items-center gap-1">
                        {column.label}
                        <ConnectionStrengthTooltip />
                    </span>
                );

            default:
                if (column.sortable) {
                    return (
                        <SortableHeaderContent
                            sortKey={column.key}
                            currentSort={currentSort}
                            onSortChange={onSortChange}
                        >
                            {column.label}
                        </SortableHeaderContent>
                    );
                }
                return column.label;
        }
    };

    const isDraggable = column.id !== 'select' && column.id !== 'actions';

    return (
        <th
            ref={setNodeRef}
            style={style}
            className={`text-left p-2 border-b ${column.width} ${className} ${isDraggable ? 'cursor-move hover:bg-blue-200 transition-colors' : ''
                } ${isSortableDragging ? 'z-10 shadow-lg' : ''}`}
            {...(isDraggable ? { ...attributes, ...listeners } : {})}
            title={isDraggable ? 'Drag to reorder column' : ''}
        >
            <div className="flex items-center gap-2">
                {isDraggable && (
                    <span className="text-gray-400 hover:text-gray-600 text-sm">
                        ⋮⋮
                    </span>
                )}
                <div className="flex-1">
                    {renderColumnContent()}
                </div>
            </div>
        </th>
    );
} 
import { useState, useEffect } from 'react';

export default function ColumnReorderNotification({
    show,
    onAnimationComplete
}) {
    const [isVisible, setIsVisible] = useState(false);
    const [shouldRender, setShouldRender] = useState(false);

    useEffect(() => {
        if (show) {
            setShouldRender(true);
            // Trigger animation after render
            setTimeout(() => setIsVisible(true), 10);

            // Auto-hide after 4 seconds
            const hideTimer = setTimeout(() => {
                setIsVisible(false);
                // Remove from DOM after animation completes
                setTimeout(() => {
                    setShouldRender(false);
                    onAnimationComplete?.();
                }, 300);
            }, 4000);

            return () => clearTimeout(hideTimer);
        }
    }, [show, onAnimationComplete]);

    if (!shouldRender) return null;

    return (
        <div
            className={`
                fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50
                px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg shadow-lg
                transition-all duration-300 ease-out
                ${isVisible
                    ? 'translate-y-0 opacity-100'
                    : 'translate-y-4 opacity-0'
                }
            `}
        >
            <div className="flex items-center gap-2 text-sm text-blue-800">
                <span className="text-lg">✨</span>
                <span className="font-medium">
                    Columns have been reordered. Your layout is automatically saved.
                </span>
            </div>
        </div>
    );
} 
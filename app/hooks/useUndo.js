'use client'
import { useState, useEffect } from 'react';

export function useUndo(showToast) {
    const [undoHistory, setUndoHistory] = useState([]);
    const [canUndo, setCanUndo] = useState(false);

    // Save state before making changes
    const saveUndoState = (action, targetId = null, fieldName = null, oldValue = null, currentPeople) => {
        const undoState = {
            timestamp: Date.now(),
            action,
            targetId,
            fieldName,
            oldValue,
            previousPeople: JSON.parse(JSON.stringify(currentPeople)) // Deep copy
        };

        setUndoHistory(prev => {
            const newHistory = [...prev, undoState];
            // Keep only last 10 actions to prevent memory issues
            return newHistory.slice(-10);
        });
        setCanUndo(true);
    };

    const handleUndo = (setPeople) => {
        if (undoHistory.length === 0) return null;

        const lastAction = undoHistory[undoHistory.length - 1];
        setPeople(lastAction.previousPeople);

        // Remove the last action from history
        setUndoHistory(prev => prev.slice(0, -1));
        setCanUndo(undoHistory.length > 1);

        // Generate undo message
        let undoMessage = 'Undid last action';
        if (lastAction.action === 'update' && lastAction.targetId) {
            const person = lastAction.previousPeople.find(p => p.id === lastAction.targetId);
            undoMessage = `Undid update to ${person?.name || 'person'}`;
        } else if (lastAction.action === 'delete' && lastAction.targetId) {
            undoMessage = `Restored ${lastAction.oldValue}`;
        } else if (lastAction.action === 'add' && lastAction.oldValue) {
            undoMessage = `Removed ${lastAction.oldValue}`;
        } else if (lastAction.action === 'batchDelete') {
            undoMessage = `Restored ${lastAction.oldValue}`;
        }

        showToast(undoMessage, 'info');
        return lastAction.previousPeople;
    };

    // Keyboard shortcut for undo
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Check for Cmd+Z (Mac) or Ctrl+Z (Windows/Linux)
            if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                return true; // Signal that undo should be triggered
            }
            return false;
        };

        const listener = (e) => {
            if (handleKeyDown(e)) {
                // Dispatch custom event that parent can listen to
                window.dispatchEvent(new CustomEvent('undo-requested'));
            }
        };

        window.addEventListener('keydown', listener);
        return () => window.removeEventListener('keydown', listener);
    }, []);

    return { undoHistory, canUndo, saveUndoState, handleUndo };
} 
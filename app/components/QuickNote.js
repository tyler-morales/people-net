'use client'
import { useState, useRef, useEffect } from 'react';

export default function QuickNote({ people, setPeople, showToast, saveUndoState }) {
    const [isOpen, setIsOpen] = useState(false);
    const [noteText, setNoteText] = useState('');
    const [textParts, setTextParts] = useState([]); // Array of {text, isTagged, personId, type}
    const [currentSuggestion, setCurrentSuggestion] = useState(null);
    const [currentDaySuggestion, setCurrentDaySuggestion] = useState(null);
    const [selectedDay, setSelectedDay] = useState(null); // Store selected day of week
    const [cursorPosition, setCursorPosition] = useState(0);
    const textareaRef = useRef(null);

    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    // Parse text for potential name matches (less sensitive - first 3 letters)
    const findNameSuggestion = (word) => {
        if (!word || word.length < 3) return null;

        const wordLower = word.toLowerCase();

        // Get list of already tagged person IDs
        const taggedPersonIds = new Set(
            textParts.filter(part => part.isTagged && part.type === 'person').map(part => part.personId)
        );

        // Find people whose names start with the first 3 letters of the word
        const matches = people.filter(person => {
            // Skip if this person is already tagged
            if (taggedPersonIds.has(person.id)) return false;

            const nameWords = person.name.toLowerCase().split(' ');
            return nameWords.some(nameWord =>
                nameWord.startsWith(wordLower.substring(0, 3))
            );
        });

        // Return the first match
        return matches[0] || null;
    };

    // Parse text for day of week matches
    const findDaySuggestion = (word) => {
        if (!word || word.length < 3) return null;

        const wordLower = word.toLowerCase();

        // Check if we already have a day selected
        if (selectedDay) return null;

        // Find day that starts with the first 3 letters
        const matchingDay = daysOfWeek.find(day =>
            day.toLowerCase().startsWith(wordLower.substring(0, 3))
        );

        return matchingDay || null;
    };

    // Calculate date for a given day of the week
    const getDateForDay = (dayName) => {
        const today = new Date();
        const todayDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
        const targetDay = daysOfWeek.indexOf(dayName) + 1; // Convert to 1-7 where Monday = 1
        const adjustedTargetDay = targetDay === 7 ? 0 : targetDay; // Convert Sunday to 0

        // Calculate days difference (prefer past dates, but allow current day)
        let daysDiff = todayDay - adjustedTargetDay;
        if (daysDiff < 0) {
            daysDiff += 7; // Go to previous week
        }

        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() - daysDiff);

        return targetDate.toISOString().split('T')[0];
    };

    // Get current word being typed
    const getCurrentWord = (text, position) => {
        const beforeCursor = text.substring(0, position);
        const afterCursor = text.substring(position);

        const wordStart = Math.max(
            beforeCursor.lastIndexOf(' ') + 1,
            beforeCursor.lastIndexOf('\n') + 1
        );

        const wordEnd = afterCursor.search(/[\s\n]/);
        const actualWordEnd = wordEnd === -1 ? text.length : position + wordEnd;

        return {
            word: text.substring(wordStart, actualWordEnd),
            startPos: wordStart,
            endPos: actualWordEnd
        };
    };

    // Handle text change
    const handleTextChange = (e) => {
        const text = e.target.value;
        const position = e.target.selectionStart;

        setNoteText(text);
        setCursorPosition(position);

        // Clean up textParts - remove any tagged people whose names are no longer in the text
        setTextParts(prev => prev.filter(part => {
            if (!part.isTagged) return true;

            if (part.type === 'person') {
                // Check if this person's name is still in the current text
                const person = people.find(p => p.id === part.personId);
                if (!person) return false;

                // Check if the person's name still exists in the text (case insensitive)
                return text.toLowerCase().includes(person.name.toLowerCase());
            } else if (part.type === 'day') {
                // Check if the day is still in the text
                return text.toLowerCase().includes(part.text.toLowerCase());
            }

            return true;
        }));

        // Check if selected day is still in text, if not clear it
        if (selectedDay && !text.toLowerCase().includes(selectedDay.toLowerCase())) {
            setSelectedDay(null);
        }

        // Get current word being typed
        const currentWord = getCurrentWord(text, position);

        // Find suggestion for current word (prioritize names over days)
        if (currentWord.word.length >= 3) {
            const nameSuggestion = findNameSuggestion(currentWord.word);
            const daySuggestion = findDaySuggestion(currentWord.word);

            if (nameSuggestion) {
                setCurrentSuggestion({
                    ...nameSuggestion,
                    wordStart: currentWord.startPos,
                    wordEnd: currentWord.endPos,
                    partialWord: currentWord.word,
                    type: 'person'
                });
                setCurrentDaySuggestion(null);
            } else if (daySuggestion) {
                setCurrentDaySuggestion({
                    name: daySuggestion,
                    wordStart: currentWord.startPos,
                    wordEnd: currentWord.endPos,
                    partialWord: currentWord.word,
                    type: 'day'
                });
                setCurrentSuggestion(null);
            } else {
                setCurrentSuggestion(null);
                setCurrentDaySuggestion(null);
            }
        } else {
            setCurrentSuggestion(null);
            setCurrentDaySuggestion(null);
        }
    };

    // Handle cursor position changes
    const handleSelectionChange = () => {
        if (textareaRef.current) {
            const position = textareaRef.current.selectionStart;
            setCursorPosition(position);

            // Update suggestion based on new cursor position
            const currentWord = getCurrentWord(noteText, position);
            if (currentWord.word.length >= 3) {
                const nameSuggestion = findNameSuggestion(currentWord.word);
                const daySuggestion = findDaySuggestion(currentWord.word);

                if (nameSuggestion) {
                    setCurrentSuggestion({
                        ...nameSuggestion,
                        wordStart: currentWord.startPos,
                        wordEnd: currentWord.endPos,
                        partialWord: currentWord.word,
                        type: 'person'
                    });
                    setCurrentDaySuggestion(null);
                } else if (daySuggestion) {
                    setCurrentDaySuggestion({
                        name: daySuggestion,
                        wordStart: currentWord.startPos,
                        wordEnd: currentWord.endPos,
                        partialWord: currentWord.word,
                        type: 'day'
                    });
                    setCurrentSuggestion(null);
                } else {
                    setCurrentSuggestion(null);
                    setCurrentDaySuggestion(null);
                }
            } else {
                setCurrentSuggestion(null);
                setCurrentDaySuggestion(null);
            }
        }
    };

    // Handle key presses
    const handleKeyDown = (e) => {
        if ((currentSuggestion || currentDaySuggestion) && e.key === 'Tab') {
            e.preventDefault();

            const activeSuggestion = currentSuggestion || currentDaySuggestion;

            // Replace the partial word with the full name/day
            const beforeWord = noteText.substring(0, activeSuggestion.wordStart);
            const afterWord = noteText.substring(activeSuggestion.wordEnd);
            const newText = beforeWord + activeSuggestion.name + ' ' + afterWord;

            setNoteText(newText);

            if (currentSuggestion) {
                // Add person to text parts for styling
                setTextParts(prev => [
                    ...prev,
                    {
                        text: currentSuggestion.name,
                        isTagged: true,
                        personId: currentSuggestion.id,
                        startPos: currentSuggestion.wordStart,
                        endPos: currentSuggestion.wordStart + currentSuggestion.name.length,
                        type: 'person'
                    }
                ]);
            } else if (currentDaySuggestion) {
                // Set selected day
                setSelectedDay(currentDaySuggestion.name);

                // Add day to text parts for tracking
                setTextParts(prev => [
                    ...prev,
                    {
                        text: currentDaySuggestion.name,
                        isTagged: true,
                        startPos: currentDaySuggestion.wordStart,
                        endPos: currentDaySuggestion.wordStart + currentDaySuggestion.name.length,
                        type: 'day'
                    }
                ]);
            }

            setCurrentSuggestion(null);
            setCurrentDaySuggestion(null);

            // Set cursor position after the inserted name/day and space
            setTimeout(() => {
                const newPosition = activeSuggestion.wordStart + activeSuggestion.name.length + 1;
                textareaRef.current?.setSelectionRange(newPosition, newPosition);
                setCursorPosition(newPosition);
            }, 0);
        } else if (e.key === 'Escape') {
            e.preventDefault();

            if (currentSuggestion || currentDaySuggestion) {
                // First escape: clear current suggestion
                setCurrentSuggestion(null);
                setCurrentDaySuggestion(null);
            } else if (textParts.some(part => part.isTagged)) {
                // Second escape (or first if no suggestion): clear all tagged people/days
                setTextParts([]);
                setSelectedDay(null);
                showToast('All tagged items cleared', 'info');
            }
        }
    };

    // Get display text with inline suggestions
    const getDisplayText = () => {
        const activeSuggestion = currentSuggestion || currentDaySuggestion;
        if (!activeSuggestion) return noteText;

        const beforeWord = noteText.substring(0, activeSuggestion.wordStart);
        const afterWord = noteText.substring(activeSuggestion.wordEnd);
        const suggestion = activeSuggestion.name.substring(activeSuggestion.partialWord.length);

        return beforeWord + activeSuggestion.partialWord + suggestion + afterWord;
    };

    // Get all tagged people from the text
    const getTaggedPeople = () => {
        const tagged = new Set();
        textParts.forEach(part => {
            if (part.isTagged && part.type === 'person') {
                const person = people.find(p => p.id === part.personId);
                if (person) tagged.add(person);
            }
        });

        // Also check for current suggestion if it's about to be tagged
        if (currentSuggestion) {
            tagged.add(currentSuggestion);
        }

        return Array.from(tagged);
    };

    // Save the note
    const handleSave = () => {
        if (!noteText.trim()) return;

        const taggedPeople = getTaggedPeople();

        if (taggedPeople.length === 0) {
            showToast('No person detected in the note. Try typing a name and press tab to tag them.', 'error');
            return;
        }

        // Determine the date to use
        const noteDate = selectedDay ? getDateForDay(selectedDay) : new Date().toISOString().split('T')[0];

        // If multiple people are tagged, add note to all of them
        let successCount = 0;

        taggedPeople.forEach(person => {
            // Save undo state for each person
            saveUndoState('update', person.id, 'interactions', 'Added quick note', people);

            // Add note to person's interactions
            const newInteraction = {
                text: noteText.trim(),
                date: noteDate,
                type: 'quick_note'
            };

            setPeople(prev =>
                prev.map(p =>
                    p.id === person.id
                        ? {
                            ...p,
                            interactions: [...p.interactions, newInteraction]
                        }
                        : p
                )
            );

            successCount++;
        });

        // Show success message and reset
        const peopleNames = taggedPeople.map(p => p.name).join(', ');
        const dateMessage = selectedDay ? ` for ${selectedDay} (${noteDate})` : '';
        showToast(`Note added to ${peopleNames}${dateMessage}!`, 'success');

        setNoteText('');
        setTextParts([]);
        setCurrentSuggestion(null);
        setCurrentDaySuggestion(null);
        setSelectedDay(null);
        setIsOpen(false);
    };

    // Focus textarea when modal opens and add global escape listener
    useEffect(() => {
        if (isOpen && textareaRef.current) {
            setTimeout(() => textareaRef.current.focus(), 100);

            // Add global escape key listener for the modal
            const handleGlobalKeyDown = (e) => {
                if (e.key === 'Escape') {
                    e.preventDefault();
                    e.stopPropagation();

                    if (currentSuggestion || currentDaySuggestion) {
                        // First escape: clear current suggestion
                        setCurrentSuggestion(null);
                        setCurrentDaySuggestion(null);
                        showToast('Suggestion cleared', 'info');
                    } else if (textParts.some(part => part.isTagged)) {
                        // Second escape (or first if no suggestion): clear all tagged people/days
                        setTextParts([]);
                        setSelectedDay(null);
                        showToast('All tagged items cleared', 'info');
                    } else {
                        // No suggestions or tagged people: close modal
                        setIsOpen(false);
                        setNoteText('');
                        setTextParts([]);
                        setCurrentSuggestion(null);
                        setCurrentDaySuggestion(null);
                    }
                }
            };

            document.addEventListener('keydown', handleGlobalKeyDown);

            return () => {
                document.removeEventListener('keydown', handleGlobalKeyDown);
            };
        }
    }, [isOpen, currentSuggestion, currentDaySuggestion, textParts]);

    // Add selection change listener
    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.addEventListener('select', handleSelectionChange);
            textarea.addEventListener('click', handleSelectionChange);
            textarea.addEventListener('keyup', handleSelectionChange);

            return () => {
                textarea.removeEventListener('select', handleSelectionChange);
                textarea.removeEventListener('click', handleSelectionChange);
                textarea.removeEventListener('keyup', handleSelectionChange);
            };
        }
    }, [noteText]);

    return (
        <>
            {/* Floating Quick Note Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-4 right-4 bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-full shadow-lg transition-all duration-200 hover:scale-105 z-50"
                title="Quick Note"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
            </button>

            {/* Modal Overlay */}
            {isOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md relative">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b">
                            <h3 className="text-lg font-semibold text-gray-900">Quick Note</h3>
                            <button
                                onClick={() => {
                                    setIsOpen(false);
                                    setNoteText('');
                                    setTextParts([]);
                                    setCurrentSuggestion(null);
                                    setCurrentDaySuggestion(null);
                                    setSelectedDay(null);
                                }}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-4 space-y-4">
                            {/* Tagged People and Day Indicator */}
                            {(getTaggedPeople().length > 0 || selectedDay) && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                    <div className="flex items-center">
                                        <svg className="w-4 h-4 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        <div className="text-sm font-medium text-blue-800">
                                            {getTaggedPeople().length > 0 && (
                                                <div>Will add to: {getTaggedPeople().map(p => p.name).join(', ')}</div>
                                            )}
                                            {selectedDay && (
                                                <div>Date: {selectedDay} ({getDateForDay(selectedDay)})</div>
                                            )}
                                            {!selectedDay && (
                                                <div>Date: Today ({new Date().toISOString().split('T')[0]})</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Text Area with Inline Suggestions */}
                            <div className="relative">
                                {/* Background text with suggestion */}
                                <div className="absolute inset-0 p-3 pointer-events-none text-transparent whitespace-pre-wrap break-words font-mono text-sm leading-6 z-10">
                                    {(currentSuggestion || currentDaySuggestion) && (
                                        <>
                                            {noteText.substring(0, (currentSuggestion || currentDaySuggestion).wordStart)}
                                            <span className="relative">
                                                {(currentSuggestion || currentDaySuggestion).partialWord}
                                                <span className="text-gray-400 opacity-60">
                                                    {(currentSuggestion || currentDaySuggestion).name.substring((currentSuggestion || currentDaySuggestion).partialWord.length)}
                                                </span>
                                            </span>
                                            {noteText.substring((currentSuggestion || currentDaySuggestion).wordEnd)}
                                        </>
                                    )}
                                </div>

                                {/* Actual textarea */}
                                <textarea
                                    ref={textareaRef}
                                    value={noteText}
                                    onChange={handleTextChange}
                                    onKeyDown={handleKeyDown}
                                    placeholder="e.g., Met with Niranjan on Friday — helped me debug the frontend issue."
                                    className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 relative z-20 bg-transparent font-mono text-sm leading-6"
                                    style={{ color: 'black' }}
                                />
                            </div>

                            {/* Help Text */}
                            <div className="space-y-2">
                                {(currentSuggestion || currentDaySuggestion) && (
                                    <p className="text-sm text-blue-600">
                                        Press <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Tab</kbd> to tag {(currentSuggestion || currentDaySuggestion).name}
                                        {currentDaySuggestion && <span className="text-gray-500"> (day of week)</span>}
                                    </p>
                                )}
                                <p className="text-sm text-gray-500">
                                    Type names and days of the week (3+ letters) to see suggestions. Press Tab to tag them.
                                </p>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex gap-3 p-4 border-t bg-gray-50 rounded-b-lg">
                            <button
                                onClick={() => {
                                    setIsOpen(false);
                                    setNoteText('');
                                    setTextParts([]);
                                    setCurrentSuggestion(null);
                                    setCurrentDaySuggestion(null);
                                    setSelectedDay(null);
                                }}
                                className="flex-1 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={!noteText.trim()}
                                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Save Note
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
} 
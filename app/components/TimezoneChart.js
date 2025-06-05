'use client'
import { useState, useEffect, useMemo } from 'react';

// Timezone data with UTC offsets
const TIMEZONE_OFFSETS = {
    'EST': -4,   // Eastern Daylight Time (EDT)
    'PST': -7,   // Pacific Daylight Time (PDT)  
    'CST': -5,   // Central Daylight Time (CDT)
    'MST': -6,   // Mountain Daylight Time (MDT)
    'AST': -3,   // Atlantic Daylight Time (ADT)
    'GMT': 0,    // Greenwich Mean Time
    'CET': 1,    // Central European Time
    'EET': 2,    // Eastern European Time
    'WET': 0,    // Western European Time
    'JST': 9,    // Japan Standard Time
    'KST': 9,    // Korea Standard Time
    'IST': 5.5,  // India Standard Time
    'HKT': 8,    // Hong Kong Time
    'SGT': 8,    // Singapore Time
    'ICT': 7,    // Indochina Time
    'PHT': 8,    // Philippines Time
    'WIB': 7,    // Western Indonesian Time
    'MYT': 8,    // Malaysia Time
    'GST': 4,    // Gulf Standard Time
    'AEST': 10,  // Australian Eastern Standard Time
    'AWST': 8,   // Australian Western Standard Time
    'ACST': 9.5, // Australian Central Standard Time
    'BRT': -3,   // Brasilia Time
    'ART': -3,   // Argentina Time
    'PET': -5,   // Peru Time
    'COT': -5,   // Colombia Time
    'CLT': -3,   // Chile Time
    'SAST': 2,   // South Africa Standard Time
    'WAT': 1,    // West Africa Time
    'EAT': 3,    // East Africa Time
    'TRT': 3,    // Turkey Time
    'MSK': 3     // Moscow Standard Time
};

export default function TimezoneChart({ people }) {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [hoverPosition, setHoverPosition] = useState(null);
    const [isHovering, setIsHovering] = useState(false);
    const userTimezone = 'CST'; // User's timezone - you can make this configurable

    // Update current time every minute
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000); // Update every minute

        return () => clearInterval(timer);
    }, []);

    // Group people by timezone and calculate offsets
    const { timezoneData, peopleWithoutTimezone } = useMemo(() => {
        const groups = {};
        const withoutTimezone = [];

        people.forEach(person => {
            if (person.workHours && TIMEZONE_OFFSETS.hasOwnProperty(person.workHours)) {
                const tz = person.workHours;
                if (!groups[tz]) {
                    groups[tz] = {
                        timezone: tz,
                        offset: TIMEZONE_OFFSETS[tz],
                        people: []
                    };
                }
                groups[tz].people.push(person);
            } else {
                withoutTimezone.push(person);
            }
        });

        // Convert to array and sort by offset relative to user timezone
        const userOffset = TIMEZONE_OFFSETS[userTimezone];
        const sortedTimezones = Object.values(groups)
            .map(group => ({
                ...group,
                relativeOffset: group.offset - userOffset
            }))
            .sort((a, b) => b.relativeOffset - a.relativeOffset); // Sort descending so positive offsets are at top

        return {
            timezoneData: sortedTimezones,
            peopleWithoutTimezone: withoutTimezone
        };
    }, [people, userTimezone]);

    // Calculate current time position (0-24 hours as percentage)
    const getCurrentTimePosition = () => {
        // Use the same timezone calculation method as getTimeInTimezone for consistency
        const userTime = getTimeInTimezone(userTimezone);
        const hours = userTime.getHours();
        const minutes = userTime.getMinutes();
        return ((hours + minutes / 60) / 24) * 100;
    };

    // Get time in specific timezone
    const getTimeInTimezone = (timezone) => {
        const now = new Date();
        const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
        const tzOffset = TIMEZONE_OFFSETS[timezone] * 3600000;
        const tzTime = new Date(utc + tzOffset);
        return tzTime;
    };

    // Get time in specific timezone for a given hour position
    const getTimeInTimezoneForHour = (timezone, hourPosition) => {
        // Get current date in user timezone
        const now = new Date();
        const userTime = getTimeInTimezone(userTimezone);

        // Create a date object for the hovered time in user timezone
        const hoveredDate = new Date(userTime);
        hoveredDate.setHours(Math.floor(hourPosition));
        hoveredDate.setMinutes((hourPosition % 1) * 60);
        hoveredDate.setSeconds(0);

        // Calculate the time difference between user timezone and target timezone
        const userOffset = TIMEZONE_OFFSETS[userTimezone];
        const targetOffset = TIMEZONE_OFFSETS[timezone];
        const offsetDiff = (targetOffset - userOffset) * 3600000; // Convert hours to milliseconds

        // Apply the offset to get the time in the target timezone
        const targetTime = new Date(hoveredDate.getTime() + offsetDiff);

        return targetTime;
    };

    // Handle mouse move over chart
    const handleMouseMove = (event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const percentage = (x / rect.width) * 100;
        const hourPosition = (percentage / 100) * 24;

        setHoverPosition({ percentage, hourPosition });
        setIsHovering(true);
    };

    // Handle mouse leave
    const handleMouseLeave = () => {
        setIsHovering(false);
        setHoverPosition(null);
    };

    // Format time for display
    const formatTime = (date) => {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    // Check if it's business hours (9 AM - 5 PM)
    const isBusinessHours = (date) => {
        const hour = date.getHours();
        return hour >= 9 && hour < 17;
    };

    // Generate hour labels (every 3 hours)
    const hourLabels = [];
    for (let hour = 0; hour < 24; hour += 3) {
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        const ampm = hour < 12 ? 'AM' : 'PM';
        if (hour === 0) hourLabels.push(`12 AM`);
        else if (hour === 12) hourLabels.push(`12 PM`);
        else hourLabels.push(`${displayHour} ${ampm}`);
    }

    const barHeight = 60;
    const chartHeight = Math.max((timezoneData.length * (barHeight + 8)) + 100, 200);
    const currentTimePos = getCurrentTimePosition();

    if (timezoneData.length === 0) {
        return (
            <div className="p-6">
                <h2 className="text-2xl font-bold mb-6">Team Timezone Overview</h2>
                <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
                    <div className="text-gray-400 mb-4">
                        <svg className="w-16 h-16 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Timezone Data Available</h3>
                    <p className="text-gray-600 mb-4">
                        Add location information to your contacts to see timezone comparisons.
                    </p>
                    {peopleWithoutTimezone.length > 0 && (
                        <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-sm text-gray-600 mb-2">
                                {peopleWithoutTimezone.length} people without timezone information:
                            </p>
                            <p className="text-xs text-gray-500">
                                {peopleWithoutTimezone.slice(0, 5).map(p => p.name).join(', ')}
                                {peopleWithoutTimezone.length > 5 && ` +${peopleWithoutTimezone.length - 5} more`}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">Team Timezone Overview</h2>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
                {/* Time labels */}
                <div className="relative mb-4 h-8">
                    <div className="flex justify-between text-xs text-gray-500 absolute w-full">
                        {hourLabels.map((label, index) => (
                            <div key={index} className="flex flex-col items-center">
                                <div className="text-gray-400 text-xs mb-1">{label}</div>
                                <div className="w-px h-2 bg-gray-300"></div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Chart container */}
                <div
                    className="relative cursor-crosshair"
                    style={{ height: `${chartHeight}px` }}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                >
                    {/* Current time line */}
                    <div
                        className="absolute top-0 bottom-0 w-1 bg-red-600 z-10 shadow-lg"
                        style={{ left: `${currentTimePos}%` }}
                    >
                        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-red-600 text-white text-xs px-3 py-1 rounded-md whitespace-nowrap font-bold shadow-lg">
                            {formatTime(currentTime)} (Your Time)
                        </div>
                    </div>

                    {/* Hover preview line */}
                    {isHovering && hoverPosition && (
                        <div
                            className="absolute top-0 bottom-0 w-0.5 bg-blue-500 z-20 opacity-75"
                            style={{ left: `${hoverPosition.percentage}%` }}
                        >
                            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap font-bold">
                                {Math.floor(hoverPosition.hourPosition)}:{String(Math.floor((hoverPosition.hourPosition % 1) * 60)).padStart(2, '0')}
                            </div>
                        </div>
                    )}

                    {/* Timezone bars */}
                    {timezoneData.map((tzGroup, index) => {
                        const yPosition = index * (barHeight + 8);
                        const isUserTimezone = tzGroup.timezone === userTimezone;
                        const currentTzTime = getTimeInTimezone(tzGroup.timezone);
                        const tzTimePos = ((currentTzTime.getHours() + currentTzTime.getMinutes() / 60) / 24) * 100;
                        const isWorkingHours = isBusinessHours(currentTzTime);

                        // Calculate hover time for this timezone
                        const hoverTime = isHovering && hoverPosition
                            ? getTimeInTimezoneForHour(tzGroup.timezone, hoverPosition.hourPosition)
                            : null;
                        const isHoverWorkingHours = hoverTime ? isBusinessHours(hoverTime) : false;

                        // Calculate working hours position for this timezone
                        // Working hours are 9am-5pm in the timezone's local time
                        // We need to position this relative to the user's timeline
                        const timezoneOffset = tzGroup.relativeOffset; // Hours difference from user timezone

                        // Convert timezone's 9am to position on user's timeline
                        let workingHoursStart = 9 - timezoneOffset; // 9am in this timezone, shown on user timeline
                        let workingHoursEnd = 17 - timezoneOffset; // 5pm in this timezone, shown on user timeline

                        // Handle day wraparound
                        if (workingHoursStart < 0) workingHoursStart += 24;
                        if (workingHoursEnd < 0) workingHoursEnd += 24;
                        if (workingHoursStart >= 24) workingHoursStart -= 24;
                        if (workingHoursEnd >= 24) workingHoursEnd -= 24;

                        const workingHoursStartPos = (workingHoursStart / 24) * 100;
                        const workingHoursEndPos = (workingHoursEnd / 24) * 100;

                        // Buffer hours (8-9am and 5-6pm in timezone's local time)
                        let bufferStart = 8 - timezoneOffset;
                        let bufferEnd = 18 - timezoneOffset;

                        if (bufferStart < 0) bufferStart += 24;
                        if (bufferEnd < 0) bufferEnd += 24;
                        if (bufferStart >= 24) bufferStart -= 24;
                        if (bufferEnd >= 24) bufferEnd -= 24;

                        const bufferStartPos = (bufferStart / 24) * 100;
                        const bufferEndPos = (bufferEnd / 24) * 100;

                        return (
                            <div key={tzGroup.timezone} className="absolute w-full" style={{ top: `${yPosition}px` }}>
                                {/* Timezone bar */}
                                <div
                                    className={`relative rounded-lg border-3 flex items-center transition-all duration-300 shadow-md overflow-hidden ${isUserTimezone
                                        ? 'bg-blue-50 border-blue-600 shadow-blue-200'
                                        : 'bg-gray-100 border-gray-400 hover:bg-gray-50 hover:border-gray-500'
                                        }`}
                                    style={{ height: `${barHeight}px` }}
                                >
                                    {/* Base background - neutral gray */}
                                    <div className="absolute inset-0 bg-gray-200"></div>

                                    {/* Working hours gradients positioned for this timezone */}
                                    {workingHoursEnd > workingHoursStart ? (
                                        // Normal case - working hours don't cross midnight
                                        <>
                                            {/* Pre-work buffer gradient (8-9am) */}
                                            <div
                                                className="absolute top-0 bottom-0"
                                                style={{
                                                    left: `${bufferStartPos}%`,
                                                    width: `${((workingHoursStart - bufferStart + 24) % 24) / 24 * 100}%`,
                                                    background: 'linear-gradient(90deg, rgba(156, 163, 175, 0.8) 0%, rgba(34, 197, 94, 0.4) 100%)'
                                                }}
                                            />

                                            {/* Core working hours (9am-5pm) */}
                                            <div
                                                className="absolute top-0 bottom-0 bg-emerald-400"
                                                style={{
                                                    left: `${workingHoursStartPos}%`,
                                                    width: `${((workingHoursEnd - workingHoursStart + 24) % 24) / 24 * 100}%`,
                                                    opacity: isUserTimezone ? '0.7' : '0.5'
                                                }}
                                            />

                                            {/* Post-work buffer gradient (5-6pm) */}
                                            <div
                                                className="absolute top-0 bottom-0"
                                                style={{
                                                    left: `${workingHoursEndPos}%`,
                                                    width: `${((bufferEnd - workingHoursEnd + 24) % 24) / 24 * 100}%`,
                                                    background: 'linear-gradient(90deg, rgba(34, 197, 94, 0.4) 0%, rgba(156, 163, 175, 0.8) 100%)'
                                                }}
                                            />
                                        </>
                                    ) : (
                                        // Working hours cross midnight - split into two parts
                                        <>
                                            {/* Working hours part 1 (from start to midnight) */}
                                            <div
                                                className="absolute top-0 bottom-0 bg-emerald-400"
                                                style={{
                                                    left: `${workingHoursStartPos}%`,
                                                    width: `${100 - workingHoursStartPos}%`,
                                                    opacity: isUserTimezone ? '0.7' : '0.5'
                                                }}
                                            />

                                            {/* Working hours part 2 (from midnight to end) */}
                                            <div
                                                className="absolute top-0 bottom-0 bg-emerald-400"
                                                style={{
                                                    left: '0%',
                                                    width: `${workingHoursEndPos}%`,
                                                    opacity: isUserTimezone ? '0.7' : '0.5'
                                                }}
                                            />
                                        </>
                                    )}

                                    {/* Current time indicator for this timezone - Much higher contrast */}
                                    <div
                                        className={`absolute top-0 bottom-0 w-2 rounded-full z-20 shadow-lg ${isWorkingHours
                                            ? 'bg-emerald-700 border-2 border-emerald-900'
                                            : 'bg-amber-600 border-2 border-amber-800'
                                            }`}
                                        style={{ left: `${tzTimePos}%` }}
                                    />

                                    {/* Hover time indicator */}
                                    {isHovering && hoverPosition && (
                                        <div
                                            className={`absolute top-2 bottom-2 w-1 rounded-full z-15 ${isHoverWorkingHours
                                                ? 'bg-emerald-500 border border-emerald-700'
                                                : 'bg-amber-400 border border-amber-600'
                                                }`}
                                            style={{ left: `${hoverPosition.percentage}%` }}
                                        />
                                    )}

                                    {/* Timezone info */}
                                    <div className="relative z-30 px-4 flex justify-between items-center w-full">
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <span className={`font-black text-xl ${isUserTimezone ? 'text-blue-800' : 'text-gray-800'
                                                    }`}>
                                                    {tzGroup.timezone}
                                                    {isUserTimezone && <span className="text-sm ml-2 font-bold">(You)</span>}
                                                </span>
                                                <span className={`text-sm font-bold ${isUserTimezone ? 'text-blue-600' : 'text-gray-600'
                                                    }`}>
                                                    {tzGroup.relativeOffset > 0 ? '+' : ''}{tzGroup.relativeOffset}h
                                                </span>
                                                {isWorkingHours && (
                                                    <span className="text-xs bg-emerald-600 text-white px-3 py-1 rounded-full font-bold shadow-md">
                                                        Working
                                                    </span>
                                                )}
                                            </div>
                                            <div className={`text-sm font-bold ${isUserTimezone ? 'text-blue-700' : 'text-gray-700'
                                                }`}>
                                                {formatTime(currentTzTime)}
                                                {/* Show hover time */}
                                                {isHovering && hoverTime && (
                                                    <span className="ml-2 text-blue-600">
                                                        → {formatTime(hoverTime)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <div className={`text-sm font-bold ${isUserTimezone ? 'text-blue-800' : 'text-gray-800'
                                                }`}>
                                                {tzGroup.people.length} {tzGroup.people.length === 1 ? 'person' : 'people'}
                                            </div>
                                            <div className={`text-xs font-medium ${isUserTimezone ? 'text-blue-600' : 'text-gray-600'
                                                }`}>
                                                {tzGroup.people.slice(0, 3).map(p => p.name).join(', ')}
                                                {tzGroup.people.length > 3 && ` +${tzGroup.people.length - 3} more`}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Legend - Higher contrast */}
                <div className="mt-8 flex flex-wrap gap-6 text-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-red-600 rounded border border-red-800"></div>
                        <span className="font-semibold text-gray-800">Current time in your timezone</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-blue-500 rounded border border-blue-700"></div>
                        <span className="font-semibold text-gray-800">Hover preview time</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-emerald-700 rounded border border-emerald-900"></div>
                        <span className="font-semibold text-gray-800">Working hours</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-amber-600 rounded border border-amber-800"></div>
                        <span className="font-semibold text-gray-800">Off hours</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div
                            className="w-4 h-4 rounded border border-emerald-600"
                            style={{ background: 'linear-gradient(90deg, rgba(156, 163, 175, 0.8) 0%, rgba(34, 197, 94, 0.6) 100%)' }}
                        ></div>
                        <span className="font-semibold text-gray-800">Buffer hours (8-9 AM, 5-6 PM per timezone)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-emerald-400 rounded border border-emerald-600"></div>
                        <span className="font-semibold text-gray-800">Core working hours (9 AM - 5 PM per timezone)</span>
                    </div>
                </div>

                {/* Summary stats */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div className="bg-blue-50 border-2 border-blue-200 p-4 rounded-lg">
                        <div className="text-2xl font-black text-blue-700">{timezoneData.length}</div>
                        <div className="text-sm font-bold text-blue-600">Timezones</div>
                    </div>
                    <div className="bg-emerald-50 border-2 border-emerald-200 p-4 rounded-lg">
                        <div className="text-2xl font-black text-emerald-700">
                            {timezoneData.reduce((sum, tz) => sum + tz.people.length, 0)}
                        </div>
                        <div className="text-sm font-bold text-emerald-600">Total People</div>
                    </div>
                    <div className="bg-purple-50 border-2 border-purple-200 p-4 rounded-lg">
                        <div className="text-2xl font-black text-purple-700">
                            {timezoneData.filter(tz => isBusinessHours(getTimeInTimezone(tz.timezone))).length}
                        </div>
                        <div className="text-sm font-bold text-purple-600">Currently Working</div>
                    </div>
                </div>

                {/* People without timezone info */}
                {peopleWithoutTimezone.length > 0 && (
                    <div className="mt-6 bg-amber-50 border-2 border-amber-300 rounded-lg p-4">
                        <h4 className="font-bold text-amber-800 mb-2">
                            {peopleWithoutTimezone.length} people without timezone information
                        </h4>
                        <p className="text-sm font-medium text-amber-700">
                            {peopleWithoutTimezone.slice(0, 5).map(p => p.name).join(', ')}
                            {peopleWithoutTimezone.length > 5 && ` +${peopleWithoutTimezone.length - 5} more`}
                        </p>
                        <p className="text-xs font-medium text-amber-600 mt-1">
                            Add location information to include them in the timezone chart.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
} 
import { useState, useEffect, useRef } from 'react';
import cityService from '../../lib/city-service';
import useTerminalLogStore from '../../stores/terminalLogStore';

export default function TerminalLogViewer({ isVisible, onToggle }) {
    const [isMinimized, setIsMinimized] = useState(false);
    const [isMaximized, setIsMaximized] = useState(false);
    const logContainerRef = useRef(null);

    // Use Zustand store for logs
    const { logs, clearLogs, initializeLogs } = useTerminalLogStore();

    // Initialize logs when component mounts (only if no logs exist)
    useEffect(() => {
        initializeLogs();
    }, [initializeLogs]);

    // Auto-scroll to bottom when new logs appear
    useEffect(() => {
        if (logContainerRef.current && !isMinimized && isVisible) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [logs, isMinimized, isVisible]);

    const formatLogEntry = (log) => {
        switch (log.type) {
            case 'request':
                return (
                    <div className="space-y-1">
                        <div className="text-cyan-400">
                            → {log.method} {log.url}
                        </div>
                        <div className="text-gray-400 text-xs ml-4">
                            Headers: {JSON.stringify(log.headers)}
                        </div>
                    </div>
                );

            case 'response':
                return (
                    <div className="space-y-1">
                        <div className="text-green-400">
                            ← HTTP {log.status} {log.error ? 'ERROR' : 'OK'}
                        </div>
                        {log.error ? (
                            <div className="text-red-300 text-xs ml-4">
                                Error: {log.error}
                            </div>
                        ) : (
                            <div className="text-gray-300 text-xs ml-4">
                                Results: {log.totalResults} cities
                                {log.data && (
                                    <div className="mt-1">
                                        {JSON.stringify(log.data, null, 2)}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );

            case 'cache':
                if (log.action === 'POPULAR_CITY_HIT') {
                    return (
                        <div className="text-yellow-400">
                            ⚡ {log.action} query="{log.query}" results={log.results} (instant) 💾 API call saved!
                        </div>
                    );
                }
                return (
                    <div className="text-yellow-400">
                        💾 {log.action} key="{log.key?.substring(0, 20)}..." source={log.source} query="{log.query}" (API call saved!)
                    </div>
                );

            case 'fallback':
                let reason = log.reason;
                let details = '';

                switch (log.reason) {
                    case 'QUERY_TOO_SHORT':
                        details = `min ${log.minLength} chars`;
                        break;
                    case 'REQUEST_THROTTLED':
                        details = `${log.timeSinceLastRequest}ms < ${log.minInterval}ms`;
                        break;
                    case 'RATE_LIMIT_EXCEEDED':
                        details = 'daily limit reached';
                        break;
                    default:
                        details = `${log.fallback_count} results`;
                }

                return (
                    <div className="text-orange-400">
                        ⚠️  {reason} query="{log.query}" {details}
                    </div>
                );

            case 'error':
                return (
                    <div className="text-red-400">
                        ❌ {log.message}
                    </div>
                );

            case 'system':
                return (
                    <div className="text-blue-400">
                        ℹ️  {log.message}
                    </div>
                );

            default:
                return <div className="text-gray-400">{JSON.stringify(log)}</div>;
        }
    };

    if (!isVisible) return null;

    // Window size classes
    const sizeClass = isMaximized
        ? 'fixed inset-4 z-50'
        : isMinimized
            ? 'mt-3 h-8'
            : 'mt-3 h-48';

    return (
        <div className={`overflow-y-hidden h-min border border-gray-700 rounded-lg bg-gray-900 text-green-400 font-mono text-xs ${sizeClass}`}>
            {/* Terminal Header */}
            <div className="flex items-center justify-between bg-gray-800 px-3 py-2 rounded-t-lg border-b border-gray-700">
                <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                        <button
                            onClick={onToggle}
                            className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-600 transition-colors"
                            title="Close"
                        />
                        <button
                            onClick={() => setIsMinimized(!isMinimized)}
                            className="w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-600 transition-colors"
                            title={isMinimized ? "Restore" : "Minimize"}
                        />
                        <button
                            onClick={() => setIsMaximized(!isMaximized)}
                            className="w-3 h-3 rounded-full bg-green-500 hover:bg-green-600 transition-colors"
                            title={isMaximized ? "Restore" : "Maximize"}
                        />
                    </div>
                    <span className="text-gray-300 text-xs">city-api-logs</span>
                    <span className="text-gray-500 text-xs">({logs.length} logs)</span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => cityService.testLogging()}
                        className="text-gray-400 hover:text-gray-200 text-xs px-2 py-1 bg-gray-700 rounded"
                        title="Test logging system"
                    >
                        Test
                    </button>
                    <button
                        onClick={() => clearLogs()}
                        className="text-gray-400 hover:text-gray-200 text-xs"
                        title="Clear logs"
                    >
                        🗑️
                    </button>
                </div>
            </div>

            {/* Terminal Content - hidden when minimized */}
            {!isMinimized && (
                <div
                    ref={logContainerRef}
                    className={`p-3 overflow-y-auto space-y-2 ${isMaximized ? 'h-[calc(100vh-8rem)]' : 'h-44'}`}
                >
                    {logs.map((log) => (
                        <div key={log.id} className="flex">
                            <span className="text-gray-500 w-20 shrink-0">
                                {log.timestamp?.split(' ')[1] || '--:--:--'}
                            </span>
                            <div className="flex-1">
                                {formatLogEntry(log)}
                            </div>
                        </div>
                    ))}

                    {logs.length === 1 && logs[0]?.message?.includes('initialized') && (
                        <div className="text-gray-400 text-center py-4">
                            Try searching for a city to see API requests in real-time!
                        </div>
                    )}
                </div>
            )}
        </div>
    );
} 
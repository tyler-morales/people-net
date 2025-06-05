import { useState, useEffect, forwardRef } from 'react';
import cityService from '../../lib/city-service';
import useTerminalLogStore from '../../stores/terminalLogStore';
import TerminalLogViewer from './TerminalLogViewer';

const ApiUsageMonitor = forwardRef(({ className = '', forceVisible = false }, ref) => {
    const [stats, setStats] = useState(null);
    const [isVisible, setIsVisible] = useState(false);
    const [showLogs, setShowLogs] = useState(false);
    const [showCachedCities, setShowCachedCities] = useState(false);
    const [cachedCities, setCachedCities] = useState([]);

    // Terminal window states for cached cities
    const [citiesMinimized, setCitiesMinimized] = useState(false);
    const [citiesMaximized, setCitiesMaximized] = useState(false);

    // Get saved calls from Zustand store
    const savedApiCalls = useTerminalLogStore((state) => state.savedApiCalls);

    const updateStats = () => {
        setStats(cityService.getUsageStats());
        if (showCachedCities) {
            setCachedCities(cityService.getCachedCities());
        }
    };

    useEffect(() => {
        updateStats();
        const interval = setInterval(updateStats, 1000);
        return () => clearInterval(interval);
    }, [showCachedCities]);

    // Load cached cities when section is opened
    useEffect(() => {
        if (showCachedCities) {
            setCachedCities(cityService.getCachedCities());
        }
    }, [showCachedCities]);

    // Handle force visibility from keyboard shortcut
    useEffect(() => {
        if (forceVisible) {
            setIsVisible(true);
        } else {
            // When force-hidden via keyboard, also close the panel
            setIsVisible(false);
            setShowLogs(false);
            setShowCachedCities(false);
        }
    }, [forceVisible]);

    if (!stats) return null;

    const usagePercentage = (stats.apiCallsUsed / 100) * 100;
    const isNearLimit = usagePercentage > 80;
    const isAtLimit = usagePercentage >= 100;
    const totalSearches = stats.apiCallsUsed + savedApiCalls;
    const efficiencyPercentage = totalSearches > 0 ? Math.round((savedApiCalls / totalSearches) * 100) : 0;

    // Calculate energy savings (rough estimate: ~0.0045 Wh per API call)
    const energySavedWh = savedApiCalls * 0.0045;
    const ledBulbSeconds = Math.round(energySavedWh * 4000); // 4000 seconds per Wh for LED bulb

    // Fun energy equivalencies
    const getEnergyEquivalent = (wh, savedCalls) => {
        if (savedCalls === 0) return "No energy saved yet";
        if (wh < 0.01) return `~${Math.round(wh * 1000)} mWh — like a quick WiFi ping`;
        if (wh < 0.1) return `~${wh.toFixed(3)} Wh — equivalent to running an LED bulb for ~${ledBulbSeconds} seconds`;
        if (wh < 1) return `~${wh.toFixed(2)} Wh — equivalent to ~${Math.round(wh * 60)} minutes of LED lighting`;
        return `~${wh.toFixed(2)} Wh — equivalent to ~${Math.round(wh / 5)} hours of smartphone use`;
    };

    // Show the monitor if either manually opened OR force-opened via keyboard
    const shouldShowPanel = isVisible || forceVisible;

    return (
        <div ref={ref} className={`fixed bottom-4 right-4 z-50 ${className}`}>
            {/* Toggle Button - only show when force-opened via keyboard shortcut */}
            {forceVisible && (
                <button
                    onClick={() => setIsVisible(!isVisible)}
                    className="mb-2 px-3 py-2 rounded-lg text-sm font-medium shadow-lg transition-all bg-orange-500 text-white ring-2 ring-orange-300 animate-pulse"
                    title="API Usage Monitor (Developer Mode)"
                >
                    🌐 {stats.apiCallsUsed}/100 🔓
                </button>
            )}

            {/* Detailed Stats Panel */}
            {shouldShowPanel && (
                <div className="bg-white border border-gray-200 rounded-lg shadow-xl p-4 w-80">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-gray-800">
                            City API Usage
                            <span className="text-orange-500 text-sm ml-2">🔓 Dev Mode</span>
                        </h3>
                        <button
                            onClick={() => setIsVisible(false)}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            ×
                        </button>
                    </div>

                    {/* Usage Progress Bar */}
                    <div className="mb-4">
                        <div className="flex justify-between text-sm mb-1">
                            <span>API Calls Used</span>
                            <span className={isNearLimit ? 'text-orange-600 font-medium' : ''}>
                                {stats.apiCallsUsed}/100
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className={`h-2 rounded-full transition-all ${isAtLimit
                                    ? 'bg-red-500'
                                    : isNearLimit
                                        ? 'bg-orange-500'
                                        : 'bg-blue-500'
                                    }`}
                                style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                            />
                        </div>
                    </div>

                    {/* Cache Statistics */}
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span
                                className="text-gray-600 cursor-help border-b border-dotted border-gray-400"
                                title="Temporary cache stored in memory. Lasts 1 hour or until page refresh. Fast access for recently searched cities."
                            >
                                Memory Cache:
                            </span>
                            <span className="font-medium">{stats.memoryCacheSize} entries</span>
                        </div>
                        <div className="flex justify-between">
                            <span
                                className="text-gray-600 cursor-help border-b border-dotted border-gray-400"
                                title="Long-term cache stored in browser localStorage. Lasts 24 hours across browser sessions. Survives page refreshes and browser restarts."
                            >
                                Persistent Cache:
                            </span>
                            <span className="font-medium">{stats.persistentCacheSize} entries</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-green-600">💾 Saved API Calls:</span>
                            <span className="font-medium text-green-600">{savedApiCalls}</span>
                        </div>
                        {totalSearches > 0 && (
                            <div className="flex justify-between">
                                <span className="text-blue-600">🎯 Cache Efficiency:</span>
                                <span className="font-medium text-blue-600">{efficiencyPercentage}%</span>
                            </div>
                        )}
                        {stats.lastRequestTime !== 'Invalid Date' && (
                            <div className="flex justify-between">
                                <span className="text-gray-600">Last API Call:</span>
                                <span className="font-medium text-xs">
                                    {stats.lastRequestTime}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Status Messages */}
                    {isAtLimit && (
                        <div className="mt-3 p-2 rounded text-red-700 text-sm">
                            <div className="flex items-start gap-2">
                                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mt-1" style={{ animationDuration: '2s' }} />
                                <div>
                                    <strong>API Limit Reached!</strong><br />
                                    Using cached and static data only. Limit persists across sessions.
                                </div>
                            </div>
                        </div>
                    )}

                    {isNearLimit && !isAtLimit && (
                        <div className="mt-3 p-2 rounded text-orange-700 text-sm">
                            <div className="flex items-start gap-2">
                                <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse mt-1" style={{ animationDuration: '2s' }} />
                                <div>
                                    <strong>Near API Limit</strong><br />
                                    {100 - stats.apiCallsUsed} calls remaining. Limit is persistent.
                                </div>
                            </div>
                        </div>
                    )}

                    {!isNearLimit && (
                        <div className="mt-3 p-2 rounded text-green-700 text-sm">
                            <div className="flex items-start gap-2">
                                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse mt-1" style={{ animationDuration: '2s' }} />
                                <div>
                                    <strong>API Usage Normal</strong><br />
                                    {stats.apiCallsRemaining} calls remaining. Limit persists across sessions.
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Developer Easter Egg - Terminal Log Viewer */}
                    {!isNearLimit && (
                        <div className="mt-3 space-y-2">
                            <button
                                onClick={() => setShowLogs(!showLogs)}
                                className="text-xs text-gray-500 hover:text-gray-700 underline block"
                            >
                                {showLogs ? '🔒 Hide API Logs' : '👨‍💻 View API Logs'}
                            </button>
                            <button
                                onClick={() => setShowCachedCities(!showCachedCities)}
                                className="text-xs text-gray-500 hover:text-gray-700 underline block"
                            >
                                {showCachedCities ? '🔒 Hide Cached Cities' : '📋 View Cached Cities'}
                            </button>
                        </div>
                    )}

                    {/* Cached Cities List */}
                    {showCachedCities && (
                        <div className={`mt-3 overflow-y-hidden h-min border border-gray-700 rounded-lg bg-gray-900 text-green-400 font-mono text-xs ${citiesMaximized
                            ? 'fixed inset-4 z-50'
                            : citiesMinimized
                                ? 'h-8'
                                : 'h-48'
                            }`}>
                            {/* Terminal Header */}
                            <div className="flex items-center justify-between bg-gray-800 px-3 py-2 rounded-t-lg border-b border-gray-700">
                                <div className="flex items-center gap-2">
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => setShowCachedCities(false)}
                                            className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-600 transition-colors"
                                            title="Close"
                                        />
                                        <button
                                            onClick={() => setCitiesMinimized(!citiesMinimized)}
                                            className="w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-600 transition-colors"
                                            title={citiesMinimized ? "Restore" : "Minimize"}
                                        />
                                        <button
                                            onClick={() => setCitiesMaximized(!citiesMaximized)}
                                            className="w-3 h-3 rounded-full bg-green-500 hover:bg-green-600 transition-colors"
                                            title={citiesMaximized ? "Restore" : "Maximize"}
                                        />
                                    </div>
                                    <span className="text-gray-300 text-xs">cached-cities</span>
                                    <span className="text-gray-500 text-xs">({cachedCities.length} entries)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setCachedCities(cityService.getCachedCities())}
                                        className="text-gray-400 hover:text-gray-200 text-xs px-2 py-1 bg-gray-700 rounded"
                                        title="Refresh cache list"
                                    >
                                        🔄
                                    </button>
                                </div>
                            </div>

                            {/* Terminal Content - hidden when minimized */}
                            {!citiesMinimized && (
                                <div className={`p-3 overflow-y-auto space-y-2 ${citiesMaximized ? 'h-[calc(100vh-8rem)]' : 'h-44'}`}>
                                    {cachedCities.length === 0 ? (
                                        <div className="text-gray-400 text-center py-4">
                                            <div>$ echo "No cached cities yet"</div>
                                            <div className="text-gray-500 mt-2">Try searching for a city to populate cache...</div>
                                        </div>
                                    ) : (
                                        cachedCities.map((entry) => (
                                            <div key={entry.id} className="border-l-2 border-green-600 pl-3 py-1">
                                                <div className="flex">
                                                    <span className="text-gray-500 w-20 shrink-0">
                                                        {entry.timestamp.split(' ')[1]?.substring(0, 8) || '--:--:--'}
                                                    </span>
                                                    <div className="flex-1">
                                                        <div className="text-cyan-400">
                                                            $ cache-lookup "{entry.query}"
                                                        </div>
                                                        <div className="text-green-400 ml-2">
                                                            → source:
                                                            <span className={`ml-1 ${entry.source === 'memory'
                                                                ? 'text-blue-400'
                                                                : entry.source === 'popular'
                                                                    ? 'text-purple-400'
                                                                    : entry.source === 'api'
                                                                        ? 'text-green-400'
                                                                        : 'text-gray-400'
                                                                }`}>
                                                                {entry.source}
                                                            </span>
                                                        </div>
                                                        <div className="text-green-400 ml-2">
                                                            → results: {entry.totalResults} cities
                                                        </div>
                                                        <div className="text-gray-300 ml-2 mt-1">
                                                            {entry.cities}
                                                            {entry.totalResults > 3 && (
                                                                <span className="text-gray-500"> +{entry.totalResults - 3} more</span>
                                                            )}
                                                        </div>
                                                        <div className="text-gray-500 ml-2 text-xs mt-1">
                                                            cached: {entry.timestamp.split(' ')[0]}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Terminal Log Viewer */}
                    <TerminalLogViewer
                        isVisible={showLogs}
                        onToggle={() => setShowLogs(false)}
                    />

                    {/* Environmental Impact Section */}
                    {savedApiCalls > 0 && (
                        <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded text-green-700 text-xs">
                            <strong>🌱 Environmental Impact:</strong>
                            <ul className="mt-1 space-y-1">
                                <li>• Estimated energy saved: <strong>~{getEnergyEquivalent(energySavedWh, savedApiCalls).split('Wh')[0]}Wh</strong></li>
                                <li>• Equivalent to running an LED for <strong>~{getEnergyEquivalent(energySavedWh, savedApiCalls).split('seconds')[0].split('for ~')[1]} seconds</strong></li>
                            </ul>
                        </div>
                    )}

                    {/* Optimization Tips */}
                    <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-blue-700 text-xs">
                        <strong>💡 Optimization Results:</strong>
                        <ul className="mt-1 space-y-1">
                            <li>• <strong>{savedApiCalls} API calls saved</strong> through caching (persistent)!</li>
                            <li>• {efficiencyPercentage}% of searches use cached data</li>
                            <li>• Popular cities load instantly (no API calls)</li>
                            <li>• Results cached for 24 hours in localStorage</li>
                            <li>• 800ms typing delay reduces API calls</li>
                            <li>• Fallback to 50+ static cities when needed</li>
                            <li>• <strong>All counters persist across browser sessions</strong></li>
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
});

export default ApiUsageMonitor; 
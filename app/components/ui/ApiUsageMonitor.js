import { useState, useEffect } from 'react';
import cityService from '../../lib/city-service';

export default function ApiUsageMonitor({ className = '' }) {
    const [stats, setStats] = useState(null);
    const [isVisible, setIsVisible] = useState(false);

    const updateStats = () => {
        setStats(cityService.getUsageStats());
    };

    useEffect(() => {
        updateStats();
        const interval = setInterval(updateStats, 1000);
        return () => clearInterval(interval);
    }, []);

    if (!stats) return null;

    const usagePercentage = (stats.apiCallsUsed / 100) * 100;
    const isNearLimit = usagePercentage > 80;
    const isAtLimit = usagePercentage >= 100;

    return (
        <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
            {/* Toggle Button */}
            <button
                onClick={() => setIsVisible(!isVisible)}
                className={`mb-2 px-3 py-2 rounded-lg text-sm font-medium shadow-lg transition-all ${isAtLimit
                    ? 'bg-red-500 text-white animate-pulse'
                    : isNearLimit
                        ? 'bg-orange-500 text-white'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                title="API Usage Monitor"
            >
                🌐 {stats.apiCallsUsed}/100
            </button>

            {/* Detailed Stats Panel */}
            {isVisible && (
                <div className="bg-white border border-gray-200 rounded-lg shadow-xl p-4 w-80">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-gray-800">City API Usage</h3>
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
                            <span className="text-gray-600">Memory Cache:</span>
                            <span className="font-medium">{stats.memoryCacheSize} entries</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Persistent Cache:</span>
                            <span className="font-medium">{stats.persistentCacheSize} entries</span>
                        </div>
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
                        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                            <strong>API Limit Reached!</strong><br />
                            Using cached and static data only.
                        </div>
                    )}

                    {isNearLimit && !isAtLimit && (
                        <div className="mt-3 p-2 bg-orange-50 border border-orange-200 rounded text-orange-700 text-sm">
                            <strong>Near API Limit</strong><br />
                            {100 - stats.apiCallsUsed} calls remaining.
                        </div>
                    )}

                    {!isNearLimit && (
                        <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded text-green-700 text-sm">
                            <strong>API Usage Optimal</strong><br />
                            {stats.apiCallsRemaining} calls remaining.
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="mt-4 flex gap-2">
                        <button
                            onClick={() => {
                                cityService.clearCache();
                                updateStats();
                            }}
                            className="flex-1 px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded border"
                        >
                            Clear Cache
                        </button>
                        <button
                            onClick={() => {
                                cityService.resetApiCounter();
                                updateStats();
                            }}
                            className="flex-1 px-3 py-1 text-xs bg-blue-100 hover:bg-blue-200 rounded border"
                        >
                            Reset Counter
                        </button>
                    </div>

                    {/* Optimization Tips */}
                    <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-blue-700 text-xs">
                        <strong>💡 Optimization Tips:</strong>
                        <ul className="mt-1 space-y-1">
                            <li>• Popular cities load instantly (no API calls)</li>
                            <li>• Results cached for 24 hours in localStorage</li>
                            <li>• 800ms typing delay reduces API calls</li>
                            <li>• Fallback to 50+ static cities when needed</li>
                            <li>• Free tier: no limit parameters used</li>
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
} 
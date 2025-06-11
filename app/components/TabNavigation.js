'use client'
import { LiquidNav, LiquidButton } from './ui/LiquidGlass';

export default function TabNavigation({ activeTab, setActiveTab, canUndo }) {
    const tabs = [
        { id: 'table', label: 'Table', icon: '🗒️' },
        { id: 'graph', label: 'Graph', icon: '🕸️' },
        { id: 'globe', label: 'Globe', icon: '🌍' },
        { id: 'timezone', label: 'Timezone', icon: '🕐' }
    ];

    return (
        <LiquidNav className="flex items-center gap-2 p-2 mb-6">
            {tabs.map((tab) => (
                <LiquidButton
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    variant={activeTab === tab.id ? 'primary' : 'secondary'}
                    size="small"
                    className={`
                        font-medium transition-all duration-300
                        ${activeTab === tab.id
                            ? 'text-white shadow-lg'
                            : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
                        }
                    `}
                >
                    <span className="flex items-center gap-2">
                        <span className="text-lg">{tab.icon}</span>
                        <span>{tab.label}</span>
                    </span>
                </LiquidButton>
            ))}

            {/* Undo indicator */}
            {canUndo && (
                <div className="ml-auto flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <div className="px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2">
                        <kbd className="px-2 py-1 text-xs font-semibold bg-white/20 dark:bg-black/20 border border-white/30 dark:border-white/10 rounded">
                            {typeof window !== 'undefined' && window.navigator.userAgent.toLowerCase().includes('mac') ? '⌘' : 'Ctrl'}+Z
                        </kbd>
                        <span>to undo</span>
                    </div>
                </div>
            )}
        </LiquidNav>
    );
} 
'use client'
import { useTheme } from '../../contexts/ThemeContext';
import { LiquidButton } from './LiquidGlass';

export default function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
        <LiquidButton
            onClick={toggleTheme}
            variant="secondary"
            size="small"
            className="p-3 transition-all duration-300 hover:scale-110"
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
            <div className="flex items-center justify-center">
                {theme === 'light' ? (
                    // Moon icon for dark mode
                    <div className="relative">
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="transform transition-transform duration-300 hover:rotate-12"
                        >
                            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                        </svg>
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-400 rounded-full animate-ping"></div>
                    </div>
                ) : (
                    // Sun icon for light mode
                    <div className="relative">
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="transform transition-transform duration-300 hover:rotate-90"
                        >
                            <circle cx="12" cy="12" r="5" />
                            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                        </svg>
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                    </div>
                )}
            </div>
        </LiquidButton>
    );
} 
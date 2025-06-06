import { strengthToNumber, numberToStrength, getStrengthLabel } from '../../lib/connection-utils';

export default function ConnectionStrengthSelector({
    value,
    onChange,
    onFocus,
    showToast,
    personName,
    variant = 'select' // 'select' or 'slider'
}) {
    if (variant === 'slider') {
        return (
            <div className="space-y-2">
                <input
                    type="range"
                    min="1"
                    max="6"
                    value={strengthToNumber(value)}
                    onChange={(e) => {
                        const strengthName = numberToStrength(parseInt(e.target.value));
                        onChange(strengthName);
                    }}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    style={{
                        background: `linear-gradient(to right, #6366f1 0%, #3b82f6 20%, #10b981 40%, #f59e0b 60%, #f97316 80%, #ef4444 100%)`
                    }}
                />
                <div className="text-center text-sm font-medium text-gray-700">
                    {getStrengthLabel(value)}
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                    <span>Fleeting</span>
                    <span>Acquaintance</span>
                    <span>Casual</span>
                    <span>Working</span>
                    <span>Strong</span>
                    <span>Core</span>
                </div>
            </div>
        );
    }

    return (
        <select
            value={value}
            onFocus={onFocus}
            onChange={(e) => {
                onChange(e.target.value);
                if (showToast && personName) {
                    showToast(`Updated connection strength for ${personName}`, 'success');
                }
            }}
            className="border p-1 w-full rounded bg-white"
        >
            <option value="fleeting">Fleeting (1)</option>
            <option value="acquaintance">Acquaintance (2)</option>
            <option value="casual">Casual (3)</option>
            <option value="working">Working (4)</option>
            <option value="strong">Strong (5)</option>
            <option value="core">Core (6)</option>
        </select>
    );
} 
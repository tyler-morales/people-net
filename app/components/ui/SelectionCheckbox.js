export default function SelectionCheckbox({
    checked,
    indeterminate = false,
    onChange,
    disabled = false,
    'aria-label': ariaLabel,
    className = ""
}) {
    return (
        <div className="flex items-center justify-center">
            <input
                type="checkbox"
                checked={checked}
                ref={(el) => {
                    if (el) el.indeterminate = indeterminate;
                }}
                onChange={onChange}
                disabled={disabled}
                aria-label={ariaLabel}
                className={`
                    w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded 
                    focus:ring-blue-500 focus:ring-2 cursor-pointer
                    disabled:cursor-not-allowed disabled:opacity-50
                    ${className}
                `}
            />
        </div>
    );
} 
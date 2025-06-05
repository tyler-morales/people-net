export default function ConnectionStrengthTooltip() {
    return (
        <>
            <button
                className="ml-2 cursor-pointer text-sm rounded-full bg-blue-400 text-white w-[20px] h-[20px]"
                popoverTarget="strength-tooltip"
                popoverTargetAction="toggle"
                title="Click for strength definitions"
                style={{ anchorName: '--strength-button' }}
            >
                <span className="inline-block" style={{ marginRight: '2px' }}>?</span>
            </button>

            <div
                id="strength-tooltip"
                popover="auto"
                className="bg-white border border-gray-300 rounded-lg shadow-lg p-4 w-96"
                style={{
                    positionAnchor: '--strength-button',
                    left: 'anchor(left)',
                    top: 'anchor(bottom)',
                    transform: 'translateX(-100%)',
                    marginTop: '8px'
                }}
            >
                <div className="mb-2 font-semibold">Relationship Strength Tiers</div>
                <div className="space-y-2 text-sm">
                    <div><strong>Fleeting (1):</strong> Brief interaction, no lasting impact</div>
                    <div><strong>Acquaintance (2):</strong> Light connection, you know <em>of</em> them</div>
                    <div><strong>Casual (3):</strong> Friendly or familiar, occasional conversations</div>
                    <div><strong>Working (4):</strong> Collaborated together on a project</div>
                    <div><strong>Strong (5):</strong> Meaningful shared history, solid trust</div>
                    <div><strong>Core (6):</strong> Foundational relationship, emotionally defining</div>
                </div>
            </div>
        </>
    );
} 
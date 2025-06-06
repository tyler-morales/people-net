'use client'
import { useState, useRef, useEffect } from 'react';
import { calculateGraphLayout, calculateGraphLinks, buildFullConnectionPath } from '../lib/graph-utils';
import { strengthToNumber, numberToStrength, getStrengthLabel } from '../lib/connection-utils';

export default function GraphView({ people }) {
    const svgRef = useRef(null);
    const [selectedNode, setSelectedNode] = useState(null);
    const [nodes, setNodes] = useState([]);
    const [links, setLinks] = useState([]);
    const [graphFilter, setGraphFilter] = useState('all');
    const [strengthFilter, setStrengthFilter] = useState(0);
    const [isExpanded, setIsExpanded] = useState(false);

    // Graph dimensions
    const width = 800;
    const height = 600;
    const expandedWidth = window.innerWidth;
    const expandedHeight = window.innerHeight;

    // Calculate graph layout and links
    useEffect(() => {
        const calculatedNodes = calculateGraphLayout(people, isExpanded ? expandedWidth : width, isExpanded ? expandedHeight : height);
        const calculatedLinks = calculateGraphLinks(people, graphFilter);

        setNodes(calculatedNodes);
        setLinks(calculatedLinks);
    }, [people, width, height, graphFilter, isExpanded, expandedWidth, expandedHeight]);

    // Handle escape key
    useEffect(() => {
        const handleEscape = (event) => {
            if (event.key === 'Escape' && isExpanded) {
                setIsExpanded(false);
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isExpanded]);

    // Calculate which nodes are part of the selected node's connection path
    const getPathNodeIds = () => {
        if (!selectedNode || selectedNode.id === 'you') {
            return new Set();
        }

        const fullPerson = people.find(p => p.id === selectedNode.id);
        if (!fullPerson) {
            return new Set(['you', selectedNode.id]);
        }

        const connectionPath = buildFullConnectionPath(fullPerson, people);
        const pathNodeIds = new Set(['you']); // Always include 'you'

        // Add all people in the connection path
        connectionPath.forEach(personName => {
            if (personName === 'You') {
                pathNodeIds.add('you');
            } else {
                // Find the person by name and add their ID
                const person = people.find(p => p.name === personName);
                if (person) {
                    pathNodeIds.add(person.id);
                }
            }
        });

        return pathNodeIds;
    };

    const pathNodeIds = getPathNodeIds();

    function handleNodeClick(node) {
        setSelectedNode(selectedNode?.id === node.id ? null : node);
    }

    return (
        <>
            {/* Regular View */}
            <div className="flex gap-6">
                {/* Graph - 70% width */}
                <div className="w-[70%]">
                    {/* Filter Controls */}
                    <div className="mb-4 flex items-center gap-6">
                        <div className="flex items-center gap-4">
                            <label className="text-sm font-medium text-gray-700">
                                Connection View:
                            </label>
                            <select
                                value={graphFilter}
                                onChange={(e) => setGraphFilter(e.target.value)}
                                className="border border-gray-300 rounded px-3 py-1 text-sm"
                            >
                                <option value="all">All Connections</option>
                                <option value="direct">Direct Only</option>
                                <option value="introduced">Through Others</option>
                                <option value="external">External Introductions</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-4 flex-1">
                            <label className="text-sm font-medium text-gray-700">
                                Filter by Strength:
                            </label>
                            <div className="flex-1 max-w-xs space-y-1">
                                <input
                                    type="range"
                                    min="0"
                                    max="6"
                                    value={strengthFilter}
                                    onChange={(e) => setStrengthFilter(parseInt(e.target.value))}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                    style={{
                                        background: `linear-gradient(to right, #6366f1 0%, #3b82f6 16.67%, #10b981 33.33%, #f59e0b 50%, #f97316 66.67%, #ef4444 83.33%, #dc2626 100%)`
                                    }}
                                />
                                <div className="text-center text-xs font-medium text-gray-600">
                                    {strengthFilter === 0 ? 'Showing All' : getStrengthLabel(numberToStrength(strengthFilter))}
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => setIsExpanded(true)}
                            className="px-3 py-2 text-sm rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                        >
                            🔍 Expand
                        </button>
                    </div>

                    <svg
                        ref={svgRef}
                        width="100%"
                        height={height}
                        className="border border-gray-300 rounded-lg bg-gray-50"
                    >
                        {/* Define line patterns for different connection types */}
                        <defs>
                            <pattern id="dashed" patternUnits="userSpaceOnUse" width="10" height="1">
                                <rect width="5" height="1" fill="#6b7280" />
                                <rect x="5" width="5" height="1" fill="transparent" />
                            </pattern>
                            <pattern id="dotted" patternUnits="userSpaceOnUse" width="6" height="1">
                                <rect width="2" height="1" fill="#6b7280" />
                                <rect x="2" width="4" height="1" fill="transparent" />
                            </pattern>
                        </defs>

                        {/* Links */}
                        {links.map((link, index) => {
                            const sourceNode = nodes.find(n => n.id === link.source);
                            const targetNode = nodes.find(n => n.id === link.target);

                            let stroke = "#6b7280";
                            let strokeDasharray = "none";
                            let opacity = 0.6;

                            // Apply strength filter opacity
                            if (strengthFilter > 0) {
                                const targetStrengthNum = strengthToNumber(targetNode?.strength);
                                opacity = targetStrengthNum === strengthFilter ? 0.8 : 0.1;
                            }

                            // Apply connection path highlighting for links
                            if (selectedNode && selectedNode.id !== 'you') {
                                const isSourceInPath = pathNodeIds.has(link.source);
                                const isTargetInPath = pathNodeIds.has(link.target);

                                if (isSourceInPath && isTargetInPath) {
                                    // Both nodes are in the path - highlight the link
                                    opacity = Math.max(opacity, 0.9);
                                    stroke = "#3b82f6"; // Blue color for path links
                                } else {
                                    // Link is not part of the connection path - reduce opacity
                                    opacity = Math.min(opacity, 0.1);
                                }
                            }

                            if (link.strokeStyle === 'dashed') {
                                strokeDasharray = "8,4";
                            } else if (link.strokeStyle === 'dotted') {
                                strokeDasharray = "2,3";
                            }

                            return (
                                <line
                                    key={index}
                                    x1={sourceNode.x}
                                    y1={sourceNode.y}
                                    x2={targetNode.x}
                                    y2={targetNode.y}
                                    stroke={stroke}
                                    strokeWidth={link.strokeWidth}
                                    strokeDasharray={strokeDasharray}
                                    opacity={opacity}
                                />
                            );
                        })}

                        {/* Nodes */}
                        {nodes.map((node) => {
                            let nodeOpacity = 1;

                            // Apply strength filter opacity to nodes (except "you")
                            if (strengthFilter > 0 && node.id !== 'you') {
                                const nodeStrengthNum = strengthToNumber(node.strength);
                                nodeOpacity = nodeStrengthNum === strengthFilter ? 1 : 0.2;
                            }

                            // Apply connection path highlighting
                            if (selectedNode && selectedNode.id !== 'you') {
                                if (pathNodeIds.has(node.id)) {
                                    // Node is part of the connection path - keep full opacity
                                    nodeOpacity = Math.max(nodeOpacity, 1);
                                } else {
                                    // Node is not part of the connection path - reduce opacity
                                    nodeOpacity = Math.min(nodeOpacity, 0.2);
                                }
                            }

                            return (
                                <g key={node.id} opacity={nodeOpacity}>
                                    <circle
                                        cx={node.x}
                                        cy={node.y}
                                        r={node.radius}
                                        fill={node.color}
                                        stroke={selectedNode?.id === node.id ? '#000' : '#fff'}
                                        strokeWidth={selectedNode?.id === node.id ? 3 : 2}
                                        className="cursor-pointer hover:opacity-80 transition-opacity"
                                        onClick={() => handleNodeClick(node)}
                                    />
                                    <text
                                        x={node.x}
                                        y={node.y + node.radius + 15}
                                        textAnchor="middle"
                                        className="text-sm font-medium fill-gray-700"
                                        style={{ pointerEvents: 'none' }}
                                    >
                                        {node.name}
                                    </text>
                                </g>
                            );
                        })}
                    </svg>
                </div>

                {/* Legend & Details - 30% width */}
                <div className="w-[30%] space-y-6">
                    {/* Connection Types Legend */}
                    <div className="bg-white p-4 rounded-lg border border-gray-300">
                        <h3 className="font-semibold mb-3">Connection Types</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-0.5 bg-gray-500"></div>
                                <span>Direct connection</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-0.5 border-t-2 border-dashed border-gray-500"></div>
                                <span>Introduced by network</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-0.5 border-t-2 border-dotted border-gray-500"></div>
                                <span>External introduction</span>
                            </div>
                        </div>
                    </div>

                    {/* Connection Strength Legend */}
                    <div className="bg-white p-4 rounded-lg border border-gray-300">
                        <h3 className="font-semibold mb-3">Connection Strength</h3>
                        <div className="space-y-2">
                            {[
                                { name: 'Fleeting', color: '#6366f1' },
                                { name: 'Acquaintance', color: '#3b82f6' },
                                { name: 'Casual', color: '#10b981' },
                                { name: 'Working', color: '#f59e0b' },
                                { name: 'Strong', color: '#f97316' },
                                { name: 'Core', color: '#ef4444' }
                            ].map((item) => (
                                <div key={item.name} className="flex items-center gap-2">
                                    <div
                                        className="w-4 h-4 rounded-full"
                                        style={{ backgroundColor: item.color }}
                                    ></div>
                                    <span className="text-sm">{item.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Selected Node Details */}
                    {selectedNode && selectedNode.id !== 'you' && (
                        <div className="bg-white p-4 rounded-lg border border-gray-300">
                            <h3 className="font-semibold mb-3">Selected Person</h3>
                            <div className="space-y-2 text-sm">
                                <div><strong>Name:</strong> {selectedNode.name}</div>
                                <div><strong>Company:</strong> {selectedNode.company}</div>
                                <div><strong>Role:</strong> {selectedNode.role}</div>
                                <div><strong>Connection:</strong> {selectedNode.strength}</div>
                                {selectedNode.connection?.introducedByType === 'existing' && selectedNode.connection?.introducedBy && (
                                    <div><strong>Introduced by:</strong> {people.find(p => p.id === selectedNode.connection.introducedBy)?.name || 'Unknown'}</div>
                                )}
                                {selectedNode.connection?.introducedByType === 'external' && selectedNode.connection?.introducedByName && (
                                    <div><strong>Introduced by:</strong> {selectedNode.connection.introducedByName}</div>
                                )}

                                {/* Connection Path */}
                                <div className="pt-2 border-t border-gray-200">
                                    <div className="font-medium text-gray-800 mb-1">Connection Path:</div>
                                    <div className="text-xs bg-blue-50 p-2 rounded border-l-2 border-blue-200">
                                        {(() => {
                                            // Find the full person object from the people array
                                            const fullPerson = people.find(p => p.id === selectedNode.id);
                                            if (!fullPerson) {
                                                return (
                                                    <div className="flex items-center gap-1">
                                                        <span className="font-medium text-blue-800">You</span>
                                                        <span className="text-blue-600">→</span>
                                                        <span className="font-medium text-blue-800">{selectedNode.name}</span>
                                                        <span className="text-gray-500 ml-2">(Direct connection)</span>
                                                    </div>
                                                );
                                            }

                                            // Build the full connection path
                                            const connectionPath = buildFullConnectionPath(fullPerson, people);

                                            // Determine connection type for label
                                            let connectionLabel = '(Direct connection)';
                                            if (fullPerson.connection?.introducedByType === 'existing') {
                                                connectionLabel = connectionPath.length > 2 ? '(Through network)' : '(Through network)';
                                            } else if (fullPerson.connection?.introducedByType === 'external') {
                                                connectionLabel = '(External intro)';
                                            }

                                            return (
                                                <div className="flex items-center gap-1 flex-wrap">
                                                    {connectionPath.map((person, index) => (
                                                        <div key={index} className="flex items-center gap-1">
                                                            <span className={`font-medium ${person === 'You' ? 'text-blue-800' :
                                                                fullPerson.connection?.introducedByType === 'external' && index === connectionPath.length - 2 ? 'text-orange-600' :
                                                                    'text-blue-800'
                                                                }`}>
                                                                {person}
                                                            </span>
                                                            {index < connectionPath.length - 1 && (
                                                                <span className="text-blue-600">→</span>
                                                            )}
                                                        </div>
                                                    ))}
                                                    <span className="text-gray-500 ml-2">{connectionLabel}</span>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Instructions */}
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <h3 className="font-semibold mb-2 text-blue-900">How to use</h3>
                        <ul className="text-sm text-blue-800 space-y-1">
                            <li>• Click on any node to see details</li>
                            <li>• Node size = connection strength</li>
                            <li>• Line style = connection type</li>
                            <li>• Use filter to focus on specific connections</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Expanded Full-Screen View */}
            {isExpanded && (
                <div className="fixed inset-0 z-50 bg-gray-900">
                    {/* Full Screen Graph */}
                    <div className="w-full h-full relative">
                        <svg
                            ref={svgRef}
                            width={expandedWidth}
                            height={expandedHeight}
                            className="bg-gray-800"
                        >
                            {/* Define line patterns for different connection types */}
                            <defs>
                                <pattern id="dashed-expanded" patternUnits="userSpaceOnUse" width="10" height="1">
                                    <rect width="5" height="1" fill="#9ca3af" />
                                    <rect x="5" width="5" height="1" fill="transparent" />
                                </pattern>
                                <pattern id="dotted-expanded" patternUnits="userSpaceOnUse" width="6" height="1">
                                    <rect width="2" height="1" fill="#9ca3af" />
                                    <rect x="2" width="4" height="1" fill="transparent" />
                                </pattern>
                            </defs>

                            {/* Links */}
                            {links.map((link, index) => {
                                const sourceNode = nodes.find(n => n.id === link.source);
                                const targetNode = nodes.find(n => n.id === link.target);

                                let stroke = "#9ca3af";
                                let strokeDasharray = "none";
                                let opacity = 0.7;

                                // Apply strength filter opacity
                                if (strengthFilter > 0) {
                                    const targetStrengthNum = strengthToNumber(targetNode?.strength);
                                    opacity = targetStrengthNum === strengthFilter ? 0.9 : 0.1;
                                }

                                // Apply connection path highlighting for links
                                if (selectedNode && selectedNode.id !== 'you') {
                                    const isSourceInPath = pathNodeIds.has(link.source);
                                    const isTargetInPath = pathNodeIds.has(link.target);

                                    if (isSourceInPath && isTargetInPath) {
                                        // Both nodes are in the path - highlight the link
                                        opacity = Math.max(opacity, 0.9);
                                        stroke = "#3b82f6"; // Blue color for path links
                                    } else {
                                        // Link is not part of the connection path - reduce opacity
                                        opacity = Math.min(opacity, 0.1);
                                    }
                                }

                                if (link.strokeStyle === 'dashed') {
                                    strokeDasharray = "8,4";
                                } else if (link.strokeStyle === 'dotted') {
                                    strokeDasharray = "2,3";
                                }

                                return (
                                    <line
                                        key={index}
                                        x1={sourceNode.x}
                                        y1={sourceNode.y}
                                        x2={targetNode.x}
                                        y2={targetNode.y}
                                        stroke={stroke}
                                        strokeWidth={link.strokeWidth}
                                        strokeDasharray={strokeDasharray}
                                        opacity={opacity}
                                    />
                                );
                            })}

                            {/* Nodes */}
                            {nodes.map((node) => {
                                let nodeOpacity = 1;

                                // Apply strength filter opacity to nodes (except "you")
                                if (strengthFilter > 0 && node.id !== 'you') {
                                    const nodeStrengthNum = strengthToNumber(node.strength);
                                    nodeOpacity = nodeStrengthNum === strengthFilter ? 1 : 0.3;
                                }

                                // Apply connection path highlighting
                                if (selectedNode && selectedNode.id !== 'you') {
                                    if (pathNodeIds.has(node.id)) {
                                        // Node is part of the connection path - keep full opacity
                                        nodeOpacity = Math.max(nodeOpacity, 1);
                                    } else {
                                        // Node is not part of the connection path - reduce opacity
                                        nodeOpacity = Math.min(nodeOpacity, 0.3);
                                    }
                                }

                                return (
                                    <g key={node.id} opacity={nodeOpacity}>
                                        <circle
                                            cx={node.x}
                                            cy={node.y}
                                            r={node.radius}
                                            fill={node.color}
                                            stroke={selectedNode?.id === node.id ? '#fff' : '#374151'}
                                            strokeWidth={selectedNode?.id === node.id ? 3 : 2}
                                            className="cursor-pointer hover:opacity-80 transition-opacity"
                                            onClick={() => handleNodeClick(node)}
                                        />
                                        <text
                                            x={node.x}
                                            y={node.y + node.radius + 15}
                                            textAnchor="middle"
                                            className="text-sm font-medium fill-gray-200"
                                            style={{ pointerEvents: 'none' }}
                                        >
                                            {node.name}
                                        </text>
                                    </g>
                                );
                            })}
                        </svg>
                    </div>

                    {/* Close Button */}
                    <button
                        onClick={() => setIsExpanded(false)}
                        className="absolute top-6 right-6 p-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white hover:bg-white/20 transition-all duration-300 shadow-lg"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>

                    {/* Glassy Controls Panel - Top Left */}
                    <div className="absolute top-6 left-6 p-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-lg">
                        <h3 className="text-white font-semibold mb-3">Network Graph Controls</h3>

                        {/* Connection View */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <label className="text-sm font-medium text-white/90">
                                    Connection View:
                                </label>
                                <select
                                    value={graphFilter}
                                    onChange={(e) => setGraphFilter(e.target.value)}
                                    className="bg-white/20 backdrop-blur-sm border border-white/30 rounded px-3 py-1 text-sm text-white"
                                >
                                    <option value="all" className="text-gray-900">All Connections</option>
                                    <option value="direct" className="text-gray-900">Direct Only</option>
                                    <option value="introduced" className="text-gray-900">Through Others</option>
                                    <option value="external" className="text-gray-900">External Introductions</option>
                                </select>
                            </div>

                            {/* Filter by Strength */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-white/90">
                                    Filter by Strength:
                                </label>
                                <div className="space-y-1">
                                    <input
                                        type="range"
                                        min="0"
                                        max="6"
                                        value={strengthFilter}
                                        onChange={(e) => setStrengthFilter(parseInt(e.target.value))}
                                        className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer backdrop-blur-sm"
                                        style={{
                                            background: `linear-gradient(to right, #6366f1 0%, #3b82f6 16.67%, #10b981 33.33%, #f59e0b 50%, #f97316 66.67%, #ef4444 83.33%, #dc2626 100%)`
                                        }}
                                    />
                                    <div className="text-center text-xs font-medium text-white/80">
                                        {strengthFilter === 0 ? 'Showing All' : getStrengthLabel(numberToStrength(strengthFilter))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Glassy Connection Types Panel - Bottom Left */}
                    <div className="absolute bottom-6 left-6 p-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-lg">
                        <h3 className="text-white font-semibold mb-3">Connection Types</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-0.5 bg-gray-300"></div>
                                <span className="text-white/90">Direct connection</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-0.5 border-t-2 border-dashed border-gray-300"></div>
                                <span className="text-white/90">Introduced by network</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-0.5 border-t-2 border-dotted border-gray-300"></div>
                                <span className="text-white/90">External introduction</span>
                            </div>
                        </div>
                    </div>

                    {/* Glassy Connection Strength Panel - Bottom Right */}
                    <div className="absolute bottom-6 right-6 p-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-lg">
                        <h3 className="text-white font-semibold mb-3">Connection Strength</h3>
                        <div className="space-y-2">
                            {[
                                { name: 'Fleeting', color: '#6366f1' },
                                { name: 'Acquaintance', color: '#3b82f6' },
                                { name: 'Casual', color: '#10b981' },
                                { name: 'Working', color: '#f59e0b' },
                                { name: 'Strong', color: '#f97316' },
                                { name: 'Core', color: '#ef4444' }
                            ].map((item) => (
                                <div key={item.name} className="flex items-center gap-2">
                                    <div
                                        className="w-4 h-4 rounded-full border border-white/20"
                                        style={{ backgroundColor: item.color }}
                                    ></div>
                                    <span className="text-sm text-white/90">{item.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Selected Node Details Panel - Top Right */}
                    {selectedNode && selectedNode.id !== 'you' && (
                        <div className="absolute top-6 right-6 mr-16 p-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-lg max-w-sm">
                            <h3 className="text-white font-semibold mb-3">Selected Person</h3>
                            <div className="space-y-2 text-sm">
                                <div className="text-white/90"><strong>Name:</strong> {selectedNode.name}</div>
                                <div className="text-white/90"><strong>Company:</strong> {selectedNode.company}</div>
                                <div className="text-white/90"><strong>Role:</strong> {selectedNode.role}</div>
                                <div className="text-white/90"><strong>Connection:</strong> {selectedNode.strength}</div>
                                {selectedNode.connection?.introducedByType === 'existing' && selectedNode.connection?.introducedBy && (
                                    <div className="text-white/90"><strong>Introduced by:</strong> {people.find(p => p.id === selectedNode.connection.introducedBy)?.name || 'Unknown'}</div>
                                )}
                                {selectedNode.connection?.introducedByType === 'external' && selectedNode.connection?.introducedByName && (
                                    <div className="text-white/90"><strong>Introduced by:</strong> {selectedNode.connection.introducedByName}</div>
                                )}

                                {/* Connection Path */}
                                <div className="pt-2 border-t border-white/20">
                                    <div className="font-medium text-white/90 mb-1">Connection Path:</div>
                                    <div className="text-xs bg-blue-500/20 backdrop-blur-sm p-2 rounded border-l-2 border-blue-400">
                                        {(() => {
                                            // Find the full person object from the people array
                                            const fullPerson = people.find(p => p.id === selectedNode.id);
                                            if (!fullPerson) {
                                                return (
                                                    <div className="flex items-center gap-1">
                                                        <span className="font-medium text-blue-300">You</span>
                                                        <span className="text-blue-400">→</span>
                                                        <span className="font-medium text-blue-300">{selectedNode.name}</span>
                                                        <span className="text-white/60 ml-2">(Direct)</span>
                                                    </div>
                                                );
                                            }

                                            // Build the full connection path
                                            const connectionPath = buildFullConnectionPath(fullPerson, people);

                                            // Determine connection type for label
                                            let connectionLabel = '(Direct connection)';
                                            if (fullPerson.connection?.introducedByType === 'existing') {
                                                connectionLabel = connectionPath.length > 2 ? '(Through network)' : '(Through network)';
                                            } else if (fullPerson.connection?.introducedByType === 'external') {
                                                connectionLabel = '(External intro)';
                                            }

                                            return (
                                                <div className="flex items-center gap-1 flex-wrap">
                                                    {connectionPath.map((person, index) => (
                                                        <div key={index} className="flex items-center gap-1">
                                                            <span className={`font-medium ${person === 'You' ? 'text-blue-300' :
                                                                fullPerson.connection?.introducedByType === 'external' && index === connectionPath.length - 2 ? 'text-orange-300' :
                                                                    'text-blue-300'
                                                                }`}>
                                                                {person}
                                                            </span>
                                                            {index < connectionPath.length - 1 && (
                                                                <span className="text-blue-400">→</span>
                                                            )}
                                                        </div>
                                                    ))}
                                                    <span className="text-white/60 ml-2">{connectionLabel}</span>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </div>

                                <button
                                    onClick={() => setSelectedNode(null)}
                                    className="mt-2 text-xs text-blue-300 hover:text-blue-200 underline"
                                >
                                    Clear selection
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ESC Hint */}
                    <div className="absolute top-6 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-black/20 backdrop-blur-sm border border-white/20 rounded-full text-white/70 text-sm">
                        Press <kbd className="px-2 py-1 bg-white/20 rounded text-xs">ESC</kbd> to exit fullscreen
                    </div>
                </div>
            )}
        </>
    );
} 
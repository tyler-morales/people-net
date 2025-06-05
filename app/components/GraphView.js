'use client'
import { useState, useRef, useEffect } from 'react';
import { calculateGraphLayout, calculateGraphLinks } from '../lib/graph-utils';
import { strengthToNumber, numberToStrength, getStrengthLabel } from '../lib/connection-utils';

export default function GraphView({ people }) {
    const svgRef = useRef(null);
    const [selectedNode, setSelectedNode] = useState(null);
    const [nodes, setNodes] = useState([]);
    const [links, setLinks] = useState([]);
    const [graphFilter, setGraphFilter] = useState('all');
    const [strengthFilter, setStrengthFilter] = useState(0);

    // Graph dimensions
    const width = 800;
    const height = 600;

    // Calculate graph layout and links
    useEffect(() => {
        const calculatedNodes = calculateGraphLayout(people, width, height);
        const calculatedLinks = calculateGraphLinks(people, graphFilter);

        setNodes(calculatedNodes);
        setLinks(calculatedLinks);
    }, [people, width, height, graphFilter]);

    function handleNodeClick(node) {
        setSelectedNode(selectedNode?.id === node.id ? null : node);
    }

    return (
        <div className="flex gap-6">
            {/* Graph */}
            <div className="flex-1">
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
                </div>

                <svg
                    ref={svgRef}
                    width={width}
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

            {/* Legend & Details */}
            <div className="w-80 space-y-6">
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
    );
} 
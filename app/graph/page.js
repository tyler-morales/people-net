'use client'
import { useState, useEffect, useRef } from 'react';
import { initialPeople } from '../lib/people-data';
import PageHeader from '../components/PageHeader';

export default function GraphPage() {
    const [people] = useState(initialPeople);
    const svgRef = useRef(null);
    const [selectedNode, setSelectedNode] = useState(null);
    const [nodes, setNodes] = useState([]);
    const [links, setLinks] = useState([]);

    // Graph dimensions
    const width = 800;
    const height = 600;

    // Calculate positions only on client side to avoid hydration mismatch
    useEffect(() => {
        const calculatedNodes = [
            { id: 'you', name: 'You', x: width / 2, y: height / 2, radius: 30, color: '#3b82f6' },
            ...people.map((person, index) => {
                const angle = (index * 2 * Math.PI) / people.length;
                const radius = 200;
                return {
                    id: person.id,
                    name: person.name,
                    company: person.company,
                    role: person.role,
                    strength: person.connection?.strength,
                    x: Math.round((width / 2 + Math.cos(angle) * radius) * 100) / 100,
                    y: Math.round((height / 2 + Math.sin(angle) * radius) * 100) / 100,
                    radius: getNodeRadius(person.connection?.strength),
                    color: getNodeColor(person.connection?.strength)
                };
            })
        ];

        const calculatedLinks = people.map(person => ({
            source: 'you',
            target: person.id,
            strength: person.connection?.strength,
            strokeWidth: getStrokeWidth(person.connection?.strength)
        }));

        setNodes(calculatedNodes);
        setLinks(calculatedLinks);
    }, [people, width, height]);

    function getNodeRadius(strength) {
        const radiusMap = {
            'fleeting': 15,
            'acquaintance': 18,
            'casual': 21,
            'working': 24,
            'strong': 27,
            'core': 30
        };
        return radiusMap[strength] || 15;
    }

    function getNodeColor(strength) {
        const colorMap = {
            'fleeting': '#ef4444',
            'acquaintance': '#f97316',
            'casual': '#f59e0b',
            'working': '#10b981',
            'strong': '#3b82f6',
            'core': '#8b5cf6'
        };
        return colorMap[strength] || '#6b7280';
    }

    function getStrokeWidth(strength) {
        const widthMap = {
            'fleeting': 1,
            'acquaintance': 2,
            'casual': 3,
            'working': 4,
            'strong': 5,
            'core': 6
        };
        return widthMap[strength] || 1;
    }

    function handleNodeClick(node) {
        setSelectedNode(selectedNode?.id === node.id ? null : node);
    }

    // Don't render until nodes are calculated
    if (nodes.length === 0) {
        return (
            <main>
                <PageHeader
                    currentPage="graph"
                    title="🌐 PeopleNet Graph"
                    subtitle="Visual network of your professional relationships."
                />
                <div className="flex items-center justify-center h-96">
                    <div className="text-gray-500">Loading graph...</div>
                </div>
            </main>
        );
    }

    return (
        <main className="">
            <PageHeader
                currentPage="graph"
                title="🌐 PeopleNet Graph"
                subtitle="Visual network of your professional relationships."
            />

            <div className="flex gap-6">
                {/* Graph */}
                <div className="flex-1">
                    <svg
                        ref={svgRef}
                        width={width}
                        height={height}
                        className="border border-gray-300 rounded-lg bg-gray-50"
                    >
                        {/* Links */}
                        {links.map((link, index) => {
                            const sourceNode = nodes.find(n => n.id === link.source);
                            const targetNode = nodes.find(n => n.id === link.target);
                            return (
                                <line
                                    key={index}
                                    x1={sourceNode.x}
                                    y1={sourceNode.y}
                                    x2={targetNode.x}
                                    y2={targetNode.y}
                                    stroke="#6b7280"
                                    strokeWidth={link.strokeWidth}
                                    opacity={0.6}
                                />
                            );
                        })}

                        {/* Nodes */}
                        {nodes.map((node) => (
                            <g key={node.id}>
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
                        ))}
                    </svg>
                </div>

                {/* Legend & Details */}
                <div className="w-80 space-y-6">
                    {/* Legend */}
                    <div className="bg-white p-4 rounded-lg border border-gray-300">
                        <h3 className="font-semibold mb-3">Connection Strength</h3>
                        <div className="space-y-2">
                            {[
                                { name: 'Fleeting', color: '#ef4444' },
                                { name: 'Acquaintance', color: '#f97316' },
                                { name: 'Casual', color: '#f59e0b' },
                                { name: 'Working', color: '#10b981' },
                                { name: 'Strong', color: '#3b82f6' },
                                { name: 'Core', color: '#8b5cf6' }
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
                            </div>
                        </div>
                    )}

                    {/* Instructions */}
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <h3 className="font-semibold mb-2 text-blue-900">How to use</h3>
                        <ul className="text-sm text-blue-800 space-y-1">
                            <li>• Click on any node to see details</li>
                            <li>• Node size = connection strength</li>
                            <li>• Line thickness = relationship depth</li>
                            <li>• You are at the center (blue)</li>
                        </ul>
                    </div>
                </div>
            </div>
        </main>
    );
}
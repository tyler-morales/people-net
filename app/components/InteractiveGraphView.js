'use client'
import { useState, useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { strengthToNumber, numberToStrength, getStrengthLabel } from '../lib/connection-utils';
import { buildFullConnectionPath } from '../lib/graph-utils';

// Utility functions for D3 graph
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
        'fleeting': '#6366f1',
        'acquaintance': '#3b82f6',
        'casual': '#10b981',
        'working': '#f59e0b',
        'strong': '#f97316',
        'core': '#ef4444'
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

// Helper function to determine node opacity based on strength filter
function getNodeOpacity(nodeStrength, strengthFilter) {
    if (strengthFilter === 0) return 1; // Show all when filter is 0

    const strengthValues = {
        'fleeting': 1,
        'acquaintance': 2,
        'casual': 3,
        'working': 4,
        'strong': 5,
        'core': 6
    };

    const nodeStrengthValue = strengthValues[nodeStrength] || 1;
    return nodeStrengthValue >= strengthFilter ? 1 : 0.2; // Full opacity if meets criteria, 20% if not
}

export default function InteractiveGraphView({ people, userProfile, onEditUserProfile }) {
    const svgRef = useRef(null);
    const simulationRef = useRef(null);
    const zoomRef = useRef(null);
    const [selectedNode, setSelectedNode] = useState(null);
    const [graphFilter, setGraphFilter] = useState('all');
    const [strengthFilter, setStrengthFilter] = useState(0);
    const [groupBy, setGroupBy] = useState('none');
    const [isExpanded, setIsExpanded] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(1);
    const [prevGroupBy, setPrevGroupBy] = useState('none');

    // Graph dimensions
    const width = 800;
    const height = 600;
    const expandedWidth = window.innerWidth;
    const expandedHeight = window.innerHeight;

    // Prepare data for D3
    const prepareGraphData = () => {
        let nodes = [];
        let links = [];

        // Check if user profile exists in people data
        const userProfileFromPeople = people.find(person => person.isUserProfile);

        // Create "You" node - use people data if available, otherwise use userProfile state
        const youNode = userProfileFromPeople ? {
            id: userProfileFromPeople.id,
            name: userProfileFromPeople.name,
            type: 'user',
            radius: 30,
            color: userProfile?.color || '#3b82f6',
            isGroup: false,
            fx: null, // Allow dragging initially
            fy: null,
            role: userProfileFromPeople.role || '',
            company: userProfileFromPeople.company || '',
            team: userProfileFromPeople.team || '',
            location: userProfileFromPeople.location || '',
            workHours: userProfileFromPeople.workHours || '',
            notes: userProfileFromPeople.notes || '',
            isUser: true,
            isUserProfile: true
        } : {
            id: 'you',
            name: userProfile?.name || 'You',
            type: 'user',
            radius: 30,
            color: userProfile?.color || '#3b82f6',
            isGroup: false,
            fx: null, // Allow dragging initially
            fy: null,
            role: userProfile?.role || '',
            company: userProfile?.company || '',
            team: userProfile?.team || '',
            location: userProfile?.location || '',
            workHours: userProfile?.workHours || '',
            notes: userProfile?.notes || '',
            isUser: true
        };

        if (groupBy === 'none') {
            // Standard layout - just people connected to you
            // Filter out the user profile from people data to avoid duplication
            const otherPeople = people.filter(person => !person.isUserProfile);

            nodes = [
                youNode,
                ...otherPeople.map(person => ({
                    id: person.id,
                    name: person.name,
                    type: 'person',
                    company: person.company,
                    role: person.role,
                    team: person.team,
                    strength: person.connection?.strength,
                    connection: person.connection,
                    radius: getNodeRadius(person.connection?.strength),
                    color: getNodeColor(person.connection?.strength),
                    isGroup: false
                }))
            ];

            // Create links based on filter
            if (graphFilter === 'all' || graphFilter === 'direct') {
                const directLinks = otherPeople
                    .filter(person => !person.connection?.introducedBy && person.connection?.introducedByType === 'direct')
                    .map(person => ({
                        source: youNode.id, // Use the actual you node ID
                        target: person.id,
                        strength: person.connection?.strength,
                        strokeWidth: getStrokeWidth(person.connection?.strength),
                        type: 'direct',
                        strokeStyle: 'solid'
                    }));
                links = [...links, ...directLinks];
            }

            if (graphFilter === 'all' || graphFilter === 'introduced') {
                const indirectLinks = otherPeople
                    .filter(person => person.connection?.introducedBy && person.connection?.introducedByType === 'existing')
                    .map(person => ({
                        source: person.connection.introducedBy,
                        target: person.id,
                        strength: person.connection?.strength,
                        strokeWidth: Math.max(1, getStrokeWidth(person.connection?.strength) - 1),
                        type: 'introduced',
                        strokeStyle: 'dashed'
                    }));
                links = [...links, ...indirectLinks];

                const introducerLinks = otherPeople
                    .filter(person => person.connection?.introducedBy && person.connection?.introducedByType === 'existing')
                    .map(person => person.connection.introducedBy)
                    .filter((introducerId, index, arr) => arr.indexOf(introducerId) === index)
                    .filter(introducerId => !otherPeople.find(p => p.id === introducerId && p.connection?.introducedByType === 'direct'))
                    .map(introducerId => ({
                        source: youNode.id, // Use the actual you node ID
                        target: introducerId,
                        strength: 'casual',
                        strokeWidth: 2,
                        type: 'connector',
                        strokeStyle: 'dotted'
                    }));
                links = [...links, ...introducerLinks];
            }

            if (graphFilter === 'all' || graphFilter === 'external') {
                const externalLinks = otherPeople
                    .filter(person => person.connection?.introducedByType === 'external')
                    .map(person => ({
                        source: youNode.id, // Use the actual you node ID
                        target: person.id,
                        strength: person.connection?.strength,
                        strokeWidth: getStrokeWidth(person.connection?.strength),
                        type: 'external',
                        strokeStyle: 'solid'
                    }));
                links = [...links, ...externalLinks];
            }
        } else {
            // Grouped layout
            const otherPeople = people.filter(person => !person.isUserProfile);
            const groupKeys = [...new Set(otherPeople.map(p => p[groupBy]).filter(Boolean))];

            // Create group nodes
            const groupNodes = groupKeys.map(key => ({
                id: `group-${key}`,
                name: key,
                type: 'group',
                isGroup: true,
                radius: 25,
                color: '#a8a29e'
            }));

            // Create person nodes
            const personNodes = otherPeople.map(person => ({
                id: person.id,
                name: person.name,
                type: 'person',
                company: person.company,
                role: person.role,
                team: person.team,
                strength: person.connection?.strength,
                connection: person.connection,
                radius: getNodeRadius(person.connection?.strength),
                color: getNodeColor(person.connection?.strength),
                isGroup: false,
                groupId: `group-${person[groupBy]}`
            }));

            nodes = [youNode, ...groupNodes, ...personNodes];

            // Create group links
            const groupLinks = otherPeople
                .filter(person => person[groupBy])
                .map(person => ({
                    source: person.id,
                    target: `group-${person[groupBy]}`,
                    strokeWidth: 1,
                    strokeStyle: 'dashed',
                    type: 'group'
                }));
            links = [...links, ...groupLinks];

            // Add original connection links (filtered)
            if (graphFilter === 'all' || graphFilter === 'direct') {
                const directLinks = otherPeople
                    .filter(person => !person.connection?.introducedBy && person.connection?.introducedByType === 'direct')
                    .map(person => ({
                        source: youNode.id, // Use the actual you node ID
                        target: person.id,
                        strength: person.connection?.strength,
                        strokeWidth: getStrokeWidth(person.connection?.strength),
                        type: 'direct',
                        strokeStyle: 'solid'
                    }));
                links = [...links, ...directLinks];
            }
        }

        return { nodes, links };
    };

    // Initialize and update D3 visualization
    useEffect(() => {
        if (!svgRef.current) return;

        const svg = d3.select(svgRef.current);
        const currentWidth = isExpanded ? expandedWidth : width;
        const currentHeight = isExpanded ? expandedHeight : height;

        // Store current zoom transform before clearing
        let currentTransform = d3.zoomIdentity;
        if (zoomRef.current) {
            const currentSvg = d3.select(svgRef.current);
            currentTransform = d3.zoomTransform(currentSvg.node()) || d3.zoomIdentity;

            // Reset zoom when switching between grouped and non-grouped modes
            const wasGrouped = prevGroupBy !== 'none';
            const isGrouped = groupBy !== 'none';
            if (wasGrouped !== isGrouped) {
                currentTransform = d3.zoomIdentity;
                setZoomLevel(1);
            }
        }

        // Clear previous content
        svg.selectAll("*").remove();

        // Get data
        const { nodes, links } = prepareGraphData();

        // Create zoom behavior
        const zoom = d3.zoom()
            .scaleExtent([0.1, 4])
            .on("zoom", function (event) {
                const { transform } = event;
                setZoomLevel(transform.k);
                g.attr("transform", transform);
            });

        zoomRef.current = zoom;

        // Apply zoom to SVG
        svg.call(zoom);

        // Create container group for all elements (this will be transformed by zoom)
        const g = svg.append("g")
            .attr("class", "zoom-container");

        // Restore previous zoom transform
        svg.call(zoom.transform, currentTransform);

        // Create simulation
        const simulation = d3.forceSimulation(nodes)
            .force("link", d3.forceLink(links).id(d => d.id).distance(100))
            .force("charge", d3.forceManyBody().strength(-300))
            .force("center", d3.forceCenter(currentWidth / 2, currentHeight / 2))
            .force("collision", d3.forceCollide().radius(d => d.radius + 5));

        simulationRef.current = simulation;

        // Create line patterns in defs
        const defs = svg.append("defs");

        const dashPattern = defs.append("pattern")
            .attr("id", "dash-pattern")
            .attr("patternUnits", "userSpaceOnUse")
            .attr("width", 10)
            .attr("height", 1);
        dashPattern.append("rect").attr("width", 5).attr("height", 1).attr("fill", "#6b7280");
        dashPattern.append("rect").attr("x", 5).attr("width", 5).attr("height", 1).attr("fill", "transparent");

        const dotPattern = defs.append("pattern")
            .attr("id", "dot-pattern")
            .attr("patternUnits", "userSpaceOnUse")
            .attr("width", 6)
            .attr("height", 1);
        dotPattern.append("rect").attr("width", 2).attr("height", 1).attr("fill", "#6b7280");
        dotPattern.append("rect").attr("x", 2).attr("width", 4).attr("height", 1).attr("fill", "transparent");

        // Create links inside the zoom container
        const link = g.append("g")
            .attr("class", "links")
            .selectAll("line")
            .data(links)
            .enter().append("line")
            .attr("stroke", "#6b7280")
            .attr("stroke-opacity", 0.6)
            .attr("stroke-width", d => d.strokeWidth || 1)
            .attr("stroke-dasharray", d => {
                if (d.strokeStyle === 'dashed') return "8,4";
                if (d.strokeStyle === 'dotted') return "2,3";
                return "none";
            });

        // Create nodes inside the zoom container
        const node = g.append("g")
            .attr("class", "nodes")
            .selectAll("g")
            .data(nodes)
            .enter().append("g")
            .attr("class", "node")
            .call(d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended));

        // Add circles to nodes
        node.append("circle")
            .attr("r", d => d.radius)
            .attr("fill", d => d.color)
            .attr("stroke", "#fff")
            .attr("stroke-width", 2)
            .style("cursor", "pointer")
            .style("opacity", d => {
                // Always show "You" node at full opacity
                if (d.isUser || d.isUserProfile || d.type === 'user') return 1;
                // Always show group nodes at full opacity
                if (d.isGroup) return 1;
                // Apply strength filter to other nodes
                return getNodeOpacity(d.strength, strengthFilter);
            });

        // Add labels to nodes
        node.append("text")
            .text(d => d.name)
            .attr("text-anchor", "middle")
            .attr("dy", d => d.radius + 15)
            .attr("class", "text-sm font-medium fill-gray-700")
            .style("pointer-events", "none")
            .style("opacity", d => {
                // Always show "You" node label at full opacity
                if (d.isUser || d.isUserProfile || d.type === 'user') return 1;
                // Always show group node labels at full opacity
                if (d.isGroup) return 1;
                // Apply strength filter to other node labels
                return getNodeOpacity(d.strength, strengthFilter);
            });

        // Add click handler
        node.on("click", function (event, d) {
            if (d.id === 'you' || d.isUser || d.isUserProfile) {
                // Open user profile modal for "You" node
                onEditUserProfile();
            } else {
                // Regular node selection
                setSelectedNode(selectedNode?.id === d.id ? null : d);
            }
        });

        // Update positions on simulation tick
        simulation.on("tick", () => {
            link
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);

            node
                .attr("transform", d => `translate(${d.x},${d.y})`);
        });

        // Drag functions
        function dragstarted(event, d) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }

        function dragged(event, d) {
            d.fx = event.x;
            d.fy = event.y;
        }

        function dragended(event, d) {
            if (!event.active) simulation.alphaTarget(0);
            // Keep the node fixed at its dragged position
            // Comment out the next two lines if you want nodes to float after dragging
            // d.fx = null;
            // d.fy = null;
        }

        // Cleanup function
        return () => {
            if (simulationRef.current) {
                simulationRef.current.stop();
            }
        };

    }, [people, graphFilter, groupBy, strengthFilter, isExpanded, expandedWidth, expandedHeight]);

    // Zoom control functions
    const handleZoomIn = () => {
        if (svgRef.current && zoomRef.current) {
            d3.select(svgRef.current)
                .transition()
                .duration(300)
                .call(zoomRef.current.scaleBy, 1.5);
        }
    };

    const handleZoomOut = () => {
        if (svgRef.current && zoomRef.current) {
            d3.select(svgRef.current)
                .transition()
                .duration(300)
                .call(zoomRef.current.scaleBy, 1 / 1.5);
        }
    };

    const handleZoomReset = () => {
        if (svgRef.current && zoomRef.current) {
            d3.select(svgRef.current)
                .transition()
                .duration(500)
                .call(zoomRef.current.transform, d3.zoomIdentity);
        }
    };

    // Handle escape key for fullscreen
    useEffect(() => {
        const handleEscape = (event) => {
            if (event.key === 'Escape' && isExpanded) {
                setIsExpanded(false);
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isExpanded]);

    // Get path node IDs for highlighting
    const getPathNodeIds = () => {
        const userProfileFromPeople = people.find(person => person.isUserProfile);
        const youNodeId = userProfileFromPeople ? userProfileFromPeople.id : 'you';

        if (!selectedNode || selectedNode.id === youNodeId || selectedNode.isUser || selectedNode.isUserProfile) {
            return new Set();
        }

        const fullPerson = people.find(p => p.id === selectedNode.id);
        if (!fullPerson) {
            return new Set([youNodeId, selectedNode.id]);
        }

        const connectionPath = buildFullConnectionPath(fullPerson, people);
        const pathNodeIds = new Set([youNodeId]);

        connectionPath.forEach(personName => {
            if (personName === 'You') {
                pathNodeIds.add(youNodeId);
            } else {
                const person = people.find(p => p.name === personName);
                if (person) {
                    pathNodeIds.add(person.id);
                }
            }
        });

        return pathNodeIds;
    };

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

                        <div className="flex items-center gap-4">
                            <label className="text-sm font-medium text-gray-700">
                                Group By:
                            </label>
                            <select
                                value={groupBy}
                                onChange={(e) => {
                                    setGroupBy(e.target.value);
                                    setPrevGroupBy(groupBy);
                                }}
                                className="border border-gray-300 rounded px-3 py-1 text-sm"
                            >
                                <option value="none">None</option>
                                <option value="team">Team</option>
                                <option value="company">Company</option>
                                <option value="role">Role</option>
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

                    <div className="relative">
                        <svg
                            ref={svgRef}
                            width="100%"
                            height={height}
                            className="border border-gray-300 rounded-lg bg-gray-50 cursor-grab"
                            style={{ cursor: 'grab' }}
                        />

                        {/* Zoom Controls */}
                        <div className="absolute top-4 right-4 flex flex-col gap-2">
                            <button
                                onClick={handleZoomIn}
                                className="w-8 h-8 bg-white/90 backdrop-blur-sm border border-gray-300 rounded-lg shadow-sm hover:bg-white flex items-center justify-center text-gray-700 hover:text-gray-900 transition-all"
                                title="Zoom In"
                            >
                                +
                            </button>
                            <button
                                onClick={handleZoomOut}
                                className="w-8 h-8 bg-white/90 backdrop-blur-sm border border-gray-300 rounded-lg shadow-sm hover:bg-white flex items-center justify-center text-gray-700 hover:text-gray-900 transition-all"
                                title="Zoom Out"
                            >
                                −
                            </button>
                            <button
                                onClick={handleZoomReset}
                                className="w-8 h-8 bg-white/90 backdrop-blur-sm border border-gray-300 rounded-lg shadow-sm hover:bg-white flex items-center justify-center text-gray-700 hover:text-gray-900 transition-all text-xs"
                                title="Reset Zoom"
                            >
                                ⌂
                            </button>
                        </div>

                        {/* Zoom Level Indicator */}
                        <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm border border-gray-300 rounded-lg px-2 py-1 text-xs text-gray-600">
                            {Math.round(zoomLevel * 100)}%
                        </div>

                        {/* Interaction hint */}
                        <div className="absolute top-4 left-4 bg-blue-50 text-blue-800 text-xs px-3 py-2 rounded-lg border border-blue-200">
                            💡 Drag nodes • Scroll to zoom • Pan with click & drag • Click "You" to edit profile
                        </div>
                    </div>
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
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-0.5 border-t-2 border-dashed border-stone-400"></div>
                                <span>Group connection</span>
                            </div>
                        </div>
                    </div>

                    {/* Interactive Features */}
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <h3 className="font-semibold mb-2 text-blue-900">Interactive Features</h3>
                        <ul className="text-sm text-blue-800 space-y-1">
                            <li>• <strong>Drag</strong> any node to move it</li>
                            <li>• <strong>Click</strong> nodes to see details</li>
                            <li>• <strong>Scroll wheel</strong> to zoom in/out</li>
                            <li>• <strong>Click & drag</strong> background to pan</li>
                            <li>• <strong>Zoom buttons</strong> in top-right corner</li>
                            <li>• Nodes stay where you place them</li>
                            <li>• Physics simulation keeps everything connected</li>
                        </ul>
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
                    {selectedNode && selectedNode.id !== 'you' && !selectedNode.isGroup && (
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

                    {/* User Profile Details */}
                    {selectedNode && (selectedNode.id === 'you' || selectedNode.isUser || selectedNode.isUserProfile) && (
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                            <h3 className="font-semibold mb-3 text-blue-900">Your Profile</h3>
                            <div className="space-y-2 text-sm">
                                <div><strong>Name:</strong> {selectedNode.name || userProfile?.name || 'You'}</div>
                                {(selectedNode.role || userProfile?.role) && <div><strong>Role:</strong> {selectedNode.role || userProfile.role}</div>}
                                {(selectedNode.company || userProfile?.company) && <div><strong>Company:</strong> {selectedNode.company || userProfile.company}</div>}
                                {(selectedNode.team || userProfile?.team) && <div><strong>Team:</strong> {selectedNode.team || userProfile.team}</div>}
                                {(selectedNode.location || userProfile?.location) && <div><strong>Location:</strong> {selectedNode.location || userProfile.location}</div>}
                                {(selectedNode.workHours || userProfile?.workHours) && <div><strong>Work Hours:</strong> {selectedNode.workHours || userProfile.workHours}</div>}
                                {(selectedNode.notes || userProfile?.notes) && (
                                    <div>
                                        <strong>Notes:</strong>
                                        <div className="mt-1 text-xs bg-white p-2 rounded border">
                                            {selectedNode.notes || userProfile.notes}
                                        </div>
                                    </div>
                                )}
                                <button
                                    onClick={onEditUserProfile}
                                    className="mt-2 text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors"
                                >
                                    ✏️ Edit Profile
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Group Node Details */}
                    {selectedNode && selectedNode.isGroup && (
                        <div className="bg-white p-4 rounded-lg border border-gray-300">
                            <h3 className="font-semibold mb-3">Selected Group</h3>
                            <div className="space-y-2 text-sm">
                                <div><strong>Group:</strong> {selectedNode.name}</div>
                                <div><strong>Type:</strong> {groupBy}</div>
                                <div><strong>Members:</strong> {people.filter(p => p[groupBy] === selectedNode.name).length}</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Expanded/Fullscreen view would go here - similar structure */}
            {isExpanded && (
                <div className="fixed inset-0 z-50 bg-gray-900">
                    <div className="w-full h-full relative">
                        <svg
                            ref={svgRef}
                            width={expandedWidth}
                            height={expandedHeight}
                            className="bg-gray-800"
                        />

                        <button
                            onClick={() => setIsExpanded(false)}
                            className="absolute top-6 right-6 p-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white hover:bg-white/20 transition-all duration-300 shadow-lg"
                        >
                            ✕
                        </button>

                        <div className="absolute top-4 left-4 bg-blue-500/20 text-blue-200 text-sm px-4 py-2 rounded-lg border border-blue-400/20">
                            💡 Drag nodes to move them around!
                        </div>
                    </div>
                </div>
            )}
        </>
    );
} 
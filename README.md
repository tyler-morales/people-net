# 🌐 People Net

> **A sophisticated graph-based professional network visualization platform built on modern React architecture**

People Net transforms the complexity of professional relationships into an intuitive, multi-dimensional visualization system. At its core, it's a graph database application with rich UI components that allow users to map, analyze, and interact with their professional networks across spatial, temporal, and relational dimensions.

## 🏗️ Architecture Overview

### Core Technology Stack
- **Framework**: Next.js 15.3.3 with App Router and React 19
- **State Management**: Zustand for global state with localStorage persistence
- **Visualization**: Custom WebGL implementations with Three.js and React Globe GL
- **Styling**: Tailwind CSS 4 with custom component system
- **Data Model**: Graph-based with nodes (people) and edges (relationships)

### Application Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Client Layer (React)                        │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────┐ │
│  │  TableView  │  │  GraphView  │  │  GlobeView  │  │TimeZone │ │
│  │    CRUD     │  │   D3-like   │  │   WebGL     │  │ Chart   │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────┘ │
├─────────────────────────────────────────────────────────────────┤
│                   State Management Layer                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   Zustand   │  │ Undo/Redo   │  │ Toast/UI    │             │
│  │   Store     │  │   Stack     │  │  Manager    │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
├─────────────────────────────────────────────────────────────────┤
│                    Service Layer                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ Graph Utils │  │City Service │  │User Prefs   │             │
│  │  Algorithms │  │  Geocoding  │  │ Persistence │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
├─────────────────────────────────────────────────────────────────┤
│                    Data Layer                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ localStorage│  │  City Data  │  │ People Data │             │
│  │ Persistence │  │    Cache    │  │   Models    │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└─────────────────────────────────────────────────────────────────┘
```

## 🧠 Core Concepts & Data Model

### Graph Theory Implementation
People Net implements a **directed graph** where:
- **Nodes** represent individuals with rich metadata
- **Edges** represent relationships with typed connections and strength weights
- **Traversal algorithms** enable network analysis and visualization

### Person Node Schema
```javascript
{
  id: string,           // Unique identifier (URL-safe)
  name: string,         // Full name
  team: string,         // Organizational unit
  company: string,      // Organization
  location: string,     // Geographic location
  workHours: string,    // Temporal availability window
  role: string,         // Professional title
  notes: string,        // Unstructured metadata
  interactions: array   // List of interaction types
}
```

### Relationship Edge Schema
```javascript
{
  source: string,       // Origin node ID
  target: string,       // Target node ID
  type: enum,          // Connection classification
  strength: enum,      // Relationship intensity
  notes: string        // Contextual information
}
```

### Relationship Classification System
- **Connection Types**: `collaborated`, `mentored`, `coordinated`, `reviewed_code`, `led_meeting`, `inspired_me`
- **Strength Tiers**: `fleeting` → `acquaintance` → `casual` → `working` → `strong` → `core`

## 🎯 Feature Architecture

### 1. Multi-View Rendering System
The application implements a **multi-perspective data visualization** approach:

#### Table View (`TableView.js`)
- **CRUD Operations**: Full create, read, update, delete functionality
- **Real-time Persistence**: Automatic localStorage synchronization
- **Field-level Undo/Redo**: Granular history tracking
- **Drag & Drop**: Visual relationship management with `@dnd-kit`

#### Graph View (`GraphView.js`)
- **Force-Directed Layout**: Physics-based node positioning
- **Interactive Zoom/Pan**: Canvas manipulation with gesture support
- **Dynamic Clustering**: Automatic grouping by team/company
- **Edge Filtering**: Relationship type and strength-based filtering

#### Globe View (`GlobeView.js`)
- **3D Geographic Visualization**: WebGL-powered global network mapping
- **Real-time City Resolution**: Geocoding service integration
- **Arc Connections**: Great circle path visualization between locations
- **Camera Controls**: Orbital navigation with smooth animations

#### Timezone Chart (`TimezoneChart.js`)
- **Temporal Analysis**: Working hours overlap calculations
- **Multi-timezone Support**: Global time zone handling
- **Availability Windows**: Visual scheduling assistance
- **Interactive Timeline**: Hour-by-hour team availability

### 2. Advanced State Management

#### Undo/Redo System (`useUndo.js`)
```javascript
// Implements command pattern with action stack
const undoStack = [
  { action: 'update', personId: 'x', field: 'name', oldValue: 'John', newValue: 'Jonathan' },
  { action: 'delete', personId: 'y', data: {...} },
  { action: 'create', personId: 'z', data: {...} }
]
```

#### Persistent State Layer
- **localStorage Integration**: Automatic data persistence
- **Error Recovery**: Graceful fallback to default data
- **State Hydration**: Seamless client-side rehydration

### 3. Service Layer Architecture

#### City Resolution Service (`city-service.js`)
- **Intelligent Geocoding**: City name → coordinates resolution
- **Caching Strategy**: Reduces API calls with persistent storage
- **Fuzzy Matching**: Handles location name variations
- **Batch Processing**: Efficient multiple location resolution

#### Graph Algorithms (`graph-utils.js`)
- **Network Analysis**: Centrality calculations, clustering coefficients
- **Path Finding**: Shortest path between network nodes
- **Community Detection**: Automatic team/cluster identification
- **Layout Algorithms**: Force-directed positioning with customizable physics

## 🎨 UI/UX Architecture

### Component Design System
- **Atomic Design**: Reusable UI components with consistent patterns
- **Toast Notifications**: Non-blocking user feedback system
- **Loading States**: Progressive loading with skeleton screens
- **Responsive Design**: Mobile-first approach with breakpoint optimization

### Interaction Patterns
- **Keyboard Shortcuts**: Power user acceleration (Ctrl+Z for undo)
- **Drag & Drop**: Intuitive relationship management
- **Easter Eggs**: Developer tools activation (Ctrl+Shift+A)
- **Focus Management**: Form field state tracking

### Advanced Features

#### Quick Note System (`QuickNote.js`)
- **Natural Language Processing**: Intelligent person/relationship extraction
- **AI Integration**: Contextual suggestions for connection types
- **Batch Operations**: Multiple relationship creation from single input
- **Machine Learning**: Pattern recognition for relationship strength

#### Terminal Integration
- **Debug Console**: Development-time state inspection
- **Command Interface**: Power user data manipulation
- **Log Aggregation**: Centralized logging with `terminalLogStore.js`

## 🔧 Technical Complexities Solved

### 1. **Real-time Graph Layout**
Challenge: Maintaining performant force-directed layouts with 100+ nodes
Solution: Implemented custom physics simulation with optimized collision detection

### 2. **3D Geographic Rendering**
Challenge: Smooth WebGL performance across devices
Solution: Level-of-detail rendering with adaptive quality based on device capabilities

### 3. **State Synchronization**
Challenge: Keeping multiple views in sync with complex state updates
Solution: Centralized state management with reactive update propagation

### 4. **Data Persistence**
Challenge: Handling localStorage limits and corruption
Solution: Incremental saves with error recovery and data validation

### 5. **Timezone Calculations**
Challenge: Accurate cross-timezone working hour calculations
Solution: Native JavaScript `Intl` API with custom overlap algorithms

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Modern browser with WebGL support

### Installation
```bash
npm install
npm run dev
```

The application will be available at `http://localhost:3000`

### Development Mode Features
- **Hot Module Replacement**: Instant updates during development
- **ESLint Integration**: Code quality enforcement
- **Turbopack**: Faster build times with Next.js optimization

## 📊 Performance Optimizations

- **Lazy Loading**: Components loaded on-demand
- **Memoization**: React.memo for expensive components
- **Virtual Scrolling**: Efficient large dataset handling
- **Canvas Optimization**: RequestAnimationFrame for smooth animations
- **Bundle Splitting**: Code splitting by route and feature

## 🔮 Architecture Decisions

### Why Graph-Based?
Professional networks are inherently graph-structured. Traditional relational models miss the nuanced, multi-dimensional relationships between people.

### Why Multi-View?
Different use cases require different perspectives:
- **Tables** for data entry and management
- **Graphs** for relationship analysis
- **Globe** for geographic insights
- **Timeline** for temporal coordination

### Why Client-Side First?
Professional network data is sensitive. Client-side storage ensures user privacy while maintaining rich functionality.

---

**People Net** represents a sophisticated approach to professional network management, combining graph theory, modern web technologies, and intuitive design to create a powerful tool for understanding and leveraging professional relationships.

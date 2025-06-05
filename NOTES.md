# People Net

## Overview
People Net is a graph network application that visualizes professional relationships and connections between colleagues based on various attributes and interactions.

## Data Model

### Person Node
Each person in the network is represented as a node with the following attributes:

| Attribute    | Example                    | Description                    |
|-------------|----------------------------|--------------------------------|
| id          | 'john-smith'              | Unique, URL-safe identifier    |
| name        | 'John Smith'              | Full name                      |
| team        | 'Alpha'                   | Team/Department                |
| company     | 'Acme Corp'               | Organization                   |
| location    | 'New York'                | Geographic location            |
| workHours   | '9am–5pm EST'             | Working hours                  |
| role        | 'Software Engineer'        | Job title                      |
| notes       | 'Great team player...'     | Additional information         |
| interactions| ['Weekly standups', ...]   | List of regular interactions   |

### Connection Edge
Relationships between people are represented as edges with the following properties:

| Property  | Example                    | Description                    |
|-----------|----------------------------|--------------------------------|
| source    | 'you'                      | Origin of connection           |
| target    | 'john-smith'              | Target person                  |
| type      | 'code_review_partner'      | Nature of relationship         |
| strength  | 'working'                  | Relationship intensity         |
| notes     | 'We reviewed PRs weekly...'| Additional context             |

### Connection Types
| Type            | Description                           |
|----------------|---------------------------------------|
| collaborated   | Worked on a shared project            |
| mentored       | Mentored or was mentored by           |
| coordinated    | Involved in planning or communication |
| reviewed_code  | Shared technical review relationship  |
| led_meeting    | Ran check-ins or planning sessions    |
| inspired_me    | Had a creative or directional impact  |

### Relationship Strength Tiers
| Tier Name      | Description                                           |
|---------------|-------------------------------------------------------|
| fleeting      | Brief interaction, no lasting impact                  |
| acquaintance  | Light connection, you know *of* them                  |
| casual        | Friendly or familiar, occasional conversations        |
| working       | Collaborated together on a project                    |
| strong        | Meaningful shared history, solid trust                |
| core          | Foundational relationship, emotionally defining       |


### JSON Record
````
{
  node: {
    id: 'john-smith',
    name: 'John Smith',
    team: 'Alpha',
    company: 'Acme Corp',
    location: 'New York',
    workHours: '9am–5pm EST',
    role: 'Software Engineer',
    notes: 'Great team player, expert in React',
    interactions: ['Weekly standups', 'Code reviews']
  },
  edge: {
    source: 'you',
    target: 'john-smith',
    type: 'reviewed_code',
    strength: 'working',
    notes: 'Reviewed PRs together weekly during Q1 2023'
  }
}
````

## User Interface

### Table View
A CRUD interface displaying people in a tabular format:

| Team  | Name        | Company    | Location   | Work Hours     | Role              | Notes                          | Interactions                    |
|-------|-------------|------------|------------|----------------|-------------------|--------------------------------|--------------------------------|
| Alpha | John Smith  | Acme Corp  | New York   | 9am-5pm EST    | Software Engineer | Great team player, React expert | Weekly standups, code reviews   |
| Beta  | Jane Doe    | TechStart  | London     | 11am-7pm GMT   | Product Manager   | Strong communicator            | Daily check-ins, planning       |

### Graph View
Interactive visualization of the professional network:

```
                            [Niranjan]
                +----------------+----------------+
                |                |                |
            [Johnathon]       [Sheetal]         [Tom]
                |
          +-----+-----+
          |     |     |
      [Edwar][Denine][Sandeep]
```

Alternative tree representation:
```
[Niranjan]
├── [Johnathon]
│   ├── [Edwar]
│   ├── [Denine]
│   └── [Sandeep Kumar]
├── [Sheetal]
└── [Tom]
```

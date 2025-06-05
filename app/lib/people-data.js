export const initialPeople = [
    {
        id: "niranjan",
        name: "Niranjan",
        team: "",
        company: "Accenture",
        location: "Philly",
        workHours: "9:30 PM – 6:30 AM",
        role: "Hiring Manager / Client Account",
        notes: "Very knowledgeable of codebase",
        interactions: [
            { text: "Demos and describes repo and web application", date: "2023-03-01" }
        ],
        dateMet: "2023-03-01",
        connection: {
            source: "you",
            type: "collaborated",
            strength: "working",
            notes: "Walked me through technical aspects of the project repo.",
            introducedBy: null,
            introducedByName: "",
            introducedByType: "direct"
        }
    },
    {
        id: "saswat-das",
        name: "Saswat Das",
        team: "",
        company: "Accenture",
        location: "",
        workHours: "9:30 PM – 6:30 AM",
        role: "Developer",
        notes: "Very knowledgeable of codebase",
        interactions: [
            { text: "Demos and describes repo and web application", date: "2023-03-01" }
        ],
        dateMet: "2023-03-01",
        connection: {
            source: "you",
            type: "collaborated",
            strength: "working",
            notes: "Helped demo and explain app architecture.",
            introducedBy: "niranjan",
            introducedByName: "",
            introducedByType: "existing"
        }
    },
    {
        id: "tom-limongello",
        name: "Tom Limongello",
        team: "",
        company: "Comcast",
        location: "",
        workHours: "",
        role: "Eng 1, Eng Ops, Tech & Product, Global Tech Org",
        notes: "Handles laptop deployments",
        interactions: [
            { text: "Hardware provisioning assistance", date: "2023-02-15" }
        ],
        dateMet: "2023-02-15",
        connection: {
            source: "you",
            type: "coordinated",
            strength: "fleeting",
            notes: "Assisted with hardware provisioning.",
            introducedBy: "niranjan",
            introducedByName: "",
            introducedByType: "existing"
        }
    },
    {
        id: "sheetal-punde",
        name: "Sheetal Babulal Punde",
        team: "",
        company: "Accenture (Davinci)",
        location: "Pune, India",
        workHours: "11:00 AM – 9:30/10 PM",
        role: "React Front-End Developer",
        notes: "First Davinci team member; Windows laptop",
        interactions: [
            { text: "Hybrid employee onboarding", date: "2023-04-10" }
        ],
        dateMet: "2023-04-10",
        connection: {
            source: "you",
            type: "collaborated",
            strength: "casual",
            notes: "Worked together on front-end tickets.",
            introducedBy: "saswat-das",
            introducedByName: "",
            introducedByType: "existing"
        }
    },
    {
        id: "jonathon-connolly",
        name: "Jonathon Connolly",
        team: "Buy Flow",
        company: "Comcast",
        location: "Philly",
        workHours: "10:00 AM – 6:00 PM EST",
        role: "Manager, Buy Flow Department",
        notes: "Manages the purchase flow with 5 package types (User, Agent for internal Comcast employees). Leads 4 dev teams (~10 devs each) with 11 direct Xfinity reports. Hosts biweekly team syncs to align the buy flow team. Acts as a point of contact for access requests and team follow-ups. Background: 6 years at Comcast, started on Xfinity Mobile, previously at Barclays Bank as a front-end dev.",
        interactions: [
            { text: "Access requests", date: "2023-01-10" },
            { text: "Buy Flow Management", date: "2023-01-15" },
            { text: "Team syncs", date: "2023-01-20" }
        ],
        dateMet: "2023-01-10",
        connection: {
            source: "you",
            type: "coordinated",
            strength: "strong",
            notes: "Manages flow and syncs; handles access and team communication.",
            introducedBy: 'niranjan',
            introducedByName: null,
            introducedByType: "existing"
        }
    },
    {
        id: "jenine-guy",
        name: "Jenine Guy",
        team: "Buy Flow",
        company: "Comcast",
        location: "Philly",
        workHours: "10:00 AM – 6:00 PM EST",
        role: "Lead Develoepr",
        notes: "",
        interactions: [
            { text: "Access requests", date: "2023-01-10" },
            { text: "Buy Flow Management", date: "2023-01-15" },
            { text: "Team syncs", date: "2023-01-20" }
        ],
        dateMet: "2023-01-10",
        connection: {
            source: "you",
            type: "coordinated",
            strength: "acquaintance",
            notes: "Manages flow and syncs; handles access and team communication.",
            introducedBy: 'jonathon-connolly',
            introducedByName: null,
            introducedByType: "existing"
        }
    },
    {
        id: "ted-huff",
        name: "Ted Huff",
        team: "",
        company: "Accenture",
        location: "Chicago",
        workHours: "CST",
        role: "Manager",
        notes: "People lead",
        interactions: [
            { text: "Once a week", date: "" }
        ],
        dateMet: "4/22",
        connection: {
            source: "you",
            type: "mentored",
            strength: "core",
            notes: "Dev designer unicorn",
            introducedBy: null,
            introducedByName: null,
            introducedByType: "direct"
        }
    },
    {
        id: "josh-on",
        name: "Josh On",
        team: "",
        company: "Accenture",
        location: "San Francisco",
        workHours: "PST",
        role: "Designer/ Developer",
        notes: "",
        interactions: [
            { text: "", date: "" }
        ],
        dateMet: "",
        connection: {
            source: "you",
            type: "inspired_me",
            strength: "core",
            notes: "",
            introducedBy: "",
            introducedByName: "",
            introducedByType: "direct"
        }
    },
    {
        id: "chris-vo",
        name: "Chris Vo",
        team: "Groot",
        company: "Comcast",
        location: "Philadelphia",
        workHours: "EST",
        role: "Software Developer II",
        notes: "Front-end developer. Previously on Team DaVinci for 2 weeks. From Vietnam (15 years ago). Bootcamp grad. Works in office 3-4 days/week. With Comcast for 4 years.",
        interactions: [
            { text: "Had a one on one call with him on 6/5/25 to go over intros", date: "2025-06-05" }
        ],
        dateMet: "",
        connection: {
            source: "you",
            type: "",
            strength: "",
            notes: "",
            introducedBy: null,
            introducedByName: null,
            introducedByType: "direct"
        }
    },
    {
        id: "denine-guy",
        name: "Denine Guy",
        team: "Davinci",
        company: "Comcast",
        location: "",
        workHours: "",
        role: "Front-end Developer",
        notes: "10 years at Comcast. Started as front-end dev, moved to product dev, then back to front-end. Joined Davani group 2 years ago. Previously worked on Connected Living for 2 years. Working on Next Gen Pricing feature to lock in pricing plans for 1-5 years and simplify buy flow. Team works collaboratively across different features that impact same parts of the app.",
        interactions: [
            { text: "", date: "" }
        ],
        dateMet: "",
        connection: {
            source: "you",
            type: "",
            strength: "",
            notes: "",
            introducedBy: 'jonathon-connolly',
            introducedByName: null,
            introducedByType: "existing"
        }
    },

];
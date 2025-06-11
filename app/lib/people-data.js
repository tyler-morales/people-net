import { getTimezoneFromLocation } from '../utils/timezone-utils';

export const initialPeople = [
    {
        id: "alex-smith",
        name: "Alex Smith",
        group: "College Friends",
        organization: "Local Community",
        location: "San Francisco, CA, USA",
        workHours: "PST",
        description: "Software Engineer and hiking enthusiast",
        notes: "Always up for outdoor adventures, great at organizing group trips",
        interactions: [
            { text: "Went hiking together in Yosemite", date: "2023-03-01" }
        ],
        dateMet: "2020-09-01",
        connection: {
            source: "you",
            type: "friend",
            strength: "strong",
            notes: "Met in college computer science program, stayed close ever since.",
            introducedBy: null,
            introducedByName: "",
            introducedByType: "direct"
        }
    },
    {
        id: "sarah-johnson",
        name: "Sarah Johnson",
        group: "Book Club",
        organization: "Reading Circle",
        location: "Portland, OR, USA",
        workHours: "PST",
        description: "Teacher and literature lover",
        notes: "Recommends amazing books, hosts monthly book discussions",
        interactions: [
            { text: "Monthly book club meetings", date: "2023-02-15" }
        ],
        dateMet: "2022-01-15",
        connection: {
            source: "you",
            type: "shared_interest",
            strength: "casual",
            notes: "Met at local library book club event.",
            introducedBy: "alex-smith",
            introducedByName: "",
            introducedByType: "existing"
        }
    },
    {
        id: "mike-chen",
        name: "Mike Chen",
        group: "Gaming Group",
        organization: "Weekly Board Games",
        location: "Seattle, WA, USA",
        workHours: "PST",
        description: "Game designer and board game enthusiast",
        notes: "Has huge collection of board games, organizes game nights",
        interactions: [
            { text: "Weekly board game sessions", date: "2023-01-10" }
        ],
        dateMet: "2021-06-20",
        connection: {
            source: "you",
            type: "activity_partner",
            strength: "working",
            notes: "Met at local game store, became regular gaming buddy.",
            introducedBy: null,
            introducedByName: "",
            introducedByType: "direct"
        }
    },
    {
        id: "emma-davis",
        name: "Emma Davis",
        group: "Family",
        organization: "Extended Family",
        location: "Austin, TX, USA",
        workHours: "CST",
        description: "Cousin, Marketing Professional",
        notes: "Always brings great energy to family gatherings",
        interactions: [
            { text: "Family reunion and holiday gatherings", date: "2023-07-04" }
        ],
        dateMet: "Born",
        connection: {
            source: "you",
            type: "family",
            strength: "core",
            notes: "Cousin from dad's side, grew up together.",
            introducedBy: null,
            introducedByName: "",
            introducedByType: "direct"
        }
    },
    {
        id: "david-wilson",
        name: "David Wilson",
        group: "Neighbors",
        organization: "Neighborhood",
        location: "Denver, CO, USA",
        workHours: "MST",
        description: "Retired Teacher, Community Volunteer",
        notes: "Great neighbor, always helpful with local community events",
        interactions: [
            { text: "Neighborhood BBQ and community events", date: "2023-05-15" }
        ],
        dateMet: "2019-03-01",
        connection: {
            source: "you",
            type: "neighbor",
            strength: "acquaintance",
            notes: "Lives two houses down, very friendly and community-minded.",
            introducedBy: null,
            introducedByName: "",
            introducedByType: "direct"
        }
    },
    {
        id: "lisa-martinez",
        name: "Lisa Martinez",
        group: "Fitness Buddies",
        organization: "Local Gym",
        location: "Phoenix, AZ, USA",
        workHours: "MST",
        description: "Personal Trainer and Fitness Coach",
        notes: "Motivational and knowledgeable about health and fitness",
        interactions: [
            { text: "Weekly workout sessions", date: "2023-04-01" },
            { text: "Fitness challenges and group classes", date: "2023-06-15" }
        ],
        dateMet: "2022-08-10",
        connection: {
            source: "you",
            type: "activity_partner",
            strength: "casual",
            notes: "Met at gym, became workout partners for morning sessions.",
            introducedBy: "mike-chen",
            introducedByName: "",
            introducedByType: "existing"
        }
    },
    {
        id: "james-taylor",
        name: "James Taylor",
        group: "Online Friends",
        organization: "Gaming Community",
        location: "Toronto, ON, Canada",
        workHours: "EST",
        description: "Software Developer and Gamer",
        notes: "Great at strategy games, streams on weekends",
        interactions: [
            { text: "Online gaming sessions", date: "2023-01-20" },
            { text: "Virtual hangouts and Discord chats", date: "2023-03-10" }
        ],
        dateMet: "2021-11-15",
        connection: {
            source: "you",
            type: "online_friend",
            strength: "casual",
            notes: "Met through online gaming community, regular Discord conversations.",
            introducedBy: null,
            introducedByName: "",
            introducedByType: "direct"
        }
    },
    {
        id: "rachel-brown",
        name: "Rachel Brown",
        group: "Volunteer Group",
        organization: "Local Animal Shelter",
        location: "Miami, FL, USA",
        workHours: "EST",
        description: "Veterinarian and Animal Advocate",
        notes: "Passionate about animal welfare, organizes adoption events",
        interactions: [
            { text: "Weekend volunteer work at animal shelter", date: "2023-02-25" }
        ],
        dateMet: "2022-04-12",
        connection: {
            source: "you",
            type: "shared_interest",
            strength: "working",
            notes: "Met while volunteering at animal shelter, share passion for helping animals.",
            introducedBy: "sarah-johnson",
            introducedByName: "",
            introducedByType: "existing"
        }
    }
];
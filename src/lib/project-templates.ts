import { Briefcase, Target, Calendar, BookOpen, Lightbulb, Rocket, Home, Plane, Heart, Code, ShoppingCart, DollarSign } from 'lucide-react'

export interface ProjectTemplate {
    id: string
    name: string
    description: string
    icon: any
    color: string
    sections: string[]
    starterTasks?: { title: string; sectionIndex: number }[]
}

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
    {
        id: 'blank',
        name: 'Blank Project',
        description: 'Start from scratch with an empty project',
        icon: Briefcase,
        color: 'neutral',
        sections: [],
    },
    {
        id: 'work-project',
        name: 'Work Project',
        description: 'Professional project with workflow stages',
        icon: Briefcase,
        color: 'blue',
        sections: ['📋 Planning', '🚧 In Progress', '👀 Review', '✅ Completed'],
        starterTasks: [
            { title: 'Define project goals', sectionIndex: 0 },
            { title: 'Create project timeline', sectionIndex: 0 },
        ],
    },
    {
        id: 'personal-goal',
        name: 'Personal Goal',
        description: 'Track progress toward a personal goal',
        icon: Target,
        color: 'purple',
        sections: ['🎯 Goal Setting', '📚 Research', '💪 Action Steps', '🎉 Milestones'],
        starterTasks: [
            { title: 'Define SMART goal', sectionIndex: 0 },
            { title: 'Break down into milestones', sectionIndex: 0 },
        ],
    },
    {
        id: 'event-planning',
        name: 'Event Planning',
        description: 'Organize events, parties, or gatherings',
        icon: Calendar,
        color: 'orange',
        sections: ['💰 Budget', '📝 Guest List', '📍 Venue & Logistics', '✅ Tasks', '🎊 Day Of'],
        starterTasks: [
            { title: 'Set event budget', sectionIndex: 0 },
            { title: 'Create guest list', sectionIndex: 1 },
            { title: 'Research venues', sectionIndex: 2 },
        ],
    },
    {
        id: 'content-creation',
        name: 'Content Creation',
        description: 'Manage blog posts, videos, or creative projects',
        icon: Lightbulb,
        color: 'purple',
        sections: ['💡 Ideas', '✍️ In Progress', '👀 Review', '🚀 Published'],
        starterTasks: [
            { title: 'Brainstorm content topics', sectionIndex: 0 },
        ],
    },
    {
        id: 'learning-study',
        name: 'Learning & Study',
        description: 'Track courses, skills, or study materials',
        icon: BookOpen,
        color: 'blue',
        sections: ['📚 Resources', '📖 To Learn', '🔄 In Progress', '✅ Completed'],
        starterTasks: [
            { title: 'Gather learning resources', sectionIndex: 0 },
            { title: 'Create study schedule', sectionIndex: 1 },
        ],
    },
    {
        id: 'product-launch',
        name: 'Product Launch',
        description: 'Launch a product, feature, or startup',
        icon: Rocket,
        color: 'red',
        sections: ['🎯 Planning', '⚙️ Development', '📢 Marketing', '🚀 Launch', '📊 Post-Launch'],
        starterTasks: [
            { title: 'Define product vision', sectionIndex: 0 },
            { title: 'Create launch checklist', sectionIndex: 0 },
        ],
    },
    {
        id: 'home-improvement',
        name: 'Home Improvement',
        description: 'Renovations, repairs, or home projects',
        icon: Home,
        color: 'green',
        sections: ['🎨 Planning & Design', '💰 Budget', '🛠️ Tasks', '✅ Completed'],
        starterTasks: [
            { title: 'Create budget estimate', sectionIndex: 1 },
            { title: 'Get contractor quotes', sectionIndex: 2 },
        ],
    },
    {
        id: 'travel-planning',
        name: 'Travel Planning',
        description: 'Plan trips, vacations, or adventures',
        icon: Plane,
        color: 'blue',
        sections: ['🗺️ Research', '✈️ Bookings', '📋 Packing', '🎒 During Trip', '📸 Memories'],
        starterTasks: [
            { title: 'Research destinations', sectionIndex: 0 },
            { title: 'Book flights', sectionIndex: 1 },
            { title: 'Book accommodation', sectionIndex: 1 },
        ],
    },
    {
        id: 'health-fitness',
        name: 'Health & Fitness',
        description: 'Track workouts, nutrition, or wellness goals',
        icon: Heart,
        color: 'red',
        sections: ['🎯 Goals', '🏋️ Workouts', '🥗 Nutrition', '📊 Progress'],
        starterTasks: [
            { title: 'Set fitness goals', sectionIndex: 0 },
            { title: 'Create workout plan', sectionIndex: 1 },
            { title: 'Plan weekly meals', sectionIndex: 2 },
        ],
    },
    {
        id: 'coding-project',
        name: 'Coding Project',
        description: 'Software development with agile workflow',
        icon: Code,
        color: 'purple',
        sections: ['📋 Backlog', '🚧 In Development', '🧪 Testing', '🚀 Deployed'],
        starterTasks: [
            { title: 'Set up repository', sectionIndex: 0 },
            { title: 'Define tech stack', sectionIndex: 0 },
        ],
    },
    {
        id: 'shopping-list',
        name: 'Shopping List',
        description: 'Track purchases and shopping needs',
        icon: ShoppingCart,
        color: 'green',
        sections: ['🛒 To Buy', '💳 Purchased', '📦 Delivered'],
        starterTasks: [],
    },
    {
        id: 'financial-planning',
        name: 'Financial Planning',
        description: 'Budget, savings, or financial goals',
        icon: DollarSign,
        color: 'green',
        sections: ['💰 Budget', '📈 Income', '💸 Expenses', '🎯 Savings Goals', '📊 Review'],
        starterTasks: [
            { title: 'Create monthly budget', sectionIndex: 0 },
            { title: 'Track income sources', sectionIndex: 1 },
            { title: 'Set savings target', sectionIndex: 3 },
        ],
    },
]

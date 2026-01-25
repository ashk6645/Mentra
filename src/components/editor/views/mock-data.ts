import { Block } from '../types'

export interface DatabaseItem {
    id: string
    title: string
    status: 'Not started' | 'In progress' | 'Done'
    priority?: 'High' | 'Medium' | 'Low'
    date?: string
    progress?: number
    cover?: string
    tags?: string[]
    blocks?: Block[]
    icon?: string
}

export const SHARED_DATABASE_ITEMS: DatabaseItem[] = [
    {
        id: '1',
        title: 'Learning Goals',
        status: 'In progress',
        priority: 'Medium',
        date: 'August 17, 2024 21:39',
        progress: 0,
        tags: ['Planning'],
        cover: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
        icon: '📝'
    },
    {
        id: '2',
        title: 'Next Skills',
        status: 'In progress',
        priority: 'High',
        date: 'August 28, 2024 21:17',
        progress: 50,
        tags: ['Strategy', 'Launch'],
        cover: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
        icon: '⏩'
    },
    {
        id: '3',
        title: 'Problem Solving Techniques',
        status: 'In progress',
        priority: 'Low',
        date: 'August 3, 2024 17:58',
        progress: 100,
        tags: ['HR'],
        cover: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
        icon: '🧩'
    },
    {
        id: '4',
        title: 'Jobs Applied - 2024',
        status: 'Done',
        priority: 'High',
        date: 'July 2, 2024 16:37',
        progress: 25,
        tags: ['Finance'],
        cover: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop&q=60',
        icon: '💼'
    },
    {
        id: '5',
        title: 'Jobs Applied - 2025',
        status: 'In progress',
        priority: 'High',
        date: 'January 21, 2025 19:06',
        progress: 25,
        tags: ['Career'],
        cover: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=800&auto=format&fit=crop&q=60',
        icon: '💼'
    },
    {
        id: '6',
        title: 'Jobs Applied - 2026',
        status: 'In progress',
        priority: 'High',
        date: 'January 5, 2026 18:33',
        progress: 25,
        tags: ['Future'],
        cover: 'https://images.unsplash.com/photo-1483058712412-4245e9b90334?w=800&auto=format&fit=crop&q=60',
        icon: '💼'
    }
]

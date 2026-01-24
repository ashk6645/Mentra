export interface DatabaseItem {
    id: string
    title: string
    status: 'Not started' | 'In progress' | 'Done'
    priority?: 'High' | 'Medium' | 'Low'
    date?: string
    progress?: number
    cover?: string
    tags?: string[]
}

export const SHARED_DATABASE_ITEMS: DatabaseItem[] = [
    {
        id: '1',
        title: 'Quarterly sales planning',
        status: 'Not started',
        priority: 'Medium',
        date: 'Oct 24, 2024',
        progress: 0,
        tags: ['Planning'],
        cover: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'
    },
    {
        id: '2',
        title: 'Public launch of iOS app',
        status: 'In progress',
        priority: 'High',
        date: 'Nov 12, 2024',
        progress: 50,
        tags: ['Strategy', 'Launch'],
        cover: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'
    },
    {
        id: '3',
        title: 'Revamp new hire onboarding',
        status: 'Done',
        priority: 'Low',
        date: 'Dec 1, 2024',
        progress: 100,
        tags: ['HR'],
        cover: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'
    },
    {
        id: '4',
        title: 'Q4 Financial Goals',
        status: 'In progress',
        priority: 'High',
        date: 'Dec 15, 2024',
        progress: 25,
        tags: ['Finance'],
    }
]

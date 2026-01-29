// Block type definitions for the Private Pages system
// These types mirror the Prisma BlockType enum

export type BlockType =
    // Database blocks
    | 'DATABASE_TABLE'
    | 'DATABASE_BOARD'
    | 'DATABASE_GALLERY'
    | 'DATABASE_LIST'
    | 'DATABASE_CALENDAR'
    | 'DATABASE_CHART'
    // Content blocks
    | 'TEXT'
    | 'HEADING_1'
    | 'HEADING_2'
    | 'HEADING_3'
    | 'TOGGLE_HEADING_1'
    | 'TOGGLE_HEADING_2'
    | 'TOGGLE_HEADING_3'
    | 'BULLETED_LIST'
    | 'NUMBERED_LIST'
    | 'TODO_LIST'
    | 'TOGGLE_LIST'
    | 'CALLOUT'
    | 'QUOTE'
    | 'CODE'
    | 'DIVIDER'
    // Media blocks
    | 'IMAGE'
    | 'VIDEO'
    | 'FILE'

export type SourceType = 'TASKS' | 'PROJECTS' | 'HABITS'

export type ViewType = 'TABLE' | 'BOARD' | 'GALLERY' | 'LIST' | 'CALENDAR' | 'CHART'

// ========================================
// BLOCK CONTENT SCHEMAS
// ========================================

export interface TextBlockContent {
    text: string
}

export interface HeadingBlockContent {
    text: string
}

export interface ToggleBlockContent {
    text: string
    isOpen: boolean
}

export interface ListBlockContent {
    text: string
}

export interface TodoBlockContent {
    text: string
    isChecked: boolean
}

export interface CalloutBlockContent {
    text: string
    icon: string
    backgroundColor?: string
}

export interface QuoteBlockContent {
    text: string
}

export interface CodeBlockContent {
    code: string
    language: string
}

export interface ImageBlockContent {
    url: string
    caption?: string
    width?: string
}

export interface VideoBlockContent {
    url: string
    caption?: string
}

export interface FileBlockContent {
    url: string
    filename: string
    size: number
    mimeType?: string
}

export interface DatabaseBlockContent {
    viewId: string
}

// ========================================
// BLOCK DATA
// ========================================

export interface Block {
    id: string
    pageId: string
    parentBlockId: string | null
    type: BlockType
    content: Record<string, unknown>
    sortOrder: number
    createdAt: Date
    updatedAt: Date
    childBlocks?: Block[]
    databaseView?: DatabaseView | null
}

export interface DatabaseView {
    id: string
    blockId: string
    name: string  // View name for switching
    sourceType: SourceType
    viewType: ViewType
    filters: unknown
    sorts: unknown
    visibleFields: unknown
    groupBy: string | null
    isDefault: boolean  // Which view shows first
    sortOrder: number  // Order in view switcher
}

// ========================================
// BLOCK MENU CONFIG
// ========================================

export interface BlockMenuItem {
    type: BlockType
    label: string
    icon: string
    description: string
    category: 'database' | 'basic' | 'media'
}

export const BLOCK_MENU_ITEMS: BlockMenuItem[] = [
    // Database blocks
    { type: 'DATABASE_TABLE', label: 'Table', icon: '📊', description: 'Add a table view', category: 'database' },
    { type: 'DATABASE_BOARD', label: 'Board', icon: '📋', description: 'Add a kanban board', category: 'database' },
    { type: 'DATABASE_GALLERY', label: 'Gallery', icon: '🖼️', description: 'Add a gallery view', category: 'database' },
    { type: 'DATABASE_LIST', label: 'List', icon: '📝', description: 'Add a list view', category: 'database' },
    { type: 'DATABASE_CALENDAR', label: 'Calendar', icon: '📅', description: 'Add a calendar view', category: 'database' },
    { type: 'DATABASE_CHART', label: 'Chart', icon: '📈', description: 'Add a chart', category: 'database' },

    // Basic blocks
    { type: 'TEXT', label: 'Text', icon: '¶', description: 'Plain text', category: 'basic' },
    { type: 'HEADING_1', label: 'Heading 1', icon: 'H1', description: 'Large heading', category: 'basic' },
    { type: 'HEADING_2', label: 'Heading 2', icon: 'H2', description: 'Medium heading', category: 'basic' },
    { type: 'HEADING_3', label: 'Heading 3', icon: 'H3', description: 'Small heading', category: 'basic' },
    { type: 'BULLETED_LIST', label: 'Bulleted List', icon: '•', description: 'Simple bulleted list', category: 'basic' },
    { type: 'NUMBERED_LIST', label: 'Numbered List', icon: '1.', description: 'Numbered list', category: 'basic' },
    { type: 'TODO_LIST', label: 'To-do', icon: '☐', description: 'To-do checkbox', category: 'basic' },
    { type: 'TOGGLE_LIST', label: 'Toggle', icon: '▶', description: 'Collapsible content', category: 'basic' },
    { type: 'CALLOUT', label: 'Callout', icon: '💡', description: 'Highlighted callout box', category: 'basic' },
    { type: 'QUOTE', label: 'Quote', icon: '"', description: 'Block quote', category: 'basic' },
    { type: 'CODE', label: 'Code', icon: '<>', description: 'Code block', category: 'basic' },
    { type: 'DIVIDER', label: 'Divider', icon: '—', description: 'Horizontal divider', category: 'basic' },

    // Media blocks
    { type: 'IMAGE', label: 'Image', icon: '🖼️', description: 'Upload or embed image', category: 'media' },
    { type: 'VIDEO', label: 'Video', icon: '🎬', description: 'Embed a video', category: 'media' },
    { type: 'FILE', label: 'File', icon: '📎', description: 'Upload a file', category: 'media' },
]

// ========================================
// DEFAULT CONTENT FOR NEW BLOCKS
// ========================================

export function getDefaultBlockContent(type: BlockType): Record<string, unknown> {
    switch (type) {
        case 'TEXT':
        case 'HEADING_1':
        case 'HEADING_2':
        case 'HEADING_3':
        case 'BULLETED_LIST':
        case 'NUMBERED_LIST':
        case 'QUOTE':
            return { text: '' }

        case 'TODO_LIST':
            return { text: '', isChecked: false }

        case 'TOGGLE_LIST':
        case 'TOGGLE_HEADING_1':
        case 'TOGGLE_HEADING_2':
        case 'TOGGLE_HEADING_3':
            return { text: '', isOpen: true }

        case 'CALLOUT':
            return { text: '', icon: '💡', backgroundColor: '#FEF3C7' }

        case 'CODE':
            return { code: '', language: 'javascript' }

        case 'IMAGE':
            return { url: '', caption: '' }

        case 'VIDEO':
            return { url: '', caption: '' }

        case 'FILE':
            return { url: '', filename: '', size: 0 }

        case 'DIVIDER':
            return {}

        case 'DATABASE_TABLE':
        case 'DATABASE_BOARD':
        case 'DATABASE_GALLERY':
        case 'DATABASE_LIST':
        case 'DATABASE_CALENDAR':
        case 'DATABASE_CHART':
            return { viewId: '' }

        default:
            return {}
    }
}

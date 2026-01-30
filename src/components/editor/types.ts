export type BlockType =
    | 'TEXT'
    | 'HEADING_1'
    | 'HEADING_2'
    | 'HEADING_3'
    | 'BULLETED_LIST'
    | 'NUMBERED_LIST'
    | 'TODO_LIST'
    | 'QUOTE'
    | 'CODE'
    | 'DIVIDER'
    | 'CALLOUT'
    | 'IMAGE'
    | 'DATABASE_TABLE'
    | 'DATABASE_BOARD'
    | 'DATABASE_GALLERY'
    | 'DATABASE_CALENDAR'
    | 'TOGGLE_LIST'


export type BlockContent = Record<string, any>

export interface Block {
    id: string
    pageId: string
    type: BlockType
    content: BlockContent
    parentId?: string | null
    sortOrder: number
    children?: Block[] // For frontend recursion
    createdAt: Date
    updatedAt: Date
}

export interface EditorState {
    blocks: Block[]
    isLoading: boolean
    activeBlockId: string | null
}

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

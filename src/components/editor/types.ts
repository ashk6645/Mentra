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
    | 'IMAGE'
    | 'DATABASE_TABLE'
    | 'DATABASE_BOARD'


export type BlockContent = Record<string, any>

export interface Block {
    id: string
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

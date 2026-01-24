import { BlockType } from './types'

export const getBlockTypeLabel = (type: BlockType): string => {
    switch (type) {
        case 'TEXT': return 'Text'
        case 'HEADING_1': return 'Heading 1'
        case 'HEADING_2': return 'Heading 2'
        case 'HEADING_3': return 'Heading 3'
        case 'BULLETED_LIST': return 'Bulleted List'
        case 'NUMBERED_LIST': return 'Numbered List'
        case 'TODO_LIST': return 'To-do List'
        case 'QUOTE': return 'Quote'
        case 'CODE': return 'Code'
        case 'DIVIDER': return 'Divider'
        case 'IMAGE': return 'Image'
        case 'DATABASE_TABLE': return 'Table View'
        case 'DATABASE_BOARD': return 'Board View'
        default: return 'Unknown'
    }
}

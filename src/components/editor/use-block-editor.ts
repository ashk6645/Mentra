import { useState, useCallback, useRef } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { Block, BlockType, BlockContent } from './types'

interface UseBlockEditorProps {
    initialBlocks?: Block[]
    onChange?: (blocks: Block[]) => void
}

export function useBlockEditor({ initialBlocks = [], onChange }: UseBlockEditorProps) {
    const [blocks, setBlocks] = useState<Block[]>(initialBlocks)
    // We keep a ref to access current blocks in event handlers without dependency cycles
    const blocksRef = useRef<Block[]>(initialBlocks)

    // Update both state and ref
    const updateBlocks = useCallback((newBlocks: Block[]) => {
        setBlocks(newBlocks)
        blocksRef.current = newBlocks
        onChange?.(newBlocks)
    }, [onChange])

    const addBlock = useCallback((
        type: BlockType = 'TEXT',
        content: BlockContent = {},
        afterBlockId?: string
    ) => {
        const currentBlocks = blocksRef.current

        // Calculate proper sortOrder
        let sortOrder = 0
        
        if (afterBlockId) {
            const index = currentBlocks.findIndex(b => b.id === afterBlockId)
            if (index !== -1) {
                // Insert between current block and next block
                const currentSortOrder = currentBlocks[index].sortOrder || index
                const nextBlock = currentBlocks[index + 1]
                const nextSortOrder = nextBlock ? (nextBlock.sortOrder || index + 1) : currentSortOrder + 1
                
                // Place new block between current and next
                sortOrder = (currentSortOrder + nextSortOrder) / 2
                
                const newBlock: Block = {
                    id: uuidv4(),
                    type,
                    content,
                    sortOrder,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                }
                
                const newBlocks = [
                    ...currentBlocks.slice(0, index + 1),
                    newBlock,
                    ...currentBlocks.slice(index + 1)
                ]
                updateBlocks(newBlocks)
                return newBlock.id
            }
        }

        // Default: append to end with proper sortOrder
        const lastBlock = currentBlocks[currentBlocks.length - 1]
        sortOrder = lastBlock ? (lastBlock.sortOrder || currentBlocks.length - 1) + 1 : 0
        
        const newBlock: Block = {
            id: uuidv4(),
            type,
            content,
            sortOrder,
            createdAt: new Date(),
            updatedAt: new Date(),
        }

        updateBlocks([...currentBlocks, newBlock])
        return newBlock.id
    }, [updateBlocks])

    const updateBlock = useCallback((id: string, updates: Partial<Block>) => {
        const currentBlocks = blocksRef.current
        const newBlocks = currentBlocks.map(block =>
            block.id === id ? { ...block, ...updates, updatedAt: new Date() } : block
        )
        updateBlocks(newBlocks)
    }, [updateBlocks])

    const removeBlock = useCallback((id: string) => {
        const currentBlocks = blocksRef.current
        // Prevent removing the last block if it's the only one? 
        // Usually Notion keeps at least one block, but we handle that at the UI level or here.
        if (currentBlocks.length <= 1 && currentBlocks[0].id === id) {
            // If it's the last block, maybe just clear its content instead of removing?
            // For now, let's allow removing, but Consumer should handle empty state.
        }
        const newBlocks = currentBlocks.filter(b => b.id !== id)
        updateBlocks(newBlocks)
    }, [updateBlocks])

    // Focus management helpers could go here, or be handled by the BlockEditor component.
    // For now, we'll expose the state modifiers.

    return {
        blocks,
        addBlock,
        updateBlock,
        removeBlock,
        setBlocks: updateBlocks
    }
}

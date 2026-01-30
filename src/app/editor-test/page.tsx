'use client'

import { BlockEditor } from '@/components/editor/block-editor'
import { v4 as uuidv4 } from 'uuid'

export default function EditorTestPage() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 p-8">
            <div className="max-w-4xl mx-auto space-y-8">
                <div>
                    <h1 className="text-2xl font-bold mb-2">Editor Test</h1>
                    <p className="text-gray-500">Test the improved block editor with keyboard navigation.</p>
                </div>

                <BlockEditor
                    initialBlocks={[
                        {
                            id: uuidv4(),
                            pageId: 'test-page',
                            type: 'TEXT',
                            content: { text: 'Welcome to the new block editor! Try typing here.' },
                            sortOrder: 0,
                            createdAt: new Date(),
                            updatedAt: new Date(),
                        },
                        {
                            id: uuidv4(),
                            pageId: 'test-page',
                            type: 'TEXT',
                            content: { text: 'Press Enter to create a new block, or Backspace to delete an empty one.' },
                            sortOrder: 1,
                            createdAt: new Date(),
                            updatedAt: new Date(),
                        }
                    ]}
                />
            </div>
        </div>
    )
}

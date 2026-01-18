'use server'

import { geminiModel } from '@/lib/gemini'
import { createClient } from '@/lib/supabase/server'
import { Priority } from '@prisma/client'
import prisma from '@/lib/prisma'

export interface ParsedTask {
    title: string
    description?: string
    priority?: Priority
    dueDate?: string // ISO string
    projectId?: string // We might try to match this by name later, but for now let's just extract intent
}

async function logAIActivity(userId: string, prompt: string, response: string, action: string) {
    try {
        await prisma.aIActivityLog.create({
            data: {
                userId,
                prompt,
                response,
                actionTaken: action,
            }
        })
    } catch (error) {
        console.error('Failed to log AI activity:', error)
        // Don't throw, we don't want to break the user flow if logging fails
    }
}

export async function parseTaskInput(input: string): Promise<ParsedTask | null> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Unauthorized')
    }

    const prompt = `
    You are a task management assistant. Extract task details from the following user input: "${input}"
    
    Return a JSON object with the following keys:
    - title: The main task (required)
    - description: Any additional details (optional)
    - priority: One of "HIGH", "MEDIUM", "LOW", "NONE" (optional, infer from context like 'urgent', 'important')
    - dueDate: ISO 8601 date string (optional, infer from context like 'tomorrow', 'next friday', 'at 5pm'. Use ${new Date().toISOString()} as "now")
    
    If the input is not a task, return null. 
    DO NOT output any markdown code blocks. Just the raw JSON string.
  `

    try {
        const result = await geminiModel.generateContent(prompt)
        const response = await result.response
        const text = response.text()

        // Clean up potential markdown code blocks
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim()

        // Log the activity
        // We do this non-blockingly or just await it. Awaiting is safer for serverless environments.
        await logAIActivity(user.id, prompt, cleanText, 'PARSE_TASK_INPUT')

        const parsed = JSON.parse(cleanText)
        return parsed
    } catch (error) {
        console.error('AI Parsing Error:', error)
        return null
    }
}

export async function generateSubtasks(taskTitle: string, taskDescription?: string): Promise<{ title: string }[]> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    const prompt = `
    You are a helpful project manager. Break down the following task into 3-5 smaller, actionable subtasks:
    
    Task: "${taskTitle}"
    ${taskDescription ? `Description: "${taskDescription}"` : ''}

    Return a JSON array of objects, where each object has a "title" key.
    Example: [{"title": "Step 1"}, {"title": "Step 2"}]
    
    DO NOT output any markdown code blocks. Just the raw JSON array.
    `

    try {
        const result = await geminiModel.generateContent(prompt)
        const response = await result.response
        const text = response.text()
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim()

        await logAIActivity(user.id, prompt, cleanText, 'GENERATE_SUBTASKS')

        const subtasks = JSON.parse(cleanText)
        if (Array.isArray(subtasks)) {
            return subtasks
        }
        return []
    } catch (error) {
        console.error("AI Break down failed", error)
        return []
    }
}

export async function getTaskSuggestions(
    title: string,
    description: string | undefined,
    availableProjects: { id: string, name: string }[],
    availableTags: { id: string, name: string }[]
): Promise<{ priority?: Priority; projectId?: string; tagIds?: string[] }> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return {}

    if (!title) return {}

    const prompt = `
    You are a smart task assistant. Analyze the task and suggest the most appropriate metadata.

    Task: "${title}"
    ${description ? `Description: "${description}"` : ''}

    Available Projects:
    ${JSON.stringify(availableProjects.map(p => ({ id: p.id, name: p.name })))}

    Available Tags:
    ${JSON.stringify(availableTags.map(t => ({ id: t.id, name: t.name })))}

    Return a JSON object with the following optional keys:
    - priority: One of "HIGH", "MEDIUM", "LOW", "NONE"
    - projectId: The ID of the best matching project (if any)
    - tagIds: An array of IDs for the best matching tags (if any)

    If no suitable match is found for a field, omit it.
    DO NOT output any markdown code blocks. Just the raw JSON string.
    `

    try {
        const result = await geminiModel.generateContent(prompt)
        const response = await result.response
        const text = response.text()
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim()

        await logAIActivity(user.id, prompt, cleanText, 'GET_TASK_SUGGESTIONS')

        return JSON.parse(cleanText)
    } catch (error) {
        console.error("AI Suggestions failed", error)
        return {}
    }
}

# API Documentation

## Overview

All API operations are handled through Next.js Server Actions, providing type-safe, server-side data operations with automatic serialization.

## Authentication

All server actions automatically check authentication using Supabase:

```typescript
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
if (!user) throw new Error('Unauthorized')
```

## Response Format

All server actions return a consistent response format:

```typescript
// Success
{
  success: true,
  data: T
}

// Error
{
  success: false,
  error: string
}
```

---

## Tasks API

### Get All Tasks

```typescript
import { getTasks } from '@/lib/actions/tasks'

const tasks = await getTasks()
// Returns: Task[] with subtasks and tags
```

**Returns:** Array of tasks with nested subtasks and tags

### Create Task

```typescript
import { createTask } from '@/lib/actions/tasks'

const result = await createTask({
  title: 'Complete project',
  description: 'Optional description',
  priority: 'HIGH', // 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH'
  dueDate: '2024-12-31', // ISO date string
  projectId: 'project-uuid',
  sectionId: 'section-uuid',
  parentId: 'parent-task-uuid', // for subtasks
  isRecurring: true,
  recurrenceRule: 'FREQ=DAILY;INTERVAL=1' // RRule string
})
```

**Parameters:**
- `title` (required): Task title
- `description` (optional): Task description
- `priority` (optional): Priority level
- `dueDate` (optional): Due date ISO string
- `projectId` (optional): Parent project ID
- `sectionId` (optional): Section ID
- `parentId` (optional): Parent task ID for subtasks
- `isRecurring` (optional): Whether task recurs
- `recurrenceRule` (optional): RRule format string

### Update Task

```typescript
import { updateTask } from '@/lib/actions/tasks'

const result = await updateTask({
  id: 'task-uuid',
  title: 'Updated title',
  isCompleted: true,
  // ... any other fields to update
})
```

**Parameters:** Same as create + `id` (required)

### Delete Task

```typescript
import { deleteTask } from '@/lib/actions/tasks'

const result = await deleteTask('task-uuid')
```

### Complete Task

```typescript
import { completeTask } from '@/lib/actions/tasks'

const result = await completeTask('task-uuid', true) // or false to uncomplete
```



---

## Projects API

### Get All Projects

```typescript
import { getProjects } from '@/lib/actions/projects'

const projects = await getProjects()
```

### Create Project

```typescript
import { createProject } from '@/lib/actions/projects'

const result = await createProject({
  name: 'Work Projects',
  description: 'All work-related tasks',
  color: 'blue',
  icon: '💼',
  areaId: 'area-uuid' // optional
})
```

### Update Project

```typescript
import { updateProject } from '@/lib/actions/projects'

const result = await updateProject({
  id: 'project-uuid',
  name: 'Updated name',
  isArchived: false
})
```

### Delete Project

```typescript
import { deleteProject } from '@/lib/actions/projects'

const result = await deleteProject('project-uuid')
```

---

## Tags API

### Get All Tags

```typescript
import { getTags } from '@/lib/actions/tags'

const tags = await getTags()
```

### Create Tag

```typescript
import { createTag } from '@/lib/actions/tags'

const result = await createTag({
  name: 'urgent',
  color: 'red'
})
```

### Add Tag to Task

```typescript
import { addTagToTask } from '@/lib/actions/tags'

const result = await addTagToTask('task-uuid', 'tag-uuid')
```

### Remove Tag from Task

```typescript
import { removeTagFromTask } from '@/lib/actions/tags'

const result = await removeTagFromTask('task-uuid', 'tag-uuid')
```

---

## Habits API

### Get All Habits

```typescript
import { getHabits } from '@/lib/actions/habits'

const habits = await getHabits()
```

### Create Habit

```typescript
import { createHabit } from '@/lib/actions/habits'

const result = await createHabit({
  name: 'Morning meditation',
  frequency: 'DAILY' // 'DAILY' | 'WEEKLY' | 'MONTHLY'
})
```

### Complete Habit

```typescript
import { completeHabit } from '@/lib/actions/habits'

const result = await completeHabit('habit-uuid')
```



---

## AI API

### Parse Natural Language Task

```typescript
import { parseTaskInput } from '@/lib/actions/ai'

const parsed = await parseTaskInput('Finish report tomorrow at 5pm high priority')
// Returns:
// {
//   title: 'Finish report',
//   dueDate: '2024-01-19T17:00:00.000Z',
//   priority: 'HIGH'
// }
```

### Generate Subtasks

```typescript
import { generateSubtasks } from '@/lib/actions/ai'

const subtasks = await generateSubtasks(
  'Prepare for final exams',
  'Study all subjects'
)
// Returns:
// [
//   { title: 'Review lecture notes' },
//   { title: 'Complete practice problems' },
//   { title: 'Create summary flashcards' }
// ]
```

### Get Task Suggestions

```typescript
import { getTaskSuggestions } from '@/lib/actions/ai'

const suggestions = await getTaskSuggestions(
  'Write blog post',
  'About Next.js',
  [{ id: '1', name: 'Content Creation' }], // projects
  [{ id: '1', name: 'writing' }] // tags
)
// Returns:
// {
//   priority: 'MEDIUM',
//   projectId: '1',
//   tagIds: ['1']
// }
```

---

## Focus Sessions API

### Create Focus Session

```typescript
import { createFocusSession } from '@/lib/actions/focus'

const result = await createFocusSession({
  taskId: 'task-uuid', // optional
  durationMinutes: 25,
  interruptions: 0
})
```



---

## Error Handling

All server actions include error handling:

```typescript
try {
  const result = await someAction()
  
  if (!result.success) {
    // Handle error
    console.error(result.error)
    toast.error(result.error)
  } else {
    // Success
    const data = result.data
  }
} catch (error) {
  console.error('Unexpected error:', error)
}
```

---

## Rate Limiting

Currently no rate limiting implemented. In production, consider:

- Redis-based rate limiting
- Per-user quotas for AI requests
- Free tier limits enforcement

---

## Caching Strategy

### Server-side Caching
- Next.js automatic caching for Server Components
- Use `revalidatePath()` to invalidate cache after mutations

### Client-side Caching
- TanStack Query handles automatic caching
- Stale time: 60 seconds
- Cache time: 5 minutes

Example:
```typescript
import { useQuery } from '@tanstack/react-query'

const { data, isLoading, error } = useQuery({
  queryKey: ['tasks'],
  queryFn: getTasks,
  staleTime: 60 * 1000, // 1 minute
})
```

---

## Real-time Updates (Future)

Supabase Realtime can be added for live updates:

```typescript
const channel = supabase
  .channel('tasks')
  .on('postgres_changes', 
    { 
      event: '*', 
      schema: 'public', 
      table: 'tasks' 
    },
    (payload) => {
      console.log('Change received!', payload)
      // Invalidate cache and refetch
    }
  )
  .subscribe()
```

---

## Testing

### Testing Server Actions

```typescript
// Mock Supabase auth
jest.mock('@/lib/supabase/server', () => ({
  createClient: () => ({
    auth: {
      getUser: () => ({ data: { user: { id: 'test-user-id' } } })
    }
  })
}))

// Test
it('creates a task', async () => {
  const result = await createTask({
    title: 'Test task'
  })
  
  expect(result.success).toBe(true)
  expect(result.data.title).toBe('Test task')
})
```

---

## Migration Guide

If you need to change API structure:

1. Create new function with new signature
2. Keep old function for backward compatibility
3. Mark old function as deprecated
4. Update all usage
5. Remove old function in next major version

```typescript
/**
 * @deprecated Use createTaskV2 instead
 */
export async function createTask(data: OldInput) {
  // Old implementation
}

export async function createTaskV2(data: NewInput) {
  // New implementation
}
```

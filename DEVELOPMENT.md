# Development Guide

## Project Setup

### Prerequisites
- Node.js 18+ 
- npm/yarn/pnpm
- Supabase account
- Gemini API key

### Initial Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Configure environment variables:**
```bash
cp .env.example .env
```

Fill in your Supabase and Gemini API credentials.

3. **Generate Prisma client:**
```bash
npx prisma generate
```

4. **Push database schema:**
```bash
npx prisma db push
```

5. **Apply RLS policies:**
- Open Supabase SQL Editor
- Run the SQL from `supabase/migrations/0000_initial_rls_policies.sql`

6. **Start development server:**
```bash
npm run dev
```

## Project Architecture

### Tech Stack Rationale

#### **Next.js 15 (App Router)**
- Server Components for optimal performance
- Built-in API routes
- Image optimization
- Automatic code splitting

#### **Supabase**
- PostgreSQL database
- Built-in authentication
- Real-time subscriptions
- Row Level Security (RLS)
- File storage

#### **Prisma**
- Type-safe database queries
- Schema migrations
- Auto-generated TypeScript types

#### **Gemini AI**
- Natural language task parsing
- Intelligent task breakdown
- Predictive suggestions

#### **TanStack Query**
- Server state management
- Automatic caching
- Optimistic updates
- Background refetching

#### **Zustand**
- Lightweight state management
- No boilerplate
- TypeScript support

### Directory Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication pages
│   │   ├── login/
│   │   └── signup/
│   ├── (app)/             # Protected application pages
│   │   ├── inbox/
│   │   ├── today/
│   │   ├── upcoming/
│   │   ├── projects/
│   │   ├── tasks/
│   │   ├── habits/
│   │   ├── focus/
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Landing page
│
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── tasks/            # Task management
│   ├── projects/         # Project management
│   ├── habits/           # Habit tracking
│   ├── focus/            # Focus mode & Pomodoro
│   ├── focus/            # Focus mode & Pomodoro
│   ├── tags/             # Tag management
│   ├── layout/           # Layout components
│   ├── cmd-k/            # Command palette
│   └── shared/           # Shared components
│
├── lib/                   # Core utilities
│   ├── actions/          # Server actions
│   │   ├── tasks.ts
│   │   ├── projects.ts
│   │   ├── habits.ts
│   │   ├── ai.ts
│   │   └── ai.ts
│   ├── supabase/         # Supabase clients
│   │   ├── client.ts     # Browser client
│   │   └── server.ts     # Server client
│   ├── utils/            # Utility functions
│   │   ├── date.ts
│   │   └── notifications.ts
│   ├── hooks/            # Custom React hooks
│   ├── gemini.ts         # Gemini AI config
│   ├── prisma.ts         # Prisma clients
│   ├── constants.ts      # App constants
│   └── utils.ts          # General utilities
│
├── stores/               # Zustand stores
│   ├── use-auth-store.ts
│   └── use-ui-store.ts
│
└── types/                # TypeScript types
    └── index.ts          # All type definitions
```

## Development Workflow

### 1. Creating New Features

#### Server Actions Pattern
```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  title: z.string().min(1),
  // ... more fields
})

export async function createResource(data: unknown) {
  // 1. Authenticate
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // 2. Validate
  const result = schema.safeParse(data)
  if (!result.success) return { success: false, error: result.error }

  // 3. Create resource
  try {
    const resource = await prisma.resource.create({
      data: {
        userId: user.id,
        ...result.data,
      },
    })
    return { success: true, data: resource }
  } catch (error) {
    console.error('Error:', error)
    return { success: false, error: 'Failed to create resource' }
  }
}
```

#### Component Pattern
```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { createResource } from '@/lib/actions/resource'

export function ResourceForm() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(data: FormData) {
    setLoading(true)
    const result = await createResource(Object.fromEntries(data))
    
    if (result.success) {
      router.refresh() // Revalidate server components
    }
    
    setLoading(false)
  }

  return (
    <form action={handleSubmit}>
      {/* Form fields */}
      <Button type="submit" disabled={loading}>
        Submit
      </Button>
    </form>
  )
}
```

### 2. Database Changes

#### Modifying Schema
```bash
# 1. Update prisma/schema.prisma
# 2. Push changes
npx prisma db push

# 3. Generate client
npx prisma generate

# 4. Update RLS policies in Supabase SQL Editor
```

#### Adding RLS Policies
```sql
-- Always enable RLS
ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own data"
  ON new_table FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own data"
  ON new_table FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);
```

### 3. AI Integration

#### Adding New AI Features
```typescript
import { geminiModel } from '@/lib/gemini'
import { logAIActivity } from '@/lib/actions/ai'

export async function aiFeature(input: string, userId: string) {
  const prompt = `Your detailed prompt here: ${input}`

  try {
    const result = await geminiModel.generateContent(prompt)
    const response = result.response.text()
    
    // Clean and parse
    const cleaned = response.replace(/```json/g, '').replace(/```/g, '')
    const parsed = JSON.parse(cleaned)

    // Log activity
    await logAIActivity(userId, prompt, response, 'FEATURE_NAME')

    return parsed
  } catch (error) {
    console.error('AI Error:', error)
    return null
  }
}
```

## Testing

### Manual Testing Checklist

#### Authentication
- [ ] Sign up new user
- [ ] Login existing user
- [ ] Logout
- [ ] Profile auto-created

#### Tasks
- [ ] Create task
- [ ] Edit task
- [ ] Delete task
- [ ] Complete task
- [ ] Create subtask
- [ ] AI task parsing
- [ ] Recurring tasks

#### Projects
- [ ] Create project
- [ ] Edit project
- [ ] Delete project
- [ ] Add sections
- [ ] Drag and drop tasks

#### AI Features
- [ ] Natural language parsing
- [ ] Task breakdown
- [ ] Smart suggestions



## Performance Optimization

### Best Practices

1. **Use Server Components by default**
   - Only add 'use client' when needed
   - Server Components are faster

2. **Implement proper loading states**
   ```typescript
   import { Suspense } from 'react'
   import { TaskListSkeleton } from '@/components/shared/loading-states'

   export default function Page() {
     return (
       <Suspense fallback={<TaskListSkeleton />}>
         <TaskList />
       </Suspense>
     )
   }
   ```

3. **Optimize images**
   ```typescript
   import Image from 'next/image'

   <Image
     src="/path.jpg"
     width={500}
     height={300}
     alt="Description"
     priority // for above-the-fold images
   />
   ```

4. **Code splitting**
   ```typescript
   import dynamic from 'next/dynamic'

   const HeavyComponent = dynamic(() => import('@/components/heavy'), {
     loading: () => <Loading />,
     ssr: false // if not needed on server
   })
   ```

## Security Checklist

- [ ] All tables have RLS enabled
- [ ] All server actions check authentication
- [ ] All inputs validated with Zod
- [ ] Sensitive data never exposed in client
- [ ] API routes protected
- [ ] Environment variables secure

## Common Issues & Solutions

### Issue: RLS blocking queries
**Solution:** Check policy conditions match your query exactly

### Issue: Prisma client out of sync
**Solution:** 
```bash
npx prisma generate
```

### Issue: User not authenticated
**Solution:** Check middleware and auth flow

### Issue: AI responses inconsistent
**Solution:** Improve prompt specificity and add examples

## Debugging

### Enable verbose logging
```typescript
// Add to server actions
console.log('Debug:', { user, data, result })
```

### Check Supabase logs
- Go to Supabase Dashboard > Logs
- Check API, Auth, and Database logs

### Prisma Studio
```bash
npx prisma studio
```
View and edit database directly

## Code Style

### TypeScript
- Always use strict types
- No `any` types
- Prefer interfaces for objects
- Use discriminated unions for state

### Components
- One component per file
- Props interface above component
- Export at bottom
- Use semantic HTML

### Naming Conventions
- Components: PascalCase
- Functions: camelCase
- Constants: UPPER_SNAKE_CASE
- Types: PascalCase
- Files: kebab-case

## Git Workflow

1. Create feature branch
2. Make changes
3. Test thoroughly
4. Commit with clear message
5. Create PR
6. Review and merge

### Commit Message Format
```
feat: Add AI task breakdown
fix: Resolve task completion bug
docs: Update setup instructions
style: Format code
refactor: Simplify authentication logic
test: Add task creation tests
chore: Update dependencies
```

## Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [TanStack Query](https://tanstack.com/query)
- [shadcn/ui](https://ui.shadcn.com)

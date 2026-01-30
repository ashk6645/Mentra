# Contributing to TaskFlow

Thank you for your interest in contributing to TaskFlow! This guide will help you get started.

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on what is best for the community
- Show empathy towards other community members

## Getting Started

### 1. Fork the Repository
Click the "Fork" button in the top-right corner of the repository page.

### 2. Clone Your Fork
```bash
git clone https://github.com/YOUR_USERNAME/taskflow.git
cd taskflow
```

### 3. Set Up Development Environment
Follow the setup instructions in [README.md](README.md)

### 4. Create a Branch
```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

## Development Guidelines

### Code Quality Standards

#### TypeScript
- ✅ Use TypeScript strict mode
- ✅ Define proper types/interfaces
- ❌ No `any` types (use `unknown` if needed)
- ✅ Document complex types with JSDoc comments

```typescript
// ✅ Good
interface TaskProps {
  task: Task
  onComplete: (id: string) => void
}

// ❌ Bad
function handleTask(task: any) { }
```

#### React Components
- ✅ Use functional components
- ✅ Extract reusable logic into custom hooks
- ✅ Keep components focused and small
- ✅ Use TypeScript for props
- ❌ No unnecessary re-renders

```typescript
// ✅ Good
export function TaskCard({ task, onComplete }: TaskCardProps) {
  return (
    <Card>
      <CardTitle>{task.title}</CardTitle>
      <Button onClick={() => onComplete(task.id)}>Complete</Button>
    </Card>
  )
}

// ❌ Bad
export function TaskCard(props: any) {
  const [state, setState] = useState() // unnecessary state
  return <div>{props.task.title}</div>
}
```

#### Server Actions
- ✅ Always validate input with Zod
- ✅ Check authentication
- ✅ Handle errors gracefully
- ✅ Return consistent response format
- ✅ Revalidate paths after mutations

```typescript
// ✅ Good
'use server'

export async function createResource(data: unknown) {
  // 1. Auth check
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')

  // 2. Validation
  const validated = schema.safeParse(data)
  if (!validated.success) return { success: false, error: validated.error }

  // 3. Operation
  try {
    const resource = await prisma.resource.create({
      data: { userId: user.id, ...validated.data }
    })
    
    revalidatePath('/resources')
    return { success: true, data: resource }
  } catch (error) {
    return { success: false, error: 'Failed to create resource' }
  }
}
```

### Database Changes

1. **Update Prisma Schema**
   ```prisma
   model NewTable {
     id        String   @id @default(uuid())
     userId    String   @map("user_id")
     name      String
     createdAt DateTime @default(now()) @map("created_at")
     
     user      Profile  @relation(fields: [userId], references: [id])
     
     @@index([userId])
     @@map("new_table")
   }
   ```

2. **Push Changes**
   ```bash
   npx prisma db push
   npx prisma generate
   ```

3. **Add RLS Policies**
   ```sql
   ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;

   CREATE POLICY "Users can view their own data" ON new_table
     FOR SELECT USING (auth.uid()::text = user_id);

   CREATE POLICY "Users can insert their own data" ON new_table
     FOR INSERT WITH CHECK (auth.uid()::text = user_id);
   ```

4. **Update migration file**
   Add your RLS policies to `supabase/migrations/0000_initial_rls_policies.sql`

### Testing

Before submitting a PR:

- [ ] Code builds without errors
- [ ] No TypeScript errors
- [ ] No console warnings
- [ ] All features work as expected
- [ ] RLS policies tested
- [ ] Mobile responsive
- [ ] Accessible (keyboard navigation, screen readers)

### Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Format
<type>(<scope>): <description>

# Examples
feat(tasks): add task filtering by priority
fix(auth): resolve login redirect issue
docs(readme): update installation steps
style(ui): improve button hover states
refactor(api): simplify task creation logic
test(tasks): add task completion tests
chore(deps): update dependencies
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, missing semi-colons, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Pull Request Process

1. **Update your branch**
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Run final checks**
   ```bash
   npm run build
   npm run lint
   ```

3. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

4. **Create Pull Request**
   - Use a clear, descriptive title
   - Reference any related issues
   - Describe what changed and why
   - Add screenshots for UI changes

5. **PR Template**
   ```markdown
   ## Description
   Brief description of changes

   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   - [ ] Documentation update

   ## Related Issues
   Closes #123

   ## Screenshots (if applicable)
   [Add screenshots here]

   ## Checklist
   - [ ] Code builds without errors
   - [ ] Tests pass
   - [ ] Documentation updated
   - [ ] RLS policies added
   ```

## What to Contribute

### 🐛 Bug Fixes
Found a bug? Please check if an issue already exists, then:
1. Create an issue describing the bug
2. Fix the bug
3. Submit a PR referencing the issue

### ✨ New Features
Before building a new feature:
1. Open an issue to discuss it
2. Wait for maintainer approval
3. Build the feature
4. Submit a PR

### 📚 Documentation
- Fix typos
- Improve clarity
- Add examples
- Translate to other languages

### 🎨 UI/UX Improvements
- Fix accessibility issues
- Improve mobile responsiveness
- Enhance animations
- Improve color contrast

## Priority Areas

We especially welcome contributions in:

1. **Testing**
   - Unit tests
   - Integration tests
   - E2E tests

2. **Accessibility**
   - Screen reader support
   - Keyboard navigation
   - ARIA labels

3. **Performance**
   - Code splitting
   - Image optimization
   - Database query optimization

4. **Documentation**
   - API documentation
   - Component documentation
   - Tutorial content

5. **Internationalization**
   - Translation support
   - RTL support

## Code Review Process

1. Maintainer reviews your PR
2. Feedback provided (if needed)
3. Make requested changes
4. Maintainer approves
5. PR merged

**Review timeline:** Usually within 3-5 days

## Style Guide

### Naming Conventions

```typescript
// Components: PascalCase
TaskCard.tsx
CreateTaskDialog.tsx

// Functions: camelCase
handleSubmit()
getUserTasks()

// Constants: UPPER_SNAKE_CASE
MAX_TASKS
DEFAULT_PRIORITY

// Types: PascalCase
TaskWithRelations
CreateTaskInput

// Files: kebab-case
task-card.tsx
use-auth-store.ts
```

### File Organization

```typescript
// 1. Imports (grouped)
import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { createTask } from '@/lib/actions/tasks'

// 2. Types
interface Props {
  // ...
}

// 3. Component
export function Component({ }: Props) {
  // 3a. Hooks
  const [state, setState] = useState()
  const router = useRouter()

  // 3b. Functions
  const handleAction = () => { }

  // 3c. Effects
  useEffect(() => { }, [])

  // 3d. Render
  return <div>...</div>
}
```

### Comments

```typescript
// ✅ Good: Explain WHY, not WHAT
// Use optimistic update to improve perceived performance
updateTaskOptimistically(task)

// ❌ Bad: Obvious comment
// Update the task
updateTask(task)

// ✅ Good: Document complex logic
/**
 * Calculate XP needed for next level using exponential growth
 * Formula: BASE_XP * (MULTIPLIER ^ (level - 1))
 */
function xpForNextLevel(level: number): number {
  return Math.floor(XP_LEVEL_BASE * Math.pow(XP_LEVEL_MULTIPLIER, level - 1))
}
```

## Need Help?

- 📖 Read the [Development Guide](DEVELOPMENT.md)
- 💬 Join our Discord community
- 📧 Email: support@taskflow.app
- 🐛 Open an issue

## Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Credited in release notes
- Given credit in the app (for major features)

Thank you for contributing to TaskFlow! 🎉

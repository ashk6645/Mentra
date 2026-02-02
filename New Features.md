# **🚀 PHASE 1: PROJECTS & ORGANIZATION - DETAILED IMPLEMENTATION GUIDE**

---

## **📋 OVERVIEW: WHAT YOU'RE BUILDING**

**Goal**: Expose your existing Project system in the UI to give users powerful task organization by context (Work, Personal, etc.).

**Timeline**: 2-3 days total
- **Day 1**: Projects sidebar + basic CRUD
- **Day 2**: Project pages + task filtering
- **Day 3**: Sections within projects

**User Value**: 
- "I want all my Work tasks in one place"
- "I need to separate Personal from Side Projects"
- "Show me only high-priority Work tasks"

---

# **DAY 1: PROJECTS SIDEBAR & CREATION**

## **STEP 1: Fetch Projects Data in Layout** ⏱️ 30 minutes

**What to do**:
Add project fetching alongside your existing sidebar data fetch.

**Location**: `src/app/(app)/layout.tsx`

**Current state**:
```typescript
const { pages } = await getPages()
const { data: sidebarCounts } = await getSidebarCounts()
```

**Add**:
```typescript
const { projects } = await getProjects() // NEW: Fetch user's projects
```

**Pass to CommandPaletteWrapper**:
```typescript
<CommandPaletteWrapper
  user={user}
  initialPages={pages || []}
  initialProjects={projects || []} // NEW
  sidebarCounts={sidebarCounts || { inbox: 0, today: 0, overdue: 0 }}
>
```

**Why**: Server-side fetch = instant load, no loading spinners.

---

## **STEP 2: Create Project Actions** ⏱️ 45 minutes

**What to build**: Server actions for CRUD operations.

**Location**: `src/lib/actions/projects.ts` (create new file)

**Actions needed**:

### **2.1: getProjects()**
**What it does**: Fetch all user's non-archived projects with task counts.

**Query**:
```typescript
// Pseudo-code (you write the actual Prisma query)
prisma.project.findMany({
  where: { userId, isArchived: false },
  select: {
    id, name, icon, color, description, isFavorited, sortOrder,
    _count: { select: { tasks: { where: { completed: false } } } }
  },
  orderBy: [
    { isFavorited: 'desc' },  // Favorites first
    { sortOrder: 'asc' },      // Then manual order
    { createdAt: 'desc' }      // Then newest
  ]
})
```

**Return shape**:
```typescript
{
  id: string
  name: string
  icon: string | null  // Emoji
  color: string        // 'red' | 'blue' | 'green' etc
  description: string | null
  taskCount: number    // From _count
  isFavorited: boolean
}
```

---

### **2.2: createProject()**
**What it does**: Create new project with validation.

**Input**:
```typescript
{
  name: string           // Required, max 100 chars
  icon?: string         // Optional emoji
  color?: string        // Default 'blue'
  description?: string  // Optional
}
```

**Validation**:
- Name: Required, 1-100 characters
- Icon: Optional, single emoji (use regex to validate)
- Color: One of predefined set (red, orange, yellow, green, blue, purple, pink, gray)

**After creation**:
- Revalidate path: `/` (sidebar updates)
- Return new project data

---

### **2.3: updateProject()**
**What it does**: Update project metadata.

**Input**:
```typescript
{
  id: string          // Required
  name?: string
  icon?: string
  color?: string
  description?: string
  isFavorited?: boolean
  isArchived?: boolean
}
```

**Important**: Only allow updating user's own projects (security).

---

### **2.4: deleteProject()**
**What it does**: Soft delete (archive) or hard delete with confirmation.

**Two modes**:
1. **Soft delete**: Set `isArchived: true` (tasks stay intact)
2. **Hard delete**: Delete project + decide what to do with tasks:
   - Option A: Move tasks to "No Project" (set `projectId: null`)
   - Option B: Delete tasks too (requires confirmation dialog)

**My recommendation**: Default to soft delete (archive). Hard delete only if user explicitly chooses.

---

## **STEP 3: Add Projects Section to Sidebar** ⏱️ 2 hours

**Location**: `src/components/layout/sidebar.tsx`

**Where to add**: Between "Completed" and "Workspace/Pages" sections.

### **3.1: State Management**

**Add state**:
```typescript
const [projectsExpanded, setProjectsExpanded] = useState(true)
const [projects, setProjects] = useState<Project[]>(initialProjects || [])
const [showNewProjectDialog, setShowNewProjectDialog] = useState(false)
```

**Sync with server data**:
```typescript
useEffect(() => {
  if (initialProjects) {
    setProjects(initialProjects)
  }
}, [initialProjects])
```

---

### **3.2: UI Structure**

**Visual Design** (following your existing sidebar style):

```
┌─ Projects ────────────────────────┐
│ PROJECTS            [▼]  [+]      │  ← Header with collapse + add
│                                    │
│ 📁 Personal              12        │  ← Project row (icon, name, count)
│ 💼 Work                   8        │
│ 🚀 Side Projects          3        │
│ 🎨 Design                 0        │
└────────────────────────────────────┘
```

**Header Section**:
```typescript
<div className="flex items-center justify-between group mb-1 mt-4 px-2 py-1 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 rounded-sm cursor-pointer transition-colors">
  {/* Left: Label */}
  <span className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider select-none">
    Projects
  </span>
  
  {/* Right: Collapse arrow + Add button */}
  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
    {/* Collapse arrow (rotate based on state) */}
    <motion.div animate={{ rotate: projectsExpanded ? 90 : 0 }}>
      <ChevronRight className="h-3 w-3" />
    </motion.div>
    
    {/* Add button */}
    <button onClick={() => setShowNewProjectDialog(true)}>
      <Plus className="h-3 w-3" />
    </button>
  </div>
</div>
```

**Collapsible List**:
```typescript
<AnimatePresence>
  {projectsExpanded && (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.3, ease: "circOut" }}
      className="space-y-0.5 overflow-hidden"
    >
      {/* Map projects here */}
    </motion.div>
  )}
</AnimatePresence>
```

---

### **3.3: Project Row Design**

**Each project row needs**:

1. **Icon** (emoji or default 📁)
2. **Name** (truncated if long)
3. **Task count** (only if > 0)
4. **Active state** (highlighted when on project page)
5. **Hover actions** (edit, delete - appears on hover)

**Visual specs**:
- Height: 32px (`py-1.5`)
- Padding: 12px horizontal (`px-3`)
- Gap between elements: 8px (`gap-2`)
- Icon size: 16px (text-base for emoji)
- Font: 14px, medium weight
- Count badge: 12px, muted color, right-aligned

**Color coding by project color**:
- Each project has a `color` field (red, blue, green, etc.)
- Show subtle left border or dot with project color
- Example: `border-l-2 border-red-500` for red project

**Hover behavior**:
- Background: `hover:bg-accent/50`
- Show edit/delete icons on right (hidden by default, visible on hover)
- Smooth transition: `transition-colors duration-200`

**Active state** (when viewing project page):
- Background: `bg-accent`
- Border: Slightly stronger color accent
- Font weight: Semi-bold

---

### **3.4: Empty State**

**If no projects exist**:

```
┌─ Projects ────────────────────────┐
│ PROJECTS            [▼]  [+]      │
│                                    │
│ No projects yet                    │
│ Create one to organize tasks       │
│                                    │
│ [+ New Project]                    │
└────────────────────────────────────┘
```

**Visual**:
- Centered text, muted color
- Friendly copy: "Create your first project to get organized"
- Large clickable button (not just icon)

---

### **3.5: Context Menu on Project Row**

**On right-click or clicking "..." button**:

Menu options:
1. **Edit** → Opens edit dialog
2. **Duplicate** → Creates copy with "(Copy)" suffix
3. **Archive** → Soft delete (hide from sidebar)
4. **Delete** → Hard delete (with confirmation)

**Visual**: Use your existing DropdownMenu component, same style as task row menus.

---

## **STEP 4: Create Project Dialog** ⏱️ 1.5 hours

**Location**: `src/components/projects/create-project-dialog.tsx` (new file)

### **4.1: Dialog Structure**

**Component props**:
```typescript
interface CreateProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (project: Project) => void
}
```

**Dialog size**: `max-w-md` (medium, not full screen)

**Visual hierarchy**:
```
┌─ New Project ──────────────────────┐
│                                     │
│ Icon:  [📁 Click to change]        │  ← Emoji picker
│                                     │
│ Name:  [Work              ]        │  ← Auto-focused
│                                     │
│ Color: ● ● ● ● ● ● ● ●            │  ← Color picker
│                                     │
│ Description (optional)              │
│ [                          ]        │
│                                     │
│           [Cancel]  [Create]        │
└─────────────────────────────────────┘
```

---

### **4.2: Emoji Picker Implementation**

**Don't build from scratch** - Use existing library.

**Recommendation**: `emoji-picker-react` (lightweight, 50kb)

```bash
npm install emoji-picker-react
```

**UI Flow**:
1. Show current icon in button (default 📁)
2. Click button → Popover with emoji picker
3. Select emoji → Update state + close popover
4. Emoji button shows selected emoji

**Alternative** (simpler): Predefined emoji grid
```typescript
const PROJECT_EMOJIS = [
  '📁', '💼', '🏠', '🎯', '🚀', '💡', '📚', '🎨',
  '⚙️', '🔧', '🌟', '📊', '🎵', '🏋️', '🍳', '🌿'
]
```

Show as grid of clickable buttons (4x4). Faster UX than full picker.

---

### **4.3: Color Picker Implementation**

**Predefined colors** (don't use free-form color picker):

```typescript
const PROJECT_COLORS = [
  { name: 'Red', value: 'red', bg: 'bg-red-500', hover: 'hover:bg-red-600' },
  { name: 'Orange', value: 'orange', bg: 'bg-orange-500', hover: 'hover:bg-orange-600' },
  { name: 'Yellow', value: 'yellow', bg: 'bg-yellow-500', hover: 'hover:bg-yellow-600' },
  { name: 'Green', value: 'green', bg: 'bg-green-500', hover: 'hover:bg-green-600' },
  { name: 'Blue', value: 'blue', bg: 'bg-blue-500', hover: 'hover:bg-blue-600' },
  { name: 'Purple', value: 'purple', bg: 'bg-purple-500', hover: 'hover:bg-purple-600' },
  { name: 'Pink', value: 'pink', bg: 'bg-pink-500', hover: 'hover:bg-pink-600' },
  { name: 'Gray', value: 'gray', bg: 'bg-gray-500', hover: 'hover:bg-gray-600' },
]
```

**Visual**: 
- Show as horizontal row of circles
- Each circle: 32px diameter
- Selected: Ring around it (`ring-2 ring-offset-2`)
- Hover: Scale up slightly (`hover:scale-110`)

---

### **4.4: Form Validation**

**Name field**:
- Required
- Min 1 character, max 100 characters
- Show character count: `{name.length}/100` in muted text below input
- Error state: Red border + error message if invalid

**Icon field**:
- Optional (defaults to 📁)
- Must be single emoji (validate with regex)

**Color field**:
- Required (defaults to 'blue')

**Description field**:
- Optional
- Max 500 characters
- Multi-line textarea (3-4 rows)

**Form state**:
```typescript
const [name, setName] = useState('')
const [icon, setIcon] = useState('📁')
const [color, setColor] = useState('blue')
const [description, setDescription] = useState('')
const [isCreating, setIsCreating] = useState(false)
const [error, setError] = useState<string | null>(null)
```

---

### **4.5: Submit Flow**

**On clicking "Create"**:

1. **Validate locally**:
   ```typescript
   if (!name.trim()) {
     setError('Project name is required')
     return
   }
   if (name.length > 100) {
     setError('Name must be 100 characters or less')
     return
   }
   ```

2. **Set loading state**:
   ```typescript
   setIsCreating(true)
   setError(null)
   ```

3. **Call server action**:
   ```typescript
   const result = await createProject({
     name: name.trim(),
     icon: icon,
     color: color,
     description: description.trim() || null
   })
   ```

4. **Handle response**:
   ```typescript
   if (result.success) {
     // Success!
     onSuccess?.(result.data)
     onOpenChange(false)
     // Reset form
     setName('')
     setIcon('📁')
     setColor('blue')
     setDescription('')
   } else {
     // Error
     setError(result.error || 'Failed to create project')
   }
   ```

5. **Always reset loading**:
   ```typescript
   finally {
     setIsCreating(false)
   }
   ```

---

### **4.6: Visual Feedback**

**Loading state**:
- Disable all inputs
- "Create" button shows spinner + "Creating..."
- Can't close dialog while creating

**Success state**:
- Don't show success message in dialog
- Let dialog close immediately
- Show toast notification: "Project created"
- Sidebar auto-updates (revalidation handles this)

**Error state**:
- Show error message above buttons (red text, small)
- Don't close dialog
- Keep form filled so user can fix and retry

---

## **STEP 5: Edit Project Dialog** ⏱️ 30 minutes

**Location**: Same component, different mode.

**Component structure**:
```typescript
interface ProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'create' | 'edit'
  project?: Project  // Required for edit mode
}
```

**Differences from create**:
1. **Title**: "Edit Project" instead of "New Project"
2. **Pre-filled form**: Load existing values
3. **Button text**: "Save Changes" instead of "Create"
4. **Additional option**: "Archive Project" button (destructive style)

**Visual**:
```
┌─ Edit Project ─────────────────────┐
│                                     │
│ Icon:  [💼 Click to change]        │
│                                     │
│ Name:  [Work              ]        │
│                                     │
│ Color: ● ● ● ● ● ● ● ●            │
│                                     │
│ Description                         │
│ [All work-related tasks   ]        │
│                                     │
│ [Archive]    [Cancel]  [Save]      │
└─────────────────────────────────────┘
```

**Archive button**:
- Left side (not in footer with Cancel/Save)
- Secondary variant, muted
- Shows confirmation dialog: "Archive this project? Tasks will stay but project will be hidden."

---

# **DAY 2: PROJECT PAGES & TASK FILTERING**

## **STEP 6: Create Project Page Route** ⏱️ 2 hours

**Location**: `src/app/(app)/projects/[id]/page.tsx` (new file)

### **6.1: Page Structure**

**What it displays**:
- Project header (icon, name, description)
- Task filters (All, Active, Completed)
- Task list (only tasks in this project)
- Quick add task (auto-assigns to this project)

**Layout visual**:
```
┌──────────────────────────────────────────────┐
│ 💼 Work                            [•••]     │  ← Header with actions
│ All work-related tasks                       │  ← Description
│                                               │
│ [All] [Active] [Completed]                   │  ← Filter tabs
│                                               │
│ ☐ Finish quarterly report            🔴High │  ← Tasks
│ ☐ Review team proposals               Today  │
│ ☑ Send client email               ✓ Complete│
│                                               │
│ + Add task to Work                           │  ← Quick add
└──────────────────────────────────────────────┘
```

---

### **6.2: Data Fetching**

**What to fetch**:

1. **Project data** (server-side):
   ```typescript
   const project = await getProject(params.id)
   
   // If not found or not user's project:
   if (!project) notFound()
   ```

2. **Tasks in project** (server-side):
   ```typescript
   const tasks = await prisma.task.findMany({
     where: {
       projectId: params.id,
       userId: user.id
     },
     include: {
       tags: { include: { tag: true } },
       subtasks: true
     },
     orderBy: [
       { completed: 'asc' },    // Active first
       { sortOrder: 'asc' },    // Manual order
       { createdAt: 'desc' }    // Newest first
     ]
   })
   ```

3. **Task counts**:
   ```typescript
   const counts = {
     all: tasks.length,
     active: tasks.filter(t => !t.completed).length,
     completed: tasks.filter(t => t.completed).length
   }
   ```

---

### **6.3: Page Header Design**

**Use your existing PageHeader component**, but customize:

**Title section**:
```typescript
<PageHeader
  title={
    <div className="flex items-center gap-3">
      <span className="text-4xl">{project.icon}</span>
      <span>{project.name}</span>
    </div>
  }
  description={project.description}
  actions={/* ... */}
/>
```

**Actions dropdown**:
```
[•••]  ← More menu
  │
  ├─ Edit Project
  ├─ Duplicate
  ├─ Export Tasks (CSV)
  ├─ ─────────────
  ├─ Archive Project
  └─ Delete Project  (red text)
```

**Visual**: Right-aligned DropdownMenu, same style as task row actions.

---

### **6.4: Filter Tabs**

**Purpose**: Quick filter without leaving page.

**Three states**:
- **All**: Show all tasks (active + completed)
- **Active**: Show only incomplete tasks (default)
- **Completed**: Show only completed tasks

**Implementation** (client component):

```typescript
const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('active')

const filteredTasks = useMemo(() => {
  switch (filter) {
    case 'active':
      return tasks.filter(t => !t.completed)
    case 'completed':
      return tasks.filter(t => t.completed)
    default:
      return tasks
  }
}, [tasks, filter])
```

**Visual design** (inspired by GitHub tabs):

```
┌─────────┬──────────┬────────────┐
│   All   │ Active   │ Completed  │  ← Tabs
│    32   │    28    │     4      │  ← Counts
└─────────┴──────────┴────────────┘
   ▔▔▔▔▔▔▔                          ← Active indicator
```

**Styling**:
- Inactive tabs: `text-muted-foreground`, no background
- Active tab: `text-foreground font-semibold`, bottom border (2px, primary color)
- Counts: Small badge, subtle
- Transition: Smooth slide animation on indicator

---

### **6.5: Task List Display**

**Use your existing `SortableTaskList` component** - no changes needed!

**Just pass filtered tasks**:
```typescript
<SortableTaskList tasks={filteredTasks} />
```

**Sorting**: Already handled by your component (manual drag-drop + createdAt fallback).

---

### **6.6: Quick Add Task**

**Use existing `CreateTaskInline` component**, but with project pre-selected:

```typescript
<CreateTaskInline 
  defaultProjectId={project.id}  // NEW PROP
  label={`Add task to ${project.name}`}
  className="mt-6"
/>
```

**Modify CreateTaskInline to accept `defaultProjectId`**:
- When creating task, automatically set `projectId` field
- Don't show project selector in quick add (it's implied)
- User can change project later by editing task

---

### **6.7: Empty State**

**If no tasks in project** (not even completed):

```
┌────────────────────────────────┐
│                                 │
│         📭                      │  ← Empty inbox icon
│                                 │
│    No tasks yet                 │
│    Add your first task below    │
│                                 │
│  + Add task to Work             │
│                                 │
└─────────────────────────────────┘
```

**Visual**:
- Centered layout
- Large emoji (7xl)
- Friendly copy
- Large, inviting quick add button

---

## **STEP 7: Modify Task Creation to Support Projects** ⏱️ 1 hour

### **7.1: Update CreateTask Action**

**Location**: `src/lib/actions/tasks.ts` → `createTask()` function

**Add projectId parameter**:
```typescript
interface CreateTaskInput {
  title: string
  description?: string
  dueDate?: string
  priority?: string
  projectId?: string  // NEW
  // ... existing fields
}
```

**In Prisma create**:
```typescript
await prisma.task.create({
  data: {
    // ... existing fields
    projectId: projectId || null  // Allow null (no project)
  }
})
```

---

### **7.2: Add Project Selector to Full Task Dialog**

**Location**: `src/components/tasks/create-task-dialog.tsx` (or wherever you have full task creation form)

**Add project dropdown**:

**Placement**: Between title and description fields.

**Visual**:
```
Title: [                           ]

Project: [Select project      ▼]  ← NEW

Description: [                    ]

Due date: [                   ]
```

**Implementation**:
```typescript
<Select value={projectId || 'none'} onValueChange={setProjectId}>
  <SelectTrigger>
    <SelectValue placeholder="No project" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="none">
      <span className="text-muted-foreground">No project</span>
    </SelectItem>
    {projects.map(project => (
      <SelectItem key={project.id} value={project.id}>
        <div className="flex items-center gap-2">
          <span>{project.icon}</span>
          <span>{project.name}</span>
        </div>
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

**Visual enhancements**:
- Show project color as left border on selected option
- Group projects by favorite status (favorites first)

---

### **7.3: Update Task Detail Panel**

**Location**: `src/components/task-detail/task-metadata-row.tsx`

**Add project pill button** (next to due date, priority, tags):

```
[📅 Today] [🔴 High] [📁 Work] [🏷️ Tags]
                      ↑ NEW
```

**Clicking project pill**:
- Opens dropdown (same as task creation)
- Can change project or remove project (set to "None")
- Updates task immediately

**Visual**: Same style as other metadata pills (rounded-full, small size, hover state).

---

# **DAY 3: SECTIONS WITHIN PROJECTS**

## **STEP 8: Create Section Model** ⏱️ 30 minutes

### **8.1: Prisma Schema**

**Location**: `prisma/schema.prisma`

**Add new model**:

```prisma
model Section {
  id        String   @id @default(cuid())
  name      String
  projectId String
  sortOrder Int      @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  tasks   Task[]

  @@index([projectId])
  @@index([sortOrder])
}
```

**Update Project model**:
```prisma
model Project {
  // ... existing fields
  sections Section[]  // NEW
}
```

**Update Task model**:
```prisma
model Task {
  // ... existing fields
  sectionId String?   // NEW (optional)
  section   Section?  @relation(fields: [sectionId], references: [id], onDelete: SetNull)

  @@index([sectionId])
}
```

**Run migration**:
```bash
npx prisma migrate dev --name add_sections
```

---

### **8.2: Section Actions**

**Location**: `src/lib/actions/sections.ts` (new file)

**Actions needed**:

1. **getSections(projectId)** - Fetch all sections for a project
2. **createSection(projectId, name)** - Add new section
3. **updateSection(id, name)** - Rename section
4. **deleteSection(id)** - Delete section (moves tasks to "No Section")
5. **reorderSections(projectId, newOrder)** - Drag-drop reordering

**Important**: Always verify user owns the project before modifying sections.

---

## **STEP 9: Update Project Page with Sections** ⏱️ 2-3 hours

### **9.1: Data Fetching**

**Modify project page to fetch sections**:

```typescript
const sections = await getSections(project.id)
const tasks = await getTasksByProject(project.id)

// Group tasks by section
const groupedTasks = {
  noSection: tasks.filter(t => !t.sectionId),
  sections: sections.map(section => ({
    ...section,
    tasks: tasks.filter(t => t.sectionId === section.id)
  }))
}
```

---

### **9.2: Visual Layout**

**With sections** (similar to Todoist):

```
┌─ 💼 Work ─────────────────────────────────┐
│                                            │
│ ─── 🔴 Urgent ──────────────────  [+] [⋮] │  ← Section header
│ ☐ Fix production bug                      │
│ ☐ Client presentation prep                │
│                                            │
│ ─── 📋 This Week ───────────────  [+] [⋮] │
│ ☐ Team standup                            │
│ ☐ Code review                             │
│ ☐ Update documentation                    │
│                                            │
│ ─── 💡 Ideas ────────────────────  [+] [⋮] │
│ ☐ Refactor API                            │
│ ☐ Add dark mode                           │
│                                            │
│ ─── No Section ─────────────────────────  │  ← Tasks without section
│ ☐ Miscellaneous task                      │
│                                            │
│ + Add section                              │
└────────────────────────────────────────────┘
```

---

### **9.3: Section Header Component**

**Location**: `src/components/projects/section-header.tsx` (new file)

**What it displays**:
- Section name (editable on click)
- Task count in section
- Add task to section button
- More actions menu (rename, delete)

**Visual design**:

```
──── 🔴 Urgent ───────────────  [+] [⋮]
      ↑      ↑                   ↑   ↑
    icon  name                  add more
                               task menu
```

**Styling**:
- Height: 40px
- Font: Small caps or uppercase, 12px, semi-bold, muted color
- Divider: Thin horizontal line (1px, muted)
- Hover: Slightly brighter text, show action buttons

---

### **9.4: Inline Section Renaming**

**UX flow**:
1. Click section name
2. Name becomes editable input (inline)
3. Edit name
4. Press Enter or blur → Save
5. Press Escape → Cancel

**Visual**:
- Input has no border (looks like text until focused)
- On focus: Show subtle border
- Max width: Match text length + 20px padding

**Implementation tip**:
```typescript
const [isEditing, setIsEditing] = useState(false)
const [sectionName, setSectionName] = useState(section.name)

// On click: setIsEditing(true)
// On blur or Enter: Save and setIsEditing(false)
// On Escape: Reset name and setIsEditing(false)
```

---

### **9.5: Add Section Button**

**Placement**: At bottom of all sections (before "No Section").

**Visual**:
```
+ Add section
```

**Styling**:
- Subtle, not prominent (secondary style)
- Left-aligned (matches sections)
- Hover: Slight background color

**Click behavior**:
- Inline input appears
- Type section name
- Press Enter → Create section
- Press Escape → Cancel

---

### **9.6: Drag Tasks Between Sections**

**Library**: You already have `@dnd-kit` for sortable lists.

**What to enable**:
1. **Within section**: Reorder tasks (existing functionality)
2. **Between sections**: Drag task to different section
3. **To "No Section"**: Remove from section

**Visual feedback**:
- Show drop zone between sections
- Highlight target section on hover
- Smooth animation when moving

**Data update**:
```typescript
// When task dropped in new section:
await updateTask({
  id: taskId,
  sectionId: newSectionId || null
})
```

---

### **9.7: Section More Actions Menu**

**Clicking [⋮] button on section header**:

Menu options:
1. **Rename** → Opens inline edit
2. **Add task** → Creates task in this section
3. **Move all tasks** → Dropdown to select target section
4. **Delete section** → Confirmation dialog

**Delete section behavior**:
- Show warning: "Delete this section? X tasks will move to No Section."
- Confirm → Delete section, set `sectionId: null` for all tasks
- Cancel → Do nothing

---

## **STEP 10: Update Task Creation for Sections** ⏱️ 30 minutes

### **10.1: Quick Add in Section**

**When clicking [+] next to section header**:

- Show inline quick add (same as project quick add)
- Pre-fill: `projectId` + `sectionId`
- User types title → Press Enter → Task created in that section

**Visual**: Input appears directly below section header (indented slightly).

---

### **10.2: Task Detail Panel**

**Add section selector** to metadata row (alongside project):

```
[📅 Today] [🔴 High] [📁 Work → 🔴 Urgent] [🏷️ Tags]
                      ↑ Project → Section
```

**Clicking section pill**:
- Dropdown shows sections in current project
- Can change section
- Option to remove from section ("No section")

**If task has no project**:
- Section selector is hidden (sections require parent project)

---

# **✅ IMPLEMENTATION CHECKLIST SUMMARY**

## **Day 1: Projects Sidebar & Creation**
- [ ] Fetch projects in layout (getProjects action)
- [ ] Create project CRUD actions (create, update, delete, reorder)
- [ ] Add Projects section to sidebar (collapsible)
- [ ] Project row component (icon, name, count, active state)
- [ ] Create Project dialog (name, icon, color, description)
- [ ] Edit Project dialog (reuse create dialog, different mode)
- [ ] Empty state for no projects

## **Day 2: Project Pages & Task Filtering**
- [ ] Create `/projects/[id]/page.tsx` route
- [ ] Fetch project + tasks server-side
- [ ] Project page header (icon, name, actions menu)
- [ ] Filter tabs (All, Active, Completed)
- [ ] Display filtered task list
- [ ] Quick add task (pre-filled with projectId)
- [ ] Empty state for no tasks in project
- [ ] Add projectId to createTask action
- [ ] Add project selector to task creation dialog
- [ ] Add project pill to task detail panel

## **Day 3: Sections**
- [ ] Create Section Prisma model + migration
- [ ] Add sectionId to Task model
- [ ] Create section CRUD actions
- [ ] Update project page to group tasks by section
- [ ] Section header component (name, count, actions)
- [ ] Inline section renaming
- [ ] Add section button + inline creation
- [ ] Drag tasks between sections (dnd-kit)
- [ ] Section more actions menu (rename, delete, move tasks)
- [ ] Update task creation to support sections
- [ ] Add section selector to task detail panel

---

# **🎨 DESIGN SPECS SUMMARY**

## **Colors**
- **Project colors**: red, orange, yellow, green, blue, purple, pink, gray
- **Usage**: Subtle left border on project rows, color accent in headers

## **Spacing**
- **Sidebar items**: 32px height, 12px horizontal padding
- **Sections**: 40px header height, 16px vertical spacing between sections
- **Icons**: 16px (emoji in text-base)

## **Typography**
- **Sidebar labels**: 11px, uppercase, semi-bold, muted
- **Project names**: 14px, medium weight
- **Section headers**: 12px, uppercase or small caps, semi-bold

## **Animations**
- **Collapse/expand**: 300ms ease-out
- **Hover states**: 200ms transition
- **Drag indicators**: Immediate (no delay)

---

# **🚀 SUCCESS METRICS**

**You'll know it's working when**:
1. ✅ Projects appear in sidebar with accurate task counts
2. ✅ Clicking project navigates to project page with filtered tasks
3. ✅ Creating project is fast (< 2 seconds)
4. ✅ Sections visually group tasks without clutter
5. ✅ Dragging tasks between sections feels smooth
6. ✅ Users can organize 100+ tasks without confusion

**User feedback to listen for**:
- "I love seeing all my Work tasks in one place"
- "Sections are perfect for Urgent vs Later"
- "Creating projects is so fast!"

---

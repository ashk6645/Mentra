# Notion-Style Project Database

A comprehensive, Notion-inspired project database component for managing projects with multiple views, filters, and inline editing capabilities.

## 📋 Features

### Core Capabilities
- ✅ **Multiple Views**: Table, Board (Kanban), Timeline (Gantt), Calendar
- ✅ **Inline Editing**: Click any cell to edit directly
- ✅ **Filters & Sorts**: Advanced filtering and sorting per view
- ✅ **Properties Panel**: Show/hide columns and reorder them
- ✅ **Keyboard Navigation**: Tab, Enter, Arrow keys for fast navigation
- ✅ **Optimistic Updates**: Instant UI feedback with server sync
- ✅ **Drag & Drop**: Reorder columns, move cards between status columns
- ✅ **Progress Tracking**: Auto-calculated from completed tasks
- ✅ **Fully Typed**: Complete TypeScript support

### Project Properties
- **Name**: Project title (required)
- **Status**: Planning / Active / On Hold / Completed
- **Priority**: High / Medium / Low
- **Area**: Life domain categorization
- **Start Date**: Project start date
- **Target Date**: Deadline
- **Progress**: Auto-calculated percentage from tasks
- **Description**: Rich text notes

## 🚀 Usage

### Basic Setup

```tsx
import { ProjectDatabase } from '@/components/project-database'

export default async function ProjectsPage() {
  // Fetch your data
  const projects = await getProjects()
  const areas = await getAreas()

  return (
    <ProjectDatabase
      initialProjects={projects}
      initialAreas={areas}
    />
  )
}
```

### With Custom Handlers

```tsx
<ProjectDatabase
  initialProjects={projects}
  initialAreas={areas}
  onProjectClick={(project) => {
    console.log('Project clicked:', project)
  }}
  className="custom-styles"
/>
```

## 📁 Component Structure

```
project-database/
├── index.tsx                    # Main component & exports
├── types.ts                     # TypeScript types & configs
├── project-database-context.tsx # State management
├── table-view.tsx               # Spreadsheet view
├── board-view.tsx               # Kanban board
├── timeline-view.tsx            # Gantt timeline
├── calendar-view.tsx            # Monthly calendar
├── view-switcher.tsx            # View selector tabs
├── filter-bar.tsx               # Filtering UI
├── properties-panel.tsx         # Column visibility
├── project-details-sheet.tsx    # Project details panel
├── inline-edit-cell.tsx         # Editable cell component
└── cell-renderers.tsx           # Display components
```

## 🎨 Views

### 1. Table View
**Best for**: Detailed data entry and analysis

Features:
- Sortable columns
- Inline editing
- Keyboard navigation
- Bulk selection
- Column reordering (via Properties Panel)

```tsx
// Auto-rendered based on viewState.view = 'table'
```

### 2. Board View (Kanban)
**Best for**: Status tracking and workflow visualization

Features:
- Grouped by Status, Priority, or Area
- Drag & drop between columns
- Quick status updates
- Card-based interface

```tsx
<BoardView 
  groupBy="status" 
  onCardClick={handleClick} 
/>
```

### 3. Timeline View (Gantt)
**Best for**: Date-based planning and scheduling

Features:
- Visual date ranges
- Draggable edges to reschedule
- Zoom levels (day/week/month)
- Today indicator

```tsx
<TimelineView 
  zoom="month"
  onProjectClick={handleClick}
/>
```

### 4. Calendar View
**Best for**: Deadline management

Features:
- Monthly grid
- Multiple projects per day
- Quick create on date click
- Visual deadline overview

```tsx
<CalendarView 
  onProjectClick={handleClick}
  onDateClick={handleDateClick}
/>
```

## 🔧 API Actions

Server actions are located in `/lib/actions/project-database-actions.ts`:

```tsx
// CRUD Operations
await createProject(data)
await updateProject(id, data)
await deleteProject(id)
await getProjects()
await getProjectById(id)

// Bulk Operations
await bulkDeleteProjects(ids)
await bulkUpdateProjectStatus(ids, status)

// Archive
await archiveProject(id)
await unarchiveProject(id)
```

## 🎯 Context API

Access database state and actions anywhere:

```tsx
import { useProjectDatabase } from '@/components/project-database'

function MyComponent() {
  const {
    projects,           // Filtered & sorted projects
    viewState,          // Current view config
    selectedProjectIds, // Selected project IDs
    
    // CRUD
    createProject,
    updateProject,
    deleteProject,
    
    // View Control
    setView,
    setFilters,
    setSorts,
    toggleColumn,
    
    // Selection
    selectAll,
    clearSelection,
    
  } = useProjectDatabase()
}
```

## 🗄️ Database Schema

Required Prisma schema additions:

```prisma
model Project {
  id          String          @id @default(uuid())
  userId      String
  name        String
  description String?
  
  // Database fields
  status      ProjectStatus   @default(ACTIVE)
  priority    ProjectPriority @default(MEDIUM)
  startDate   DateTime?
  targetDate  DateTime?
  
  areaId      String?
  area        AreaOfLife?     @relation(...)
  tasks       Task[]
  
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt
}

enum ProjectStatus {
  PLANNING
  ACTIVE
  ON_HOLD
  COMPLETED
}

enum ProjectPriority {
  HIGH
  MEDIUM
  LOW
}
```

## 🎨 Customization

### Custom Columns

Edit `types.ts` → `DEFAULT_COLUMNS`:

```tsx
export const DEFAULT_COLUMNS: ColumnDefinition[] = [
  { 
    id: 'name', 
    name: 'Name', 
    type: 'title',
    visible: true,
    sortable: true,
    editable: true,
  },
  // Add your custom columns...
]
```

### Custom Status Colors

Edit `types.ts` → `STATUS_CONFIG`:

```tsx
export const STATUS_CONFIG = {
  ACTIVE: {
    label: 'Active',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-300',
  },
  // Customize colors...
}
```

## 🔑 Key Concepts

### 1. Optimistic Updates
All mutations update the UI immediately before server confirmation:

```tsx
// User sees change instantly
startTransition(() => {
  addOptimisticUpdate({ type: 'update', data: updatedProject })
})

// Server sync happens in background
await updateProject(id, data)
```

### 2. View State
Each view can have independent filters, sorts, and column visibility:

```tsx
interface ViewState {
  id: string
  name: string
  view: 'table' | 'board' | 'timeline' | 'calendar'
  filters: Filter[]
  sorts: Sort[]
  visibleColumns: string[]
  columnOrder: string[]
}
```

### 3. Filter System
Powerful filtering with type-aware operators:

```tsx
interface Filter {
  id: string
  field: string
  operator: 'is' | 'contains' | 'before' | 'after' | ...
  value: string | string[] | null
}
```

## 📱 Responsive Design

- Mobile: Simplified table view with essential columns
- Tablet: Full table view with horizontal scroll
- Desktop: All views fully functional

## 🎭 UX Principles

Following Notion's design philosophy:

1. **Zero Friction Editing**: Click to edit, no modals
2. **Immediate Feedback**: Optimistic updates
3. **Calm Interface**: Muted colors, clear hierarchy
4. **Keyboard First**: Full keyboard navigation
5. **Contextual Actions**: Actions appear on hover

## 🚦 Getting Started

### 1. Run Database Migration

```bash
npx prisma migrate dev --name add_project_database_fields
```

### 2. Navigate to the Database

```
/project-database
```

### 3. Start Creating Projects!

Click "+" or press `N` to create your first project.

## 🎯 Best Practices

1. **Keep it Simple**: Start with Table view, add others as needed
2. **Use Filters**: Create saved views for common queries
3. **Keyboard Nav**: Learn shortcuts for speed
4. **Status Flow**: Use Planning → Active → Completed
5. **Link Tasks**: Associate tasks to track progress

## 🐛 Troubleshooting

### Projects not appearing?
- Check `isArchived: false` filter
- Verify user authentication
- Check browser console for errors

### Edits not saving?
- Ensure server actions are properly imported
- Check network tab for failed requests
- Verify Prisma schema matches types

### Performance issues?
- Limit visible projects (use filters)
- Reduce number of visible columns
- Consider pagination for 1000+ projects

## 🔮 Future Enhancements

Possible additions:
- [ ] List view (minimal)
- [ ] Gallery view (card-based)
- [ ] Custom views (save filter/sort combos)
- [ ] Templates
- [ ] Relations to other databases
- [ ] Formula fields
- [ ] Rollup fields
- [ ] Database-level permissions

## 📚 Learn More

Inspired by:
- [Notion Databases](https://www.notion.so/help/guides/creating-a-database)
- [Linear Project Views](https://linear.app)
- [Airtable](https://www.airtable.com)

---

Built with ❤️ using Next.js, Prisma, and shadcn/ui

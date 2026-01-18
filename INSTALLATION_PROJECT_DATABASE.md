# Project Database Installation Guide

## 🎯 Quick Start

Follow these steps to integrate the Notion-style Project Database into your app.

---

## Step 1: Update Database Schema

The Prisma schema has already been updated with the required fields. Now run the migration:

```bash
# Generate migration
npx prisma migrate dev --name add_project_database_fields

# Or if you prefer to apply directly
npx prisma db push
```

This adds:
- `status` (enum: PLANNING, ACTIVE, ON_HOLD, COMPLETED)
- `priority` (enum: HIGH, MEDIUM, LOW)
- `startDate` (DateTime, optional)
- `targetDate` (DateTime, optional)

---

## Step 2: Install Dependencies

The component uses several packages. Make sure you have them installed:

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
npm install date-fns
npm install lucide-react
npm install @radix-ui/react-checkbox
npm install @radix-ui/react-dropdown-menu
npm install @radix-ui/react-popover
npm install @radix-ui/react-select
npm install @radix-ui/react-sheet
npm install @radix-ui/react-tabs
npm install @radix-ui/react-tooltip
```

Or all at once:

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities date-fns lucide-react @radix-ui/react-checkbox @radix-ui/react-dropdown-menu @radix-ui/react-popover @radix-ui/react-select @radix-ui/react-sheet @radix-ui/react-tabs @radix-ui/react-tooltip
```

---

## Step 3: Verify Components

The following components have been created in `/src/components/project-database/`:

- ✅ `index.tsx` - Main component
- ✅ `types.ts` - TypeScript definitions
- ✅ `project-database-context.tsx` - State management
- ✅ `table-view.tsx` - Table view
- ✅ `board-view.tsx` - Kanban board
- ✅ `timeline-view.tsx` - Gantt timeline
- ✅ `calendar-view.tsx` - Calendar view
- ✅ `view-switcher.tsx` - View selector
- ✅ `filter-bar.tsx` - Filtering UI
- ✅ `properties-panel.tsx` - Column settings
- ✅ `project-details-sheet.tsx` - Project details
- ✅ `inline-edit-cell.tsx` - Inline editing
- ✅ `cell-renderers.tsx` - Display components

---

## Step 4: API Actions

Server actions have been created at:

```
/src/lib/actions/project-database-actions.ts
```

Functions available:
- `getProjects()` - Fetch all projects
- `getProjectById(id)` - Fetch single project
- `createProject(data)` - Create new project
- `updateProject(id, data)` - Update project
- `deleteProject(id)` - Delete project
- `bulkDeleteProjects(ids)` - Bulk delete
- `bulkUpdateProjectStatus(ids, status)` - Bulk update

---

## Step 5: Test the Database

A demo page has been created at:

```
/src/app/(app)/project-database/page.tsx
```

### Navigate to:
```
http://localhost:3000/project-database
```

---

## Step 6: Integration Examples

### Add to Your Sidebar

```tsx
// In your sidebar component
<Link href="/project-database">
  <LayoutGrid className="h-4 w-4" />
  Projects Database
</Link>
```

### Use in Any Page

```tsx
import { ProjectDatabase } from '@/components/project-database'

export default async function MyPage() {
  const projects = await prisma.project.findMany({
    where: { userId: user.id },
    include: { area: true, tasks: true }
  })

  return <ProjectDatabase initialProjects={projects} />
}
```

### Custom Integration

```tsx
<ProjectDatabase
  initialProjects={projects}
  initialAreas={areas}
  initialViewState={{
    view: 'board', // Start with board view
    filters: [
      { field: 'status', operator: 'is', value: 'ACTIVE' }
    ]
  }}
  onProjectClick={(project) => {
    router.push(`/projects/${project.id}`)
  }}
/>
```

---

## 🎨 Customization

### Change Default View

Edit `/src/components/project-database/types.ts`:

```tsx
export const DEFAULT_VIEW_STATE: ViewState = {
  id: 'default',
  name: 'All Projects',
  view: 'board', // Change this
  filters: [],
  sorts: [{ field: 'updatedAt', direction: 'desc' }],
  visibleColumns: ['name', 'status', 'priority'],
  columnOrder: [...],
}
```

### Add Custom Columns

In `types.ts`, add to `DEFAULT_COLUMNS`:

```tsx
{
  id: 'customField',
  name: 'Custom Field',
  type: 'text',
  width: 150,
  visible: true,
  sortable: true,
  filterable: true,
  editable: true,
}
```

### Customize Colors

In `types.ts`, modify `STATUS_CONFIG` or `PRIORITY_CONFIG`:

```tsx
export const STATUS_CONFIG = {
  ACTIVE: {
    label: 'In Progress', // Change label
    color: 'text-green-700', // Change color
    bgColor: 'bg-green-100',
    borderColor: 'border-green-300',
  },
}
```

---

## 🔐 Security Notes

The server actions automatically:
- ✅ Check user authentication
- ✅ Verify project ownership
- ✅ Validate permissions
- ✅ Sanitize inputs

No additional security setup needed!

---

## 📊 Data Migration (Optional)

If you have existing projects without the new fields:

```sql
-- Set default values for existing projects
UPDATE projects 
SET 
  status = 'ACTIVE',
  priority = 'MEDIUM'
WHERE 
  status IS NULL 
  OR priority IS NULL;
```

---

## 🎯 Next Steps

1. ✅ Run database migration
2. ✅ Install dependencies
3. ✅ Test at `/project-database`
4. ✅ Add to your navigation
5. ✅ Customize to your needs

---

## 🐛 Troubleshooting

### Issue: Migration fails
**Solution**: Check your database connection in `.env`

### Issue: Components not rendering
**Solution**: Verify all dependencies are installed

### Issue: TypeScript errors
**Solution**: Run `npx prisma generate` to update types

### Issue: Server actions not working
**Solution**: Check that you have `auth()` function from Supabase

---

## 📚 Documentation

Full documentation available at:
```
/src/components/project-database/README.md
```

---

## 🎉 You're Done!

The Notion-style Project Database is now ready to use. Start creating projects and explore all the views!

---

Need help? Check the README or the inline code comments.

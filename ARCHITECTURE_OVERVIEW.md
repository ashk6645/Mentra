# 🏗️ Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                       │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Private    │  │   Projects   │  │    Tasks     │     │
│  │    Pages     │  │   Database   │  │  Management  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │    Habits    │  │  Focus Mode  │  │   Calendar   │     │
│  │   Tracking   │  │   (Pomodoro) │  │     View     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    COMPONENT LAYER                           │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Block Editor System                      │  │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐       │  │
│  │  │  Text  │ │Heading │ │  List  │ │Database│  ...  │  │
│  │  │ Block  │ │ Block  │ │ Block  │ │ Block  │       │  │
│  │  └────────┘ └────────┘ └────────┘ └────────┘       │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           Project Database Views                      │  │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐       │  │
│  │  │ Table  │ │ Board  │ │Gallery │ │Timeline│  ...  │  │
│  │  │  View  │ │  View  │ │  View  │ │  View  │       │  │
│  │  └────────┘ └────────┘ └────────┘ └────────┘       │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    SERVER ACTIONS                            │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  Pages   │  │  Blocks  │  │ Projects │  │  Tasks   │  │
│  │ Actions  │  │ Actions  │  │ Actions  │  │ Actions  │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  Habits  │  │   User   │  │   Tags   │  │ Actions  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      PRISMA ORM                              │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │              Type-Safe Database Access              │    │
│  │  • Query Builder                                    │    │
│  │  • Migrations                                       │    │
│  │  • Type Generation                                  │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   POSTGRESQL DATABASE                        │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  Pages   │  │  Blocks  │  │ Projects │  │  Tasks   │  │
│  │  Table   │  │  Table   │  │  Table   │  │  Table   │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  Habits  │  │  Users   │  │   Tags   │  │  Table   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    SUPABASE SERVICES                         │
│                                                              │
│  ┌──────────────────┐         ┌──────────────────┐         │
│  │  Authentication  │         │     Storage      │         │
│  │  • JWT Tokens    │         │  • File Upload   │         │
│  │  • User Sessions │         │  • CDN Delivery  │         │
│  └──────────────────┘         └──────────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Flow: Creating a Private Page

```
1. USER ACTION
   │
   ├─> User clicks "New Page"
   │
   ▼
2. UI COMPONENT
   │
   ├─> CreatePageDialog opens
   ├─> User enters title
   ├─> User clicks "Create"
   │
   ▼
3. SERVER ACTION
   │
   ├─> createPage(data) called
   ├─> Verify authentication
   ├─> Calculate sort order
   ├─> Create page in database
   │
   ▼
4. DATABASE
   │
   ├─> INSERT INTO pages (...)
   ├─> Return new page record
   │
   ▼
5. RESPONSE
   │
   ├─> Revalidate cache
   ├─> Redirect to new page
   ├─> Show success toast
   │
   ▼
6. PAGE RENDER
   │
   ├─> Load page data
   ├─> Render PageEditor
   ├─> Load blocks (empty)
   └─> Ready for content
```

---

## Data Flow: Adding a Block

```
1. USER ACTION
   │
   ├─> User types "/" in editor
   │
   ▼
2. SLASH MENU
   │
   ├─> Detect "/" character
   ├─> Show slash menu
   ├─> User selects block type
   │
   ▼
3. BLOCK EDITOR
   │
   ├─> Generate temp block ID
   ├─> Add block to local state (optimistic)
   ├─> Call createBlock action
   │
   ▼
4. SERVER ACTION
   │
   ├─> createBlock(data) called
   ├─> Verify page ownership
   ├─> Calculate sort order
   ├─> Create block in database
   │
   ▼
5. DATABASE
   │
   ├─> INSERT INTO blocks (...)
   ├─> Return new block record
   │
   ▼
6. RESPONSE
   │
   ├─> Replace temp ID with real ID
   ├─> Revalidate page
   ├─> Update local state
   └─> Block ready for editing
```

---

## Database Schema Relationships

```
┌─────────────┐
│   Profile   │
│  (User)     │
└──────┬──────┘
       │
       ├──────────────────────────────────────┐
       │                                      │
       ▼                                      ▼
┌─────────────┐                      ┌─────────────┐
│    Pages    │                      │  Projects   │
│             │                      │             │
└──────┬──────┘                      └──────┬──────┘
       │                                    │
       │ 1:N                                │ 1:N
       │                                    │
       ▼                                    ▼
┌─────────────┐                      ┌─────────────┐
│   Blocks    │                      │   Tasks     │
│             │                      │             │
└──────┬──────┘                      └─────────────┘
       │
       │ 1:N
       │
       ├──────────────┬──────────────┐
       │              │              │
       ▼              ▼              ▼
┌──────────┐  ┌──────────┐  ┌──────────┐
│Database  │  │Database  │  │Database  │
│  Views   │  │  Items   │  │Properties│
└──────────┘  └──────────┘  └──────────┘
```

---

## Component Hierarchy: Private Pages

```
PageEditor
│
├─> Title Input
│   └─> Auto-save on change
│
├─> Icon Selector
│   └─> Emoji picker
│
├─> Cover Image
│   └─> Upload/URL input
│
└─> BlockEditor
    │
    ├─> Block List (Sortable)
    │   │
    │   ├─> SortableBlock (for each block)
    │   │   │
    │   │   ├─> BlockWrapper
    │   │   │   └─> Hover actions
    │   │   │
    │   │   └─> BlockRenderer
    │   │       │
    │   │       ├─> TextBlock
    │   │       ├─> HeadingBlock
    │   │       ├─> ListBlock
    │   │       ├─> DatabaseBlock
    │   │       │   │
    │   │       │   ├─> View Switcher
    │   │       │   ├─> TableView
    │   │       │   ├─> BoardView
    │   │       │   ├─> GalleryView
    │   │       │   └─> ItemModal
    │   │       │       │
    │   │       │       ├─> Properties
    │   │       │       └─> Block Editor (nested)
    │   │       │
    │   │       └─> ... other blocks
    │   │
    │   └─> Add Block Button
    │
    └─> SlashMenu
        └─> Block type selector
```

---

## Component Hierarchy: Projects

```
ProjectDatabasePage
│
├─> Page Header
│   ├─> Title
│   └─> Stats
│
└─> ProjectDatabase
    │
    ├─> Toolbar
    │   ├─> ViewSwitcher
    │   ├─> FilterBar
    │   └─> PropertiesPanel
    │
    ├─> View Renderer
    │   │
    │   ├─> TableView
    │   │   ├─> Table Header
    │   │   ├─> Table Rows
    │   │   └─> Inline Editing
    │   │
    │   ├─> BoardView
    │   │   ├─> Columns (by status)
    │   │   ├─> Project Cards
    │   │   └─> Drag & Drop
    │   │
    │   ├─> GalleryView
    │   │   └─> Card Grid
    │   │
    │   ├─> TimelineView
    │   │   ├─> Timeline Header
    │   │   ├─> Project Bars
    │   │   └─> Zoom Controls
    │   │
    │   └─> CalendarView
    │       ├─> Calendar Grid
    │       └─> Project Events
    │
    └─> ProjectDetailsSheet
        ├─> Project Info
        ├─> Tasks List
        └─> Activity Log
```

---

## State Management

```
┌─────────────────────────────────────────────────────────────┐
│                      GLOBAL STATE                            │
│                                                              │
│  ┌──────────────────┐         ┌──────────────────┐         │
│  │   Auth Store     │         │    UI Store      │         │
│  │   (Zustand)      │         │   (Zustand)      │         │
│  │                  │         │                  │         │
│  │  • user          │         │  • theme         │         │
│  │  • session       │         │  • sidebar       │         │
│  │  • isLoading     │         │  • modals        │         │
│  └──────────────────┘         └──────────────────┘         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    FEATURE STATE                             │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         ProjectDatabaseContext                        │  │
│  │         (React Context)                               │  │
│  │                                                        │  │
│  │  • projects                                           │  │
│  │  • viewState                                          │  │
│  │  • filters                                            │  │
│  │  • sorts                                              │  │
│  │  • selection                                          │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    COMPONENT STATE                           │
│                                                              │
│  ┌──────────────────┐         ┌──────────────────┐         │
│  │   BlockEditor    │         │   ItemModal      │         │
│  │   (useState)     │         │   (useState)     │         │
│  │                  │         │                  │         │
│  │  • blocks        │         │  • title         │         │
│  │  • focusedId     │         │  • icon          │         │
│  │  • slashMenu     │         │  • blocks        │         │
│  └──────────────────┘         └──────────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

---

## Authentication Flow

```
1. USER VISITS APP
   │
   ├─> Middleware checks auth
   │
   ▼
2. SUPABASE AUTH
   │
   ├─> Check JWT token
   │
   ├─> Valid? ──Yes──> Continue to app
   │
   └─> Invalid? ──No──> Redirect to /login
                         │
                         ▼
                    3. LOGIN PAGE
                         │
                         ├─> User enters credentials
                         ├─> Or clicks "Sign in with Google"
                         │
                         ▼
                    4. SUPABASE AUTH
                         │
                         ├─> Verify credentials
                         ├─> Create session
                         ├─> Set JWT token
                         │
                         ▼
                    5. REDIRECT
                         │
                         └─> Redirect to /today
```

---

## Caching Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                    CACHING LAYERS                            │
│                                                              │
│  1. NEXT.JS CACHE                                           │
│     ├─> Static pages (build time)                           │
│     ├─> Dynamic pages (on-demand)                           │
│     └─> API routes (configurable)                           │
│                                                              │
│  2. UNSTABLE_CACHE                                          │
│     ├─> Server action results                               │
│     ├─> Tagged for invalidation                             │
│     └─> TTL: 3600s (1 hour)                                 │
│                                                              │
│  3. REACT QUERY (Optional)                                  │
│     ├─> Client-side cache                                   │
│     ├─> Automatic refetching                                │
│     └─> Optimistic updates                                  │
│                                                              │
│  4. BROWSER CACHE                                           │
│     ├─> Static assets                                       │
│     ├─> Images                                              │
│     └─> Fonts                                               │
└─────────────────────────────────────────────────────────────┘

INVALIDATION STRATEGY:
├─> On mutation: revalidateTag()
├─> On navigation: revalidatePath()
└─> Manual: router.refresh()
```

---

## Performance Optimization

```
┌─────────────────────────────────────────────────────────────┐
│                  OPTIMIZATION TECHNIQUES                     │
│                                                              │
│  1. CODE SPLITTING                                          │
│     ├─> Dynamic imports                                     │
│     ├─> Route-based splitting                               │
│     └─> Component lazy loading                              │
│                                                              │
│  2. IMAGE OPTIMIZATION                                      │
│     ├─> Next.js Image component                             │
│     ├─> Automatic WebP conversion                           │
│     └─> Lazy loading                                        │
│                                                              │
│  3. DATABASE OPTIMIZATION                                   │
│     ├─> Indexed columns                                     │
│     ├─> Efficient queries                                   │
│     ├─> Connection pooling                                  │
│     └─> Query caching                                       │
│                                                              │
│  4. RENDERING OPTIMIZATION                                  │
│     ├─> Server Components (default)                         │
│     ├─> Client Components (when needed)                     │
│     ├─> React.memo for expensive components                 │
│     └─> useMemo/useCallback for expensive computations      │
│                                                              │
│  5. BUNDLE OPTIMIZATION                                     │
│     ├─> Tree shaking                                        │
│     ├─> Minification                                        │
│     ├─> Compression (gzip/brotli)                           │
│     └─> CDN delivery                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## Error Handling

```
┌─────────────────────────────────────────────────────────────┐
│                    ERROR HANDLING FLOW                       │
│                                                              │
│  1. CLIENT-SIDE ERRORS                                      │
│     │                                                        │
│     ├─> Error Boundary                                      │
│     │   ├─> Catch React errors                              │
│     │   ├─> Show fallback UI                                │
│     │   └─> Log to console                                  │
│     │                                                        │
│     └─> Try-Catch Blocks                                    │
│         ├─> Catch async errors                              │
│         ├─> Show toast notification                         │
│         └─> Rollback optimistic updates                     │
│                                                              │
│  2. SERVER-SIDE ERRORS                                      │
│     │                                                        │
│     ├─> Server Action Try-Catch                             │
│     │   ├─> Catch database errors                           │
│     │   ├─> Return error response                           │
│     │   └─> Log to server console                           │
│     │                                                        │
│     └─> Prisma Error Handling                               │
│         ├─> P2002: Unique constraint                        │
│         ├─> P2003: Foreign key constraint                   │
│         ├─> P2025: Record not found                         │
│         └─> Return user-friendly messages                   │
│                                                              │
│  3. NETWORK ERRORS                                          │
│     │                                                        │
│     └─> Retry Logic                                         │
│         ├─> Exponential backoff                             │
│         ├─> Max 3 retries                                   │
│         └─> Show error after retries                        │
└─────────────────────────────────────────────────────────────┘
```

---

## Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    SECURITY LAYERS                           │
│                                                              │
│  1. AUTHENTICATION                                          │
│     ├─> Supabase Auth (JWT)                                 │
│     ├─> Session management                                  │
│     └─> Secure cookies                                      │
│                                                              │
│  2. AUTHORIZATION                                           │
│     ├─> Row Level Security (RLS)                            │
│     ├─> Server action checks                                │
│     └─> Middleware protection                               │
│                                                              │
│  3. INPUT VALIDATION                                        │
│     ├─> Zod schemas                                         │
│     ├─> Server-side validation                              │
│     └─> Client-side validation                              │
│                                                              │
│  4. XSS PREVENTION                                          │
│     ├─> React auto-escaping                                 │
│     ├─> DOMPurify for HTML                                  │
│     └─> Content Security Policy                             │
│                                                              │
│  5. CSRF PROTECTION                                         │
│     ├─> Next.js built-in                                    │
│     ├─> SameSite cookies                                    │
│     └─> Origin checking                                     │
│                                                              │
│  6. RATE LIMITING                                           │
│     ├─> API route limits                                    │
│     ├─> Server action limits                                │
│     └─> Per-user quotas                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         VERCEL                               │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Next.js Application                      │  │
│  │                                                        │  │
│  │  • Server Components                                  │  │
│  │  • API Routes                                         │  │
│  │  • Server Actions                                     │  │
│  │  • Static Assets                                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                   Edge Network                        │  │
│  │                                                        │  │
│  │  • CDN                                                │  │
│  │  • Edge Functions                                     │  │
│  │  • Image Optimization                                 │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                       SUPABASE                               │
│                                                              │
│  ┌──────────────────┐         ┌──────────────────┐         │
│  │   PostgreSQL     │         │     Storage      │         │
│  │    Database      │         │   (File CDN)     │         │
│  └──────────────────┘         └──────────────────┘         │
│                                                              │
│  ┌──────────────────┐         ┌──────────────────┐         │
│  │  Authentication  │         │    Realtime      │         │
│  │   (JWT/OAuth)    │         │   (WebSockets)   │         │
│  └──────────────────┘         └──────────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Takeaways

### Architecture Strengths
✅ Modern, scalable tech stack  
✅ Type-safe with TypeScript & Prisma  
✅ Server-side rendering for performance  
✅ Component-based for reusability  
✅ Secure authentication & authorization  

### Areas for Improvement
⚠️ Consolidate dual block editors  
⚠️ Add comprehensive error handling  
⚠️ Implement rate limiting  
⚠️ Add monitoring & logging  
⚠️ Optimize database queries  

### Next Steps
1. Fix critical issues (data persistence)
2. Complete missing features (views)
3. Optimize performance
4. Add monitoring
5. Launch!

---

**This architecture is solid and ready to scale!** 🚀

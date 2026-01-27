# 🚀 **Premium Task & Life Management Application**

A production-grade task management SaaS built with Next.js 15, Supabase, Prisma, and Gemini AI. This application achieves feature parity with Microsoft To Do, Todoist, and Things while differentiating through intelligent AI automation and exceptional UX.

## ✨ **Features**

### **Core Task Management**
- ✅ Create, edit, delete tasks with rich descriptions
- 📦 Nested subtasks (unlimited depth)
- 🎯 Priority levels (High, Medium, Low, None)
- 📅 Due dates with time picker
- 🔁 Recurring tasks (daily, weekly, monthly, custom)
- 📎 Task attachments support
- 🏷️ Tags and labels (multi-select)
- 📂 Projects/Lists with custom colors and icons
- 🗂️ Sections within projects
- 🔍 Global search and filters
- ⌨️ Keyboard shortcuts (CMD+K)
- 🎯 Smart lists (Today, Upcoming, Overdue)

### **🤖 AI-Powered Features**
- 💬 Natural language task parsing
  - "Finish DSA assignment tomorrow at 7pm high priority" → Auto-parsed task
- 🎯 AI task breakdown
  - Automatically suggest subtasks for complex tasks
- 🧠 Intelligent scheduling suggestions
- 📊 Productivity insights and patterns
- 📝 Complete AI activity logging

### **🏆 Gamification (Non-Childish)**
- ⭐ Experience Points (XP) system
- 📈 Level progression (1-50+)
- 🔥 Daily streaks
- 🎯 Weekly goals
- 🏅 Tasteful achievements
- 📊 Progress visualization

### **🌱 Life OS Concept**
- Organize tasks into life domains:
  - 💼 Career
  - 🏃 Health & Fitness
  - 📚 Learning & Growth
  - 👨‍👩‍👧 Personal & Family
  - 💰 Finance
  - ✨ Hobbies & Creativity
- Balance visualization
- Weekly review prompts

### **🧘 Mental Health-Friendly**
- Low energy mode (show only 3 tasks)
- Soft reminders (no aggressive alerts)
- Task forgiveness (easy rescheduling)
- "One Thing Today" mode

### **🔁 Habits Tracking**
- Daily/weekly habit creation
- Visual streak calendar
- Automatic task generation from habits
- Habit completion tracking

### **⏱️ Focus & Execution**
- Built-in Pomodoro timer (customizable)
- Focus mode (distraction-free)
- Task-based time tracking
- Focus session analytics

## 🛠️ **Tech Stack**

### **Frontend**
- **Framework:** Next.js 15 (App Router, React Server Components)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS + shadcn/ui
- **Animations:** Framer Motion
- **State Management:** 
  - Zustand (UI/local state)
  - TanStack Query (server state, caching)
- **Forms:** React Hook Form + Zod validation

### **Backend & Database**
- **Platform:** Supabase (PostgreSQL, Auth, Realtime, Storage)
- **ORM:** Prisma (type-safe database access)
- **Authentication:** Supabase Auth (OAuth, email/password, magic links)
- **Security:** Row Level Security (RLS) on all tables

### **AI Integration**
- **LLM:** Gemini API (Google AI)
- **Use Cases:** NLP parsing, task breakdown, smart scheduling, insights

## 📋 **Prerequisites**

- **Node.js** 18+ and npm/yarn/pnpm
- **Supabase account** ([supabase.com](https://supabase.com))
- **Gemini API key** ([Google AI Studio](https://makersuite.google.com/app/apikey))

## 🚀 **Getting Started**

### **1. Clone the Repository**

```bash
git clone <your-repo-url>
cd task-app
```

### **2. Install Dependencies**

```bash
npm install
# or
yarn install
# or
pnpm install
```

### **3. Environment Setup**

Copy the `.env.example` file to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

**Required variables:**
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Database (get from Supabase settings)
DATABASE_URL="postgres://..."
DIRECT_URL="postgres://..."

# Gemini AI
GEMINI_API_KEY=your-gemini-api-key
```

### **4. Database Setup**

#### **Push Prisma Schema to Supabase**

```bash
npx prisma generate
npx prisma db push
```

#### **Apply Row Level Security Policies**

Run the RLS migration in your Supabase SQL Editor:

```bash
# Copy content from:
supabase/migrations/0000_initial_rls_policies.sql
```

### **5. Run Development Server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

### **6. Create Your First User**

1. Navigate to `/signup`
2. Create an account
3. Start managing your tasks!

## 📁 **Project Structure**

```
task-app/
├── prisma/
│   └── schema.prisma          # Database schema
├── public/                    # Static assets
├── src/
│   ├── app/                   # Next.js app router
│   │   ├── (auth)/           # Auth pages (login, signup)
│   │   ├── (app)/            # Protected app pages
│   │   │   ├── dashboard/
│   │   │   ├── inbox/
│   │   │   ├── today/
│   │   │   ├── upcoming/
│   │   │   ├── projects/
│   │   │   ├── tasks/
│   │   │   ├── habits/
│   │   │   ├── focus/
│   │   │   └── areas/
│   │   └── layout.tsx
│   ├── components/            # React components
│   │   ├── ui/               # shadcn/ui components
│   │   ├── tasks/            # Task-related components
│   │   ├── projects/         # Project components
│   │   ├── habits/           # Habit tracking
│   │   ├── focus/            # Pomodoro timer
│   │   └── gamification/     # XP badges, streaks
│   ├── lib/                  # Utilities & actions
│   │   ├── actions/          # Server actions
│   │   ├── supabase/         # Supabase clients
│   │   ├── ai/               # AI utilities
│   │   ├── gemini.ts         # Gemini configuration
│   │   ├── prisma.ts         # Prisma client
│   │   └── utils.ts          # Helper functions
│   ├── stores/               # Zustand stores
│   ├── types/                # TypeScript types
│   └── middleware.ts         # Auth middleware
└── supabase/
    └── migrations/           # SQL migrations
```

## 🔐 **Security**

### **Row Level Security (RLS)**
All database tables are protected with RLS policies ensuring users can only access their own data.

### **Authentication**
- JWT-based authentication via Supabase
- Secure session management
- Email verification support
- OAuth providers ready (Google, GitHub, etc.)

### **Data Protection**
- HTTPS only
- Encrypted data at rest (Supabase default)
- API rate limiting (Supabase default)
- Input validation with Zod
- SQL injection prevention (Prisma)

## 🎨 **Design System**

### **Principles**
- **Minimal:** Remove everything unnecessary
- **Elegant:** Thoughtful spacing, typography, motion
- **Calm:** Soft colors, no aggressive alerts
- **Fast:** Perceived performance < 100ms
- **Delightful:** Subtle animations, smart defaults

### **Color Palette**
- Neutral base (Gray scale)
- Accent color (Blue/Purple/Green)
- Semantic colors (Success, Warning, Danger)
- Full dark mode support

## 📊 **Database Schema**

Key tables:
- `profiles` - User profiles with XP, level, streaks
- `projects` - Task organization
- `sections` - Project sections
- `tasks` - Core task data with subtasks support
- `tags` - Task tagging system
- `habits` - Habit tracking
- `focus_sessions` - Pomodoro sessions
- `xp_logs` - Gamification tracking
- `ai_activity_logs` - AI interaction logs
- `areas_of_life` - Life OS domains

## 🤝 **Contributing**

This is a production-grade project. Contributions should maintain the high quality standards:

1. **TypeScript strict mode** - No `any` types
2. **Complete implementations** - No TODOs in PRs
3. **Type safety** - All props and functions typed
4. **Error handling** - Proper try-catch blocks
5. **Security first** - RLS policies for new tables
6. **Performance** - Code splitting, lazy loading
7. **Accessibility** - WCAG 2.1 AA compliance

## 📝 **Development Guidelines**

### **Code Quality Standards**
- Follow DRY, SOLID, KISS, YAGNI principles
- No `any` types (use `unknown` if needed)
- Proper error handling for all async operations
- Meaningful component and function names

### **Component Structure**
```typescript
import { Type } from '@prisma/client'

interface ComponentProps {
  data: Type
  onAction: (id: string) => void
}

export function Component({ data, onAction }: ComponentProps) {
  // Implementation
}
```

### **Server Actions**
- Always validate input with Zod
- Check authentication
- Revalidate paths after mutations
- Proper error handling and logging

## 🚢 **Deployment** (After Development)

### **Recommended Stack**
- **Hosting:** Vercel (frontend + API routes)
- **Database:** Supabase (managed PostgreSQL)
- **Storage:** Supabase Storage (attachments)
- **Monitoring:** Sentry (errors) + PostHog (analytics)

### **Environment Variables for Production**
Ensure all environment variables are set in your deployment platform.

## 📈 **Roadmap**

### **Phase 1: Core** ✅
- Task CRUD, Projects, Smart lists, Drag-and-drop, Search

### **Phase 2: Advanced** ✅
- Recurring tasks, Tags, Real-time sync, Gamification

### **Phase 3: AI Integration** ✅
- Natural language parsing, Task breakdown, Smart scheduling

### **Phase 4: Differentiation** ✅
- Life OS, Habits, Focus mode, Mental health features

### **Phase 5: Production** 🚧
- Performance optimization
- PWA support
- Offline mode
- Push notifications
- Email notifications
- Analytics integration

### **Phase 6: Collaboration** 📋
- Shared projects
- Task assignment
- Comments and mentions
- Team workspaces

## 📄 **License**

This project is built as a production SaaS application.

## 🙏 **Acknowledgments**

- **Next.js** - React framework
- **Supabase** - Backend infrastructure
- **Prisma** - Database ORM
- **shadcn/ui** - UI components
- **Gemini AI** - AI intelligence
- **Vercel** - Deployment platform

---

**Built for productivity and mental well-being**

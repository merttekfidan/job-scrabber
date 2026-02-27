# HuntIQ v2.0 — Full Implementation Roadmap

## Executive Summary

HuntIQ is an AI-powered job application tracker with a Chrome extension. The current codebase has grown organically and reached a point where adding features or fixing bugs creates new issues. This plan defines a structured, phased migration from the current fragile architecture to a robust, maintainable system.

**Approach**: Hybrid — rewrite critical modules from scratch, preserve stable backend logic.
**Key decisions**: TypeScript, Shadcn/UI, React Query, URL-based routing, modular file structure.
**Risk mitigation**: Each phase produces a working system. No big-bang rewrite.
**Total estimate**: 4 weeks (17-22 working days)

---

## Current State — What's Broken and Why

### Architecture Debt

- **God Component**: `components/Dashboard.js` (506 lines) manages 15+ state variables, all data fetching, all mutations, all UI rendering, and acts as a client-side router via `useState`
- **No data layer**: Every component does its own `fetch()` + `useState()` + `useEffect()` cycle. No caching, no sync, no optimistic updates
- **State-based routing**: Views switch via `useState('dashboard' | 'applications' | 'coach')` instead of URL routes. Browser back button, deep links, and bookmarks are non-functional
- **No TypeScript**: Zero compile-time type safety across ~6,000 lines of JavaScript
- **No component library**: Custom CSS classes (`glass-card`, `btn`, `modal`) mixed with Tailwind, inline styles scattered throughout
- **Duplicated utilities**: `parseJson()`, `formatDate()`, `showToast()` independently written in 3+ files

### Auth System (Critical — see AUTH_REBUILD_PLAN.md)

- Extension has no logout mechanism
- Cookie domain (`.huntiq.work`) blocks extension cookie access in production
- Stale session state in extension after web app logout
- Path typo in auth callback (`'login'` instead of `'/login'`)
- Duplicate key in cookie config (`sameSite` written twice)
- Extension bypasses AI provider pool system (uses `callGroqAPI` instead of `callAIWithPool`)

### Data Flow Chaos

- `ApplicationDetailClient.js` (599 lines) re-implements data fetching and mutations already present in `Dashboard.js`
- JSONB fields arrive as strings sometimes, objects other times — each component parses independently
- No cache invalidation: updating an application status does not refresh stats
- No error recovery: failed API calls show a toast and silently discard the operation

---

## Phase 0: Foundation Setup

**Duration**: 1 day | **Risk**: Low | **Dependency**: None

### What We're Doing

Setting up the infrastructure that every subsequent phase depends on. No feature changes, no visual changes. The app continues to work exactly as before.

### Tasks

#### 0.1 — TypeScript Configuration

- Rename `jsconfig.json` to `tsconfig.json` with strict mode enabled
- Configure path aliases: `@/*` maps to project root
- Set `allowJs: true` so existing `.js` files continue to work during incremental migration
- All new files must be `.ts` / `.tsx`

#### 0.2 — Install Core Dependencies

```
@tanstack/react-query            # Server state management + caching
@tanstack/react-query-devtools   # Query debugging in development
shadcn/ui                        # Component library (via npx shadcn@latest init)
zustand                          # Lightweight global UI state
```

#### 0.3 — Shadcn/UI Initialization

- Run `npx shadcn@latest init` (dark theme, New York style)
- Install base components: Button, Card, Badge, Input, Select, Dialog, Sheet, Tabs, Skeleton, DropdownMenu, Separator, ScrollArea
- Install Sonner (toast library) via Shadcn

#### 0.4 — React Query Provider

- Create `providers/query-provider.tsx` wrapping the app with `QueryClientProvider`
- Default config: `staleTime: 5 minutes`, `retry: 1`, `refetchOnWindowFocus: true`
- Add devtools in development mode
- Integrate in `app/layout.tsx`

#### 0.5 — Zustand Store for Global UI

- Create `stores/ui-store.ts` for cross-cutting concerns
- Toast notifications (replaces 3 separate custom toast implementations)
- Modal state management

### Success Criteria

- `npm run build` succeeds with zero errors
- App works identically to before
- New `.tsx` files can be created and imported alongside existing `.js`
- React Query devtools visible in development

---

## Phase 1: Data Layer (THE PRIORITY)

**Duration**: 3-4 days | **Risk**: Medium | **Dependency**: Phase 0

This is the most important phase. It creates the foundation that eliminates data flow chaos.

### What We're Doing

Building a typed data pipeline: `Component → Hook → API Client → API Route`. Components will never call `fetch()` directly again.

### 1.1 — TypeScript Types (`types/`)

All data shapes used across the app, derived from existing Zod schemas and the PostgreSQL schema:

**`types/application.ts`**
- `Application` — full application record (25+ fields)
- `ApplicationStatus` — `'Applied' | 'Interview Scheduled' | 'Offer Received' | 'Rejected' | 'Withdrawn'`
- `ApplicationFilters` — filter parameters
- `ApplicationListResponse` — paginated response
- `CreateApplicationInput` / `UpdateApplicationInput` — mutation inputs

**`types/cv.ts`**
- `CvData`, `CvAnalysis`, `SwotAnalysis`, `PersonalizedPrep`

**`types/ai.ts`**
- `AIProvider`, `AIProviderConfig`, `CompanyInsights`, `HiringFramework`

**`types/user.ts`**
- `User`, `UserProfile`, `Session`

**`types/api.ts`**
- `ApiResponse<T>` — generic success/error wrapper
- `ApiError` — structured error
- `PaginatedResponse<T>` — generic paginated response

### 1.2 — Typed API Client (`lib/api-client.ts`)

Single, typed fetch wrapper with:
- Base URL handling
- Auth header injection
- Response parsing and error extraction
- HTTP status handling (401 → redirect to login, 429 → rate limit toast, 500 → error boundary)
- Development-mode request/response logging

```typescript
// Usage:
const apps = await apiClient.get<ApplicationListResponse>('/api/filter', { params: filters });
const saved = await apiClient.post<Application>('/api/save', { body: data });
await apiClient.delete<void>(`/api/applications/${id}`);
```

### 1.3 — React Query Hooks (`hooks/`)

Each hook encapsulates one data domain:

**`use-applications.ts`**
- `useApplications(filters)` — infinite query with pagination
- `useApplication(id)` — single detail
- `useCreateApplication()` — mutation → invalidates list + stats
- `useUpdateApplication()` — mutation → optimistic update + invalidation
- `useDeleteApplication()` — mutation → cache removal + stats invalidation

**`use-stats.ts`**
- `useStats()` — dashboard statistics
- `useSmartAnalytics()` — advanced metrics

**`use-cv.ts`**
- `useCv()` — active CV
- `useUploadCv()` — upload mutation
- `useAnalyzeJob(appId)` — SWOT analysis mutation

**`use-ai.ts`**
- `useCompanyInsights()` — insights generation
- `useHiringFrameworks()` — framework generation

**`use-companies.ts`** — company list for filters

**`use-profile.ts`** — user profile + settings

### 1.4 — Cache Invalidation Strategy

| Mutation | Invalidates |
|----------|-------------|
| `updateApplication` (status change) | `['applications']`, `['stats']`, `['application', id]` |
| `updateApplication` (other fields) | `['application', id]` + optimistic list update |
| `deleteApplication` | Removes from `['applications']` cache, invalidates `['stats']` |
| `createApplication` | `['applications']`, `['stats']`, `['companies']` |
| `uploadCv` | `['cv']` |
| `analyzeJob` | `['application', id]` |

### Success Criteria

- Every data operation goes through a React Query hook
- Cache keys visible in devtools
- Filter changes trigger automatic re-fetch
- Status update in one view reflects in all others (list, detail, stats, kanban)

---

## Phase 2: Routing Restructure

**Duration**: 2-3 days | **Risk**: Medium-High | **Dependency**: Phase 1

### What We're Doing

Replacing state-based view switching with proper Next.js App Router routes. Every view gets a real URL.

### 2.1 — Route Group Layout

`app/(dashboard)/layout.tsx`:
- Auth check (redirect to `/login` if unauthenticated)
- QueryClientProvider wrapper
- Shared header with navigation (Dashboard / Kanban / Coach)
- Responsive sidebar for upcoming interviews

### 2.2 — New Pages

| URL | Replaces | Source |
|-----|----------|--------|
| `/dashboard` | `view === 'dashboard'` | Stats + Application List |
| `/kanban` | `view === 'applications'` | Kanban Board |
| `/coach` | `view === 'coach'` | CV Upload |
| `/applications/[id]` | `selectedJobId` state | Job Detail View |

### 2.3 — URL State for Filters

```typescript
// BEFORE: lost on navigation
const [filters, setFilters] = useState({ status: '', search: '' });

// AFTER: persists in URL
const searchParams = useSearchParams();
const filters = {
  status: searchParams.get('status') || '',
  search: searchParams.get('search') || '',
  sortBy: searchParams.get('sort') || 'date_desc',
};
// URL: /dashboard?status=Applied&sort=date_desc
```

### 2.4 — Redirect Handling

- `/` → authenticated: redirect to `/dashboard`; unauthenticated: show landing page
- `app/page.tsx` only renders marketing landing page (no more conditional Dashboard)
- All deep links work: `/applications/abc-123` loads directly

### Success Criteria

- Every view has its own URL
- Browser back/forward buttons work
- Filters survive page refresh
- `/applications/[id]` is directly accessible and shareable

---

## Phase 3: Component Decomposition

**Duration**: 3-4 days | **Risk**: Medium | **Dependency**: Phase 1 + 2

### What We're Doing

Breaking God Components into single-responsibility components that source data from hooks.

### 3.1 — Dashboard.js (506 lines) → Deleted

| Current Section | Becomes | Estimated Size |
|----------------|---------|----------------|
| Header (L270-347) | `components/layout/DashboardHeader.tsx` | ~80 lines |
| Stats (L372-379) | `<StatsGrid>` (already exists) | 0 |
| Data fetching (L63-116) | `useApplications()` hook | 0 |
| All handlers (L125-252) | `useUpdateApplication()` + `useDeleteApplication()` hooks | 0 |
| Delete modal (L472-488) | Shadcn `<AlertDialog>` | ~20 lines |
| Toast (L498-503) | Sonner (global, zero per-component code) | 0 |

**Result**: Dashboard page replacement is ~60 lines. `Dashboard.js` is deleted.

### 3.2 — ApplicationDetailClient.js (599 lines) → 9 Components

| New Component | Responsibility | Size |
|--------------|----------------|------|
| `ApplicationHeader.tsx` | Title, company, status, metadata grid | ~80 |
| `InterviewTimeline.tsx` | Interview stages | ~100 |
| `NotesEditor.tsx` | General notes with auto-save | ~40 |
| `CompanyInsightsPanel.tsx` | Strategic focus, salary intel, culture | ~120 |
| `SwotAnalysis.tsx` | SWOT grid | ~60 |
| `JobDescription.tsx` | Markdown job content | ~30 |
| `TechStackPanel.tsx` | Tech stack tags | ~30 |
| `SkillsPanel.tsx` | Required/preferred skills | ~30 |
| `RedFlagsPanel.tsx` | Negative signals | ~30 |

### 3.3 — Utility Consolidation

Single `lib/utils.ts` replaces all duplicates:

```typescript
export function safeParseJson<T>(value: string | T | null, fallback: T): T
export function formatDate(dateString: string | null): string
export function getStatusColor(status: ApplicationStatus): string
export function formatSalary(salary: string, location: string): string
```

### Success Criteria

- No component exceeds 150 lines
- Zero `parseJson` duplication
- `Dashboard.js` and `ApplicationDetailClient.js` deleted
- All components use hooks, not prop drilling

---

## Phase 4: Shadcn/UI Migration

**Duration**: 2-3 days | **Risk**: Low-Medium | **Dependency**: Phase 3

### Replacement Map

| Current Custom | Shadcn Replacement |
|---------------|-------------------|
| `.glass-card` CSS | `<Card>` with dark variant |
| `.btn` / `.btn-secondary` / `.btn-danger` | `<Button variant="default/secondary/destructive">` |
| `.modal` / `.modal-overlay` | `<Dialog>` / `<AlertDialog>` |
| Custom toast + setTimeout | Sonner toast |
| Custom select | `<Select>` |
| Custom tabs | `<Tabs>` |
| Custom skeleton | `<Skeleton>` |
| Custom badges | `<Badge>` |
| Custom dropdown | `<DropdownMenu>` |

### Theme

- Extend Shadcn with existing dark palette
- Preserve purple/blue gradient accent
- CSS variables for `--background`, `--foreground`, `--primary`

### Success Criteria

- `globals.css` under 100 lines
- No custom `.btn`, `.modal`, `.glass-card` classes remain
- UI looks identical or better
- All elements keyboard-accessible

---

## Phase 5: Backend TypeScript Migration

**Duration**: 2 days | **Risk**: Low | **Dependency**: Phase 1

### Migration Order

**Priority 1 — Shared libraries:**
`lib/db.js` → `lib/db.ts`, `lib/validations.js` → `lib/validations.ts`, `lib/config.js` → `lib/config.ts`, `lib/rate-limit.js` → `lib/rate-limit.ts`, `lib/email.js` → `lib/email.ts`

**Priority 2 — AI layer:**
`lib/ai.js` → `lib/ai/parser.ts`, `lib/ai-router.js` → `lib/ai/router.ts`, `lib/prompts.js` → `lib/ai/prompts.ts`

**Priority 3 — API routes:**
All 19 route files `.js` → `.ts` with typed request/response

**Priority 4 — Auth:**
`auth.js` → `auth.ts`, `auth.config.js` → `auth.config.ts`, `middleware.js` → `middleware.ts`

---

## Phase 6: Auth System Rebuild

**Duration**: 2 days | **Risk**: High | **Dependency**: Phase 5

See dedicated plan: `docs/AUTH_REBUILD_PLAN.md`

---

## Phase 7: Polish and Hardening

**Duration**: 2-3 days | **Risk**: Low

- Error boundaries on every major section
- Loading skeletons for all data-dependent views
- Empty states for zero-data scenarios
- 404 page for invalid application IDs
- Rate limit feedback in UI
- Accessibility audit (keyboard nav, ARIA labels)
- Performance audit (bundle size, Lighthouse)
- Remove all `console.log` and dead code

---

## Timeline Summary

| Phase | Duration | Parallelizable With |
|-------|----------|-------------------|
| Phase 0: Foundation | 1 day | — |
| Phase 1: Data Layer | 3-4 days | — |
| Phase 2: Routing | 2-3 days | Phase 5 |
| Phase 3: Components | 3-4 days | Phase 4 |
| Phase 4: Shadcn/UI | 2-3 days | Phase 3 |
| Phase 5: Backend TS | 2 days | Phase 2 |
| Phase 6: Auth Rebuild | 2 days | — |
| Phase 7: Polish | 2-3 days | — |

**Total: ~17-22 working days (~4 weeks)**

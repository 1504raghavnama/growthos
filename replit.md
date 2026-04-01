# Workspace

## Overview

pnpm workspace monorepo using TypeScript. This is **GrowthOS** — an autonomous digital marketing platform for Indian SMBs.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **AI**: Gemini via Replit AI Integrations (`lib/integrations-gemini-ai`, model: `gemini-2.0-flash`)
- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui + Recharts + wouter

## Product: GrowthOS

GrowthOS is a full-stack autonomous digital marketing platform for Indian SMBs. Key features:
- Business onboarding with 3 demo businesses (Priya's Boutique, TechEdge Academy, Spice Garden Restaurant)
- AI-powered content calendar generation (7-day weekly plan)
- AI caption generator with 3 style variants
- Indian festival trend detector with campaign ideas
- Ad campaign recommendation engine (Meta/Google Ads)
- Performance dashboard with simulated analytics + Recharts charts
- Gemini AI integration with automatic fallback to hardcoded mock data

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server (GrowthOS routes + health)
│   └── growthos/           # React+Vite frontend
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   ├── db/                 # Drizzle ORM schema + DB connection
│   └── integrations-gemini-ai/  # Gemini AI integration (via Replit AI Integrations)
├── scripts/                # Utility scripts
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references. This means:

- **Always typecheck from the root** — run `pnpm run typecheck` (which runs `tsc --build --emitDeclarationOnly`). This builds the full dependency graph so that cross-package imports resolve correctly. Running `tsc` inside a single package will fail if its dependencies haven't been built yet.
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck; actual JS bundling is handled by esbuild/tsx/vite...etc, not `tsc`.
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array. `tsc --build` uses this to determine build order and skip up-to-date packages.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes live in `src/routes/` and use `@workspace/api-zod` for validation and `@workspace/db` for persistence.

- Entry: `src/index.ts` — reads `PORT`, starts Express
- App setup: `src/app.ts` — mounts CORS, JSON/urlencoded parsing, routes at `/api`
- Routes: `src/routes/index.ts` mounts sub-routers; health at `/api/healthz`
- GrowthOS routes: `src/routes/growthos/index.ts` — all 6 endpoints at `/api/growthos/`
- Gemini integration: `src/lib/gemini.ts` — `callGemini()` wrapper with auto-fallback
- Fallback data: `src/lib/fallbackData.ts` — comprehensive mock responses
- Festival data: `src/lib/festivals.ts` — Indian festival calendar
- Depends on: `@workspace/db`, `@workspace/api-zod`, `@workspace/integrations-gemini-ai`
- **Important**: `@google/*` must NOT be in the esbuild externals list (it should be bundled)

### `artifacts/growthos` (`@workspace/growthos`)

React+Vite frontend. Single-page app with wouter routing.

- Entry: `src/main.tsx`, App: `src/App.tsx`
- Sidebar: `src/components/Sidebar.tsx` — dark navy sidebar with nav links
- Pages:
  - `/` → `src/pages/onboarding.tsx` — business form + 3 demo quick-fills
  - `/dashboard` → `src/pages/dashboard.tsx` — profile summary + quick actions
  - `/calendar` → `src/pages/calendar.tsx` — 7-day content calendar grid
  - `/captions` → `src/pages/captions.tsx` — AI caption generator
  - `/festivals` → `src/pages/festivals.tsx` — Indian festival trend detector
  - `/ads` → `src/pages/ads.tsx` — ad campaign recommendations
  - `/performance` → `src/pages/performance.tsx` — Recharts analytics dashboard
- localStorage key: `"businessProfileId"` — stores the active business profile ID

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL.

- `src/schema/business-profiles.ts` — `business_profiles` table
- `drizzle.config.ts` — Drizzle Kit config (requires `DATABASE_URL`)

### `lib/api-spec` (`@workspace/api-spec`)

OpenAPI 3.1 spec with 6 GrowthOS endpoints + health. Run codegen: `pnpm --filter @workspace/api-spec run codegen`

GrowthOS endpoints:
- `POST /growthos/analyze-business-profile`
- `GET /growthos/business-profile/{id}`
- `POST /growthos/generate-weekly-calendar`
- `POST /growthos/generate-captions`
- `POST /growthos/festival-trends`
- `POST /growthos/ad-recommendations`
- `POST /growthos/performance-metrics`

### `lib/api-client-react` (`@workspace/api-client-react`)

Generated React Query hooks. Key hooks: `useAnalyzeBusinessProfile`, `useGetBusinessProfile`, `useGenerateWeeklyCalendar`, `useGenerateCaptions`, `useGetFestivalTrends`, `useGetAdRecommendations`, `useGetPerformanceMetrics`.

### `lib/integrations-gemini-ai` (`@workspace/integrations-gemini-ai`)

Gemini AI client via Replit AI Integrations. Uses `AI_INTEGRATIONS_GEMINI_BASE_URL` and `AI_INTEGRATIONS_GEMINI_API_KEY` env vars. Model: `gemini-2.0-flash`.

### `scripts` (`@workspace/scripts`)

Utility scripts. Run via `pnpm --filter @workspace/scripts run <script>`.

## Indian Market Features

- All currency displayed in ₹ (Indian Rupee)
- Indian festival calendar: Diwali, Holi, Durga Puja, Eid, Christmas, Republic Day, etc.
- Demo businesses tailored for Indian market segments
- Hashtag suggestions in Hindi + English mix
- IST timezone references in content calendar

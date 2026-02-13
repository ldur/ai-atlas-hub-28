

# AI Tool Atlas – Implementation Plan

## Overview
An internal webapp where employees can anonymously share which AI tools and models they use, with survey collection, aggregated insights, a managed tool catalog, recommended stack, and a learning feed. No login required – users identify via a self-chosen nickname stored in localStorage. Admin access is protected by a secret code.

## Backend: Lovable Cloud (Supabase)

The app needs a PostgreSQL database to store surveys, tools, evaluations, catalog entries, and learning content. We'll use Lovable Cloud for this.

### Database Tables
- **user_aliases** – nickname + uuid (linked to submissions)
- **submissions** – survey responses (tools, models, use cases, time saved, risk, pain points)
- **tools** – AI tool registry (name, category, vendor, link)
- **models** – AI model registry (name, provider, modality)
- **evaluations** – admin decisions per tool/model (status: Standard/Allowed/Not Allowed/Trial, scores, rationale, version)
- **catalog_entries** – rich entries with best-for, example prompts, security guidance, do/don't
- **learning_items** – markdown content (tips, case studies, prompt packs, guidelines)
- **votes** – anonymous likes on tools or learning items (nice-to-have)

RLS policies will ensure no PII is exposed and admin operations require a verified admin token.

## Pages & Features

### 1. Onboarding (Landing Page)
- First-time visitors pick or auto-generate a nickname
- Nickname saved to localStorage; alias record created in DB
- Returning visitors are greeted by name
- Clear messaging: no tracking, no login

### 2. Survey (Kartlegging)
- Short, guided form (~5 min):
  - Tools used (multi-select from known list + freetext)
  - Models used (multi-select + "don't know")
  - Use cases (multi-select: coding, docs, analysis, customer dialog, design/media, automation)
  - Time saved per week (0 / 1–2 / 3–5 / 5+)
  - Sensitive data risk (never / unsure / yes)
  - Pain points (freetext)
  - Must-keep tool (freetext)
- Auto-saves draft to localStorage before submission
- Thank-you page with links to Insights and Catalog

### 3. Insights Dashboard (Innsikt)
- Aggregated charts (using Recharts):
  - Most used tools (bar chart)
  - Most used models (bar chart)
  - Top use cases (horizontal bar)
  - Time saved distribution (pie/donut)
  - Data sensitivity distribution (pie/donut)
- Filter by category/use case
- No individual-level data shown

### 4. Recommended Stack (Anbefalt Verktøystack)
- Public page with three status lanes:
  - 🟢 Standard (supported)
  - 🟡 Allowed when needed
  - 🔴 Not allowed
- Each tool card shows: rationale, best use, risk level, alternatives
- Version label (v1, v2…)
- Admin can move tools between statuses and write rationale

### 5. Tool & Model Catalog (Verktøykatalog)
- Searchable, filterable catalog
- Each entry: best-for, recommended models, example prompts, security guidance, do's and don'ts
- Filter by category and status
- Markdown rendering for rich content

### 6. Learning Feed (Læring)
- Feed of markdown content: show & tell, prompt packs, guidelines, case studies
- Users can anonymously submit tips/workflows
- Admin can publish, edit, and tag content
- Filterable by type/tags

### 7. Admin Panel
- Protected by a secret admin code (entered once, stored in localStorage, validated server-side via edge function)
- **Review submissions**: view all survey responses (anonymous), map freetext to known tools/models, tag use cases, flag risk
- **Manage tools & models**: CRUD operations
- **Manage evaluations**: set status, scores, rationale, version stack
- **Manage catalog entries**: create/edit rich entries
- **Manage learning content**: publish/edit markdown items

## Design & UX
- Clean, modern UI with sidebar navigation
- Mobile-responsive
- Norwegian language throughout (matching the prompt language)
- Color-coded status badges (green/yellow/red)
- Fast, lightweight – optimized for quick survey completion

## Navigation Structure
- 🏠 Hjem (onboarding/landing)
- 📋 Kartlegging (survey)
- 📊 Innsikt (insights dashboard)
- 🟢 Anbefalt Stack (recommended tools)
- 📚 Katalog (tool catalog)
- 🎓 Læring (learning feed)
- 🔒 Admin (protected)

## Security
- All user input sanitized (XSS protection via zod validation)
- No PII collected or stored
- Admin access validated server-side
- RLS policies on all tables
- Only aggregated data in insights


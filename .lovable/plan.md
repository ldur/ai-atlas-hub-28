

## Plan: Multi-Survey System

### Overview
Transform the current single hardcoded survey into a dynamic, multi-survey system where admins can create, manage, and view statistics for each survey independently.

### Database Changes

**New table: `surveys`**
- `id` (uuid, PK)
- `title` (text, required)
- `description` (text, nullable)
- `is_active` (boolean, default true) -- controls which survey is currently accepting responses
- `created_at`, `updated_at` (timestamps)

**Modify table: `submissions`**
- Add `survey_id` (uuid, nullable, FK to surveys) -- nullable so existing submissions still work
- Existing submissions will be associated with a migrated "first survey" record

**Migration data**: Insert the current hardcoded survey as the first record in `surveys`, then update all existing submissions to reference it.

### Code Changes

**1. Survey page (`src/pages/Survey.tsx`)**
- Accept a `surveyId` route param (e.g., `/kartlegging/:surveyId`)
- Keep default route `/kartlegging` redirecting to the active survey
- On submit, include `survey_id` in the submission insert
- Show the survey title/description from the database

**2. Insights page (`src/pages/Insights.tsx`)**
- Add a survey selector dropdown at the top
- Filter submissions by selected `survey_id`
- Default to the active survey

**3. Admin panel (`src/pages/Admin.tsx`)**
- Add a new "Surveys" tab with:
  - List of all surveys (title, status, submission count)
  - Create new survey dialog (title + description)
  - Toggle active/inactive status
  - Delete survey (with confirmation)
- In the Submissions tab, add a survey filter dropdown

**4. Routing (`src/App.tsx`)**
- Add route `/kartlegging/:surveyId`

**5. Sidebar (`src/components/AppSidebar.tsx`)**
- No change needed -- the `/kartlegging` route stays as the entry point

**6. i18n (`src/lib/i18n.tsx`)**
- Add translation keys for survey management (create survey, active, inactive, etc.)

**7. Edge function (`supabase/functions/admin-action/index.ts`)**
- Add `"surveys"` to the `allowedTables` array

### Data Flow

```text
Admin creates survey → surveys table
User visits /kartlegging → loads active survey → submits to submissions (with survey_id)
Insights page → filter by survey_id → shows per-survey statistics
Admin panel → manage surveys, view submissions filtered by survey
```

### Migration Strategy
1. Create `surveys` table
2. Add `survey_id` column to `submissions`
3. Insert the existing hardcoded survey as the first row
4. Update existing submissions to point to it


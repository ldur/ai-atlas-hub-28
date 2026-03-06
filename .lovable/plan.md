

# Priskalkulator for Verktøy og Modeller

## Summary

Build a dedicated **Priskalkulator** page that uses AI to research vendor pricing strategies, stores pricing data per tool/model, and lets admins input organization parameters (seats, token usage, etc.) to calculate estimated monthly costs.

## Architecture

```text
┌─────────────────────────────────────────────────┐
│  New DB table: pricing_configs                  │
│  tool_id / model_id, pricing_type, tiers (json),│
│  ai_generated (bool), last_fetched              │
├─────────────────────────────────────────────────┤
│  New DB table: org_usage_params                 │
│  num_seats, monthly_tokens, monthly_hours, etc. │
├─────────────────────────────────────────────────┤
│  Edge function: fetch-pricing                   │
│  Uses Lovable AI to research vendor pricing     │
│  Returns structured pricing (tiers, per-unit)   │
├─────────────────────────────────────────────────┤
│  New page: /priskalkulator                      │
│  - Org params editor (seats, usage, etc.)       │
│  - Per-item cost cards with calculated totals   │
│  - "Fetch pricing with AI" per item             │
│  - Summary: total monthly/yearly cost           │
└─────────────────────────────────────────────────┘
```

## Database Changes

**1. `pricing_configs` table** -- stores pricing data per tool/model:
- `id`, `tool_id` (nullable), `model_id` (nullable)
- `pricing_type`: enum-like text (`per_seat`, `per_token`, `flat`, `tiered`, `usage_based`, `free`)
- `currency`: text, default `USD`
- `tiers`: jsonb -- flexible structure for pricing tiers, e.g. `[{name: "Pro", price: 20, unit: "seat/month", features: [...]}]`
- `input_token_price`, `output_token_price`: numeric (for per-token models)
- `notes`: text (admin override notes)
- `ai_generated`: boolean
- `last_fetched`: timestamp
- Open RLS (matches existing pattern)

**2. `org_usage_params` table** -- single-row org config:
- `id`, `num_seats` (int), `monthly_api_calls` (int), `monthly_input_tokens` (bigint), `monthly_output_tokens` (bigint), `notes` (text), `updated_at`

## Edge Function: `fetch-pricing`

Uses Lovable AI (gemini-3-flash-preview) with tool calling to research a given tool/model's pricing:
- Input: `{name, type, vendor/provider, link}`
- System prompt asks AI to return structured pricing data based on its knowledge of the vendor
- Returns: `pricing_type`, `tiers` array, token prices if applicable, `currency`
- Stores result in `pricing_configs`

## Frontend: `/priskalkulator` Page

**Top section -- Organization Parameters:**
- Editable card: number of seats, estimated monthly tokens, API calls
- Saved to `org_usage_params` via admin action
- These values feed into all cost calculations

**Main section -- Cost Overview:**
- Lists all tools and models that have evaluations (from Anbefalt Stack)
- Each card shows: name, pricing type badge, tier details, calculated monthly cost
- "Fetch pricing" button per item triggers AI lookup
- "Edit pricing" dialog for manual admin adjustments
- Color-coded: free (green), cheap (blue), expensive (amber), very expensive (red)

**Bottom section -- Summary:**
- Total estimated monthly and yearly cost
- Breakdown by category (tools vs models)
- Breakdown by pricing type

## Navigation

- Add `/priskalkulator` route and sidebar entry with `Calculator` icon
- Add i18n keys for Norwegian labels

## Implementation Steps

1. Create `pricing_configs` and `org_usage_params` tables with RLS
2. Create `fetch-pricing` edge function
3. Build the Priskalkulator page component with org params editor, cost cards, and summary
4. Add route, sidebar nav, and i18n strings


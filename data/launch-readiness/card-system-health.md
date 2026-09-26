# GCX Card System Health

Generated: 2026-09-26T00:44:33.224Z

Status: pass with manual-review queue

## Totals

- Total card records audited: 181,457
- Missing real card images logged for review: 162
- Exact duplicate groups remaining: 0
- Likely duplicate groups remaining: 0
- Variant groups requiring review/labeling: 3,819
- Reused image groups requiring review/labeling: 9,361
- Records/groups still needing manual review: 13,342

## Repair Summary

- Broken image records found: 162
- Broken image records automatically fixed: 0
- Duplicate records merged: 376
- Files repaired during duplicate cleanup: 5
- Records/groups still needing manual review: 13,342

## Affected Pages and Components

- Pokemon set and search grids
- Magic set and search grids
- Yu-Gi-Oh! set and search grids
- TCG card detail pages
- Pokemon Pikachu checklist article module
- Card health section on the data dashboard
- Pokemon/Magic/Yu-Gi-Oh API card responses
- Standalone Pokemon/Magic/Yu-Gi-Oh card detail pages

## Structural Prevention Added

- Shared canonical card identity helper in the browser
- Server-side card identity enrichment and response dedupe
- API-backed Magic and Yu-Gi-Oh set-card loading
- Pre-write validation/dedupe guards in Pokemon, Magic, and Yu-Gi-Oh import scripts
- Collector identity fields shown on card detail views
- Neutral Image unavailable fallback for missing card media
- Admin/dev warning labels for duplicate rendering and missing media
- Automated TCG media guardrail audit
- Runtime card surface audit for major card pages and API responses
- Project-level audit:cards command

## Rules Now Enforced

- Do not generate fake card images.
- Do not silently substitute an unrelated card image.
- Preserve card aspect ratio with full card frame visible.
- Dedupe rendered grids/search results by canonical card identity.
- Log missing images and variant-review cases for admin/dev review.

## Franchise Summary

### Pokemon

- Cards audited: 20,291
- Missing images: 0
- Exact duplicate groups: 0
- Variant-review groups: 0
- Reused-image review groups: 0

### Magic

- Cards audited: 116,362
- Missing images: 162
- Exact duplicate groups: 0
- Variant-review groups: 0
- Reused-image review groups: 0

### Yu-Gi-Oh!

- Cards audited: 44,804
- Missing images: 0
- Exact duplicate groups: 0
- Variant-review groups: 3,819
- Reused-image review groups: 9,361


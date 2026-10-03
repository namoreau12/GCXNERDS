# Games Exchange

GCX is a vanilla HTML/CSS/JS gaming and trading-card publication with a small Node backend for local APIs, cached data, auth/session helpers, community features, newsletter/waitlist persistence, and launch-readiness checks.

## Run locally

1. Copy `.env.example` to `.env`.
2. Add your Pokemon TCG API key:

   ```txt
   POKEMON_TCG_API_KEY=your_key_here
   ```

3. Start the local server:

   ```powershell
   & 'C:\Users\namor\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' server.js
   ```

4. Open:

   ```txt
   http://localhost:3000
   ```

The backend serves the site, local JSON datasets, dynamic article metadata, newsletter/waitlist endpoints, community endpoints, and Pokemon/Magic/Yu-Gi-Oh card APIs.
Pokemon API responses are cached in `.cache/pokemon` for 12 hours by default when the local dataset does not already cover the request.

## Launch checks

Run the full local launch check from the project root:

```powershell
& 'C:\Users\namor\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts/run-launch-checks.js
```

This will:

- refresh game-library completeness and data-health queue reports
- export full, finishable, focused, priority-platform, finishable-platform, and 90/95/100 milestone game image review CSVs
- refresh image-provider readiness
- backfill obvious missing game image provider labels and audit image source/provider provenance
- build a game image coverage plan for 90%, 95%, and 100% milestones
- scan deployable text files for accidental secret/key exposure without printing secret values
- scan newsroom, game, card, and documentation data for suspicious encoding damage/mojibake
- audit game overviews for weak template copy, exact repetition, short descriptions, and source/provider gaps
- report reviewed editorial overview progress separately from basic overview coverage
- export and audit priority game overview rewrite CSV batches for the largest weak/template-style overview backlogs
- verify reviewed game overview imports require editorial copy, review status, reviewer, current-overview freshness checks, and dry-run preservation
- verify newsroom stories include source links, claim status, editorial owner, update policy, reviewed/updated dates, and visible corrections-policy access
- verify Pokemon sets have no duplicate IDs/names and that main expansions stay separated from promo/subset products
- verify manual game cover-art imports require source/provider fields, approved review status, reviewer, and dry-run coverage impact reporting before accepting a row
- verify priority, finishable, and milestone game-image review batches exist, match their indexes, and include the required import-safety columns
- verify the image coverage plan has milestone targets, prepared review capacity, and finishable-platform guidance
- verify the image queue workbench renders coverage milestones, provider readiness, platform shortcuts, queue records, and 390px mobile fit
- verify the overview queue workbench renders rewrite batches, weak-overview records, filters, safe import guidance, and 390px mobile fit
- scan public pages/scripts for accidental live marketplace, checkout, payment, or transaction language while trading is beta-only
- verify marketplace policy readiness covers legal, seller, listing, payment, dispute, refund, support, and moderation gates before transactions open
- verify key account, newsletter, waitlist, sponsor, profile, and community forms include nearby privacy/beta disclosure copy
- verify legal/trust pages keep visible beta status, last-updated notes, contact paths, and marketplace-not-live language
- verify moderation operations readiness covers access control, queue coverage, review notes, evidence retention, marketplace abuse categories, and fixture rollback
- verify SEO infrastructure: canonical/Open Graph/Twitter metadata, sitemap coverage, robots.txt, and noindex treatment for internal/dynamic shells
- verify an isolated staff moderation fixture can load queues, update moderation status, resolve the linked report, and restore local data
- remove known synthetic launch-check fixtures before taking the local community-data snapshot
- run the Supabase launch-data validator as an advisory check
- start a temporary local server on port `3060`
- verify security/cache headers, `robots.txt`, `sitemap.xml`, mobile navigation, and 390px overflow on key pages
- verify homepage lead-story visual safety across mobile, tablet, desktop, and wide external-browser viewports
- verify the staff-only moderation page shows a clear sign-in state and disables closeout controls for unauthenticated visitors
- verify the auth page has password-manager autocomplete hints, password visibility toggles, social-provider placeholder messaging, signup disclosure links, and no 390px overflow
- verify core pages have titles, one H1, language/viewport tags, image alt text, labeled form fields, accessible controls, clean consoles, and no 390px overflow
- verify the Data Health launch-readiness module renders blockers, warnings, and next actions without mobile overflow
- verify `/api/status` reports the expected launch contract: local fallback enabled, Supabase mode explicit, auth mode explicit, and marketplace payments/trading still beta-disabled
- verify sensitive auth/admin/community API responses are JSON, `no-store`, and covered by security headers
- crawl representative runtime links for broken internal URLs and console errors
- verify local news image budgets plus rendered image fallback, width/height, loading, decoding, and mobile overflow behavior on representative pages
- verify anonymous users cannot access staff/community moderation endpoints, and verify local signup/session/logout when Supabase Auth is disabled for the temporary test server
- verify local fallback sessions store token hashes rather than raw bearer tokens, still authenticate, and invalidate on logout
- post test newsletter, collector waitlist, and sponsor lead submissions, confirm local persistence, then restore `data/community.json`
- remove known synthetic launch-check fixtures again and verify test accounts, sessions, and lead records did not leak back into `data/community.json`
- stop the temporary server when finished

The temporary server used by this runner disables Supabase writes for the lead-capture audit, so test submissions stay local and are rolled back.

If port `3060` is busy, choose another port:

```powershell
$env:GCX_LAUNCH_CHECK_PORT='3070'
& 'C:\Users\namor\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts/run-launch-checks.js
```

Supabase launch data is ready only when `supabase/gcx-auth-foundation.sql`, `supabase/gcx-launch-data-foundation.sql`, and `supabase/gcx-launch-hardening.sql` have been applied and:

```powershell
& 'C:\Users\namor\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts/validate-supabase-launch-data-setup.js
```

reports `"ready": true`. Until then, local JSON remains the safe fallback.
You can also inspect `http://localhost:3000/api/status` while the site is running; it reports persistence mode, auth mode, beta marketplace status, and local record counts without exposing secrets.

To smoke-test real Supabase writes without keeping test rows, run:

```powershell
& 'C:\Users\namor\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts/audit-supabase-live-persistence.js
```

It starts an isolated local server, submits newsletter, collector waitlist, marketplace beta intent, and sponsor lead records, confirms the API returns `local+supabase`, verifies the rows exist in Supabase, deletes those exact synthetic rows, and restores `data/community.json`.

For a single go-live snapshot, run:

```powershell
& 'C:\Users\namor\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts/build-launch-readiness-report.js
```

It writes `data/launch-readiness/latest.json` and `data/launch-readiness/latest.md` with pass/blocker/warning gates for Supabase, auth, local fallback session storage, beta marketplace safety, marketplace policy readiness, moderation operations readiness, editorial credibility, game overview quality, game overview rewrite batches, game overview import safety, secret scanning, form disclosures, Pokemon set quality, manual game-image import safety, game image provenance, image review batches, image coverage milestones, image queue workflow UI, overview queue workflow UI, accessibility basics, content coverage, and image health.

To regenerate optimized JPG versions of the local newsroom hero art from the original PNG sources, run:

```powershell
& 'C:\Users\namor\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' scripts/optimize-local-news-images.py
```

## Remaining launch work

- Add a commercial-friendly game-cover provider key, preferably `MOBYGAMES_API_KEY`, after confirming the provider plan permits GCX's intended use. Follow `docs/game-image-review-workflow.md`, then run `scripts/validate-image-provider-keys.js --mobygames`, `scripts/report-image-provider-readiness.js`, and `scripts/audit-game-image-import-readiness.js` before attempting the remaining bulk game image backlog.
- Enable Supabase Auth leaked-password protection in the Supabase dashboard before public launch.
- Keep marketplace trading/payment flows in beta until legal, trust, moderation, dispute, refund, and payout rules are reviewed.

## Import Pokemon data permanently

Run:

```powershell
& 'C:\Users\namor\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts/import-pokemon-data.js
```

This writes:

- `data/pokemon/sets.json`
- `data/pokemon/cards.json`
- `data/pokemon/manifest.json`

When those files exist, the backend serves Pokemon sets, cards, card detail pages, and search from local data first.
The live Pokemon TCG API remains a fallback/update source.

## Import SNES game data

Run:

```powershell
& 'C:\Users\namor\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts/import-snes-games.js
```

This writes:

- `data/games/snes.json`
- `data/games/snes-manifest.json`

The first importer uses Wikidata as a structured base. It currently imports 1,432 unique SNES records, with Wikipedia article links for many entries and browser-side thumbnail hydration for cover images when available. A later pass should merge in a region-complete release list to close the gap with the full official SNES library count.

To permanently enrich SNES records with available Wikipedia/Wikimedia thumbnails, run:

```powershell
& 'C:\Users\namor\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts/enrich-snes-images.js
```

This updates `data/games/snes.json` and writes `data/games/snes-image-cache.json`.

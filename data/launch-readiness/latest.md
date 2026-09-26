# GCX Launch Readiness

Generated: 2026-09-26T00:50:30.127Z
Status: ready-with-warnings

## Gates

| Gate | Status | Detail |
| --- | --- | --- |
| Local Launch Checks | PASS | Current full local launch check completed successfully in this runner. |
| Supabase Launch Data | PASS | Launch data tables are reachable. |
| Supabase Data Freshness | PASS | 30 public static data file(s) verified against Supabase snapshots and normalized record counts. |
| Supabase Migration CLI Safety | PASS | Migration helper verified that --help/-h do not start imports and --refresh-selected cannot run without explicit paths. |
| Supabase Auth | PASS | Auth settings and profiles table are reachable. |
| Supabase Public API Surface | PASS | Sensitive Supabase tables reject direct anonymous access while approved public read surfaces remain reachable. |
| Supabase Auth Live Session | PASS | Live smoke created a temporary confirmed Supabase user, logged in through GCX, verified session/staff rejection/refresh/logout, then deleted the user. |
| Supabase Live Persistence | PASS | Live smoke wrote newsletter, collector waitlist, marketplace intent, and sponsor lead rows to Supabase, then cleaned 4 table(s). |
| Marketplace Safety | PASS | No live payment/trading language detected in public surfaces. |
| Marketplace Policy Readiness | PASS | Marketplace launch checklist and public beta policy surfaces cover legal, seller, listing, payment, dispute, refund, support, and moderation gates before transactions open. |
| Legal and Trust Pages | PASS | 7 legal, trust, marketplace, and TCG image-policy pages verified for beta launch disclaimers and unsafe affirmative claims. |
| SEO Infrastructure | PASS | 44 indexable static page(s), 28 newsroom article URL(s), and 72 sitemap URL(s) verified for canonical, Open Graph, Twitter, robots, and sitemap coverage. |
| Deploy Artifact Hygiene | PASS | Render uses /api/health, dashboard-synced env vars protect production secrets, ignore files protect .env and ZIP artifacts, .env.example uses placeholders, and 11 local root ZIP artifact(s) are tracked as manual-upload warnings including 1 zero-byte archive(s). |
| Node Package Hygiene | PASS | 0 package dependency/dependencies detected; 0 lockfile(s) present. Dependency-free npm install is acceptable until dependencies are added. |
| Public API Error Hygiene | PASS | 1 server file(s) checked so public JSON 500/502 responses do not expose raw error.message details or stack traces. |
| Ops Surface Privacy | PASS | 5 staff/ops page(s) are noindex/nofollow, excluded from sitemap.xml, not promoted from public pages except approved data-health access, and 0 noindexed shell(s) passed runtime X-Robots-Tag plus private no-store cache header checks. |
| Launch Runner Safety | PASS | Full launch runner rebuilds the launch report without allow-failure, then audits the rebuilt report and key runtime UI checks. |
| Secret Exposure | PASS | Deployable text scan did not find .env secret values. |
| JSON Duplicate Keys | PASS | 2,728 JSON files scanned with no duplicate keys. |
| Data Text Quality | PASS | 3,653 data/content files scanned with no suspicious mojibake. |
| Public Draft Language | PASS | 178 public page/data/doc files scanned with no draft instruction language exposed. |
| Game Overview Quality | PASS | 5,443 weak/template-style game overviews remain in the private rewrite backlog, but public list/detail pages are verified to show editorial-review messaging instead of unfinished copy. |
| Game Overview Internal Language | PASS | 42,622 game overviews scanned with no internal editorial instruction language exposed. |
| Game Overview Grammar Regressions | PASS | 686 game datasets and reviewed-import files scanned for cleanup-induced grammar regressions. |
| Game Overview Markup Cleanup | PASS | 42,622 game overviews scanned with no visible wiki/template markup artifacts. |
| Game Search Index Quality | PASS | 42,622 game search-index row(s) checked with no repeated overview blobs. |
| Game Overview Rewrite Batches | PASS | 8 platform overview rewrite batches verified with 800 CSV rows against 5,443 weak/template-style overviews. |
| Game Overview Review Workplan | PASS | 800 overview rewrite row(s) staged across 8 priority batch(es). Next: Rewrite and review 100 rows in data/games/overview-rewrite-batches/ds-overview-rewrite-batch.csv for DS Games; then run node scripts/import-game-overview-rewrites.js data/games/overview-rewrite-batches/ds-overview-rewrite-batch.csv --dry-run. |
| Game Overview Import Safety | PASS | Reviewed overview imports require new editorial copy, approved review status, reviewer, current-overview freshness checks, and dry-run preservation before changing datasets. |
| Reviewed Overview Import Voice Repair | PASS | 663 reviewed overview import CSV(s) checked; 0 queued replacement rows still contain internal GCX/Codex phrasing. |
| Reviewed Overview Import Freshness | PASS | 663 reviewed overview import files checked; 0 rows still pending import and 7,216 already applied. |
| Overview Import Repair Queue | PASS | 1,398 rejected reviewed overview row(s) grouped into 2 repair reason(s) with a CSV worklist. |
| Overview Re-review Packet | PASS | 1,398 rejected overview rows exported with live overview, proposed copy, source URL, repair action, and dry-run command. |
| Overview Re-review Classification | PASS | 1,398 stale reviewed overview row(s) classified: 1,397 are superseded by reviewed live copy and 0 are weak-live safe candidates. |
| Editorial Credibility | PASS | 28 newsroom stories verified for source links, claim status, owner, update policy, reviewed/updated dates, and corrections-policy visibility. |
| Newsroom Internal Language | PASS | 28 newsroom stories scanned with no internal editorial instruction language exposed. |
| Newsroom Media Audit | PASS | 28 newsroom stories checked for media rights, captions, credits, source links, alt text, and official video embeds. |
| Newsroom Media Workplan | PASS | 10 newsroom article(s) identified for optional media-depth upgrades. Next: Add approved media modules to gcx-newsroom-pokemon-30th-celebration-pikachu-cards: Add approved product/card imagery or a visual checklist module using the card aspect-ratio component. |
| Newsroom Structured Tables | PASS | 29 newsroom table block(s) stored as structured data; raw Markdown pipe-table syntax is blocked. |
| Newsroom Table Rendering | PASS | 8 Markdown table fixture(s) verified to render as article tables without leaking separator rows. |
| Newsroom Preview Text | PASS | 11 article preview/text candidate(s) verified with no visible table separators, raw pipes, encoded spaces, or blank table-only teasers. |
| Newsroom Visible Markdown Leaks | PASS | 56 desktop/mobile page render(s) checked with no visible Markdown table separators or pipe-delimited table blobs. |
| Newsroom Image Uniqueness | PASS | 55 newsroom hero/media image use(s) checked; no image URL is reused across different article IDs. |
| Released Article Readthrough | WARN | 28 released article(s) inventoried; 10 have media/source/pacing items to review. |
| Official Media Replacement Queue | PASS | No newsroom stories are waiting on official-media replacement. |
| Newsroom Promotion Readiness | WARN | 5 prominent homepage/news placement(s) point at articles that still need editorial/media polish before heavy launch promotion. |
| Article Visual Quality | WARN | 28 article(s) audited; 2 presentation warning(s) remain. |
| Article Image Duplicates | PASS | 18 article page(s) checked with 40 rendered article image(s); no duplicate or broken article images found. |
| Article Table UI | PASS | 15 article page(s) with Markdown tables verified in browser for rendered table markup and no visible separator rows. |
| Pokemon Set Quality | PASS | 174 Pokemon sets checked with no duplicate IDs/names; main view separates 42 supplemental products/subsets. |
| Game Image Import Safety | PASS | Manual cover-art imports require source/provider fields, approved review status, reviewer, and dry-run coverage impact reporting before accepting a row. |
| Game Image Provenance | PASS | 37,958 game images audited; 100% have provider labels and 100% have source URLs. |
| Image Review Batches | PASS | 16 cover-art review files verified with 8,728 CSV rows; milestone batches are duplicate-free, nested, and matched to the current missing-image queue. |
| Image Import Readiness | WARN | No approved cover-art rows are ready to import; MobyGames key is not configured. Next reviewed-source move: GAMEBOY Games needs an external reviewed source next: MobyGames or another reviewed commercial metadata provider; current direct/free strict passes are exhausted for the remaining rows. |
| PriceCharting Candidate Guardrails | PASS | PriceCharting review candidates are checked for both title match and platform label before they can be treated as safe. |
| Provider Dry-Run Limits | PASS | MobyGames and RAWG provider dry-run commands are verified to stay limited to one platform and ten rows per platform before any real API call. |
| Game Image Review Workplan | PASS | 335 finishable image row(s) staged across 5 near-complete platform(s). Next: GAMEBOY Games needs an external reviewed source next: MobyGames or another reviewed commercial metadata provider; current direct/free strict passes are exhausted for the remaining rows. |
| Image Coverage Plan | PASS | Game image milestones verified for 90%, 95%, and 100%; next target needs 400 reviewed cover images in data/games/milestone-review-batches/90-pct-image-review-batch.csv. |
| Image Queue Workflow UI | PASS | Image queue renders coverage milestones, provider readiness, platform filter shortcuts, queue records, and 390px mobile fit. |
| Game Image Fallback UI | PASS | 9 high-backlog game library page(s) verified that missing covers render as clean pending-review placeholders at 390px. |
| Game Detail Image Rendering | PASS | 10 ps2 detail page image(s) verified in Chrome at 390px with loaded covers and no horizontal overflow. |
| Overview Queue Workflow UI | PASS | Overview queue renders rewrite batches, weak-overview records, filters, import guidance, and 390px mobile fit. |
| Public Game Overview Gating | PASS | 18 platform list page(s) and 36 weak/template overview detail page sample(s) verified to show editorial-review messaging instead of unfinished metadata copy. |
| Data Health Launch UI | PASS | Data Health renders launch gates, next actions, coverage milestone, overview quality, image provenance, and 390px mobile fit. |
| Consent and Form Disclosures | PASS | Lead/account/community forms include launch privacy/beta disclosure copy. |
| Staff Moderation Controls | PASS | Isolated staff fixture loaded moderation queues, updated a reported post, resolved the linked report, and restored local data. |
| Signed-Out Admin UI | PASS | Signed-out community admin page shows staff sign-in messaging, hides staff action buttons, disables 4 closeout control(s), and fits at 390px. |
| Auth and Admin Hardening | PASS | 16 auth/admin hardening checks verified staff gates, public profile privacy, stale session cleanup, browser key hygiene, and Supabase profile role safety. |
| Moderation Operations Readiness | PASS | Moderation operations checklist and staff surfaces cover access control, queue coverage, review notes, evidence retention, marketplace abuse categories, and data-restoring fixture audits. |
| Community Test Fixtures | PASS | Local community data is free of launch/auth/Supabase smoke-test artifacts and orphan sessions. |
| Sensitive API Headers | PASS | 6 auth/admin/community API responses verified as JSON, no-store, and security-header protected. |
| Server Health Contract | PASS | /api/health reports launch status ready-with-warnings, 4 warning(s), 0 stale Supabase snapshot(s), and 674 checked runtime link(s) without exposing sensitive fields. |
| Public Profile Privacy | PASS | Public community profile, feed, and discovery responses do not expose staff roles, account data, or session fields. |
| Community Write Rate Limits | PASS | 2 public write surface(s) verified to require auth first and return HTTP 429 with Retry-After after repeated attempts. |
| Auth Page UX | PASS | Sign-in page verified for password-manager hints, password toggles, social-provider placeholder messaging, signup disclosures, and 390px mobile fit. |
| Client Auth Storage Hygiene | PASS | Auth page and global header stamp stored sessions, clear stale browser tokens, and render signed-out state without console errors. |
| Local Session Token Storage | PASS | Local fallback signup stores hashed session tokens, authenticates with the returned bearer token, and invalidates it on logout without persisting the raw token. |
| Legacy Raw Session Rejection | PASS | Local fallback auth rejects legacy raw-token-only session records and requires hashed session tokens. |
| Accessibility Basics | PASS | 13 core pages verified for titles, one H1, language/viewport tags, image alt text, labeled form fields, accessible controls, console health, and 390px mobile fit. |
| Runtime Internal Links | PASS | 674 internal links checked across 18 rendered seed page(s) with no broken links, console errors, or mobile overflow. |
| Content and Image Quality | WARN | 89.1% game image coverage; 4,662 images remain. Next image milestone: review 400 cover images to reach 90% coverage using data/games/milestone-review-batches/90-pct-image-review-batch.csv. |
| Image URL Health | PASS | 305 sampled image URLs OK; 0 failed; 35 deferred. |
| Rendered Image Performance | PASS | 7 local news assets within budget; tested pages had no broken rendered images, missing image attributes, or mobile overflow. |
| Image/Text Layout System | PASS | 825 image-heavy components checked across 64 Chrome viewport/page runs with no overlap, clipping, SVG-lead, or mobile overflow failures. |
| Prominent News Official Media | PASS | 10 homepage/news lead slots verified against fallback, SVG, and official-media warning use. |

## Content Quality

- Game image coverage: 89.1% (4,662 missing)
- Game overview coverage: 100% (0 missing)

## Top Image Backlog

- ps2: 727 missing (83.2% covered)
- vita: 631 missing (63.2% covered)
- ps3: 607 missing (73.7% covered)
- switch: 475 missing (89.1% covered)
- 3ds: 460 missing (74.5% covered)
- psp: 445 missing (76.7% covered)
- xbox360: 366 missing (82.9% covered)
- ps4: 311 missing (91% covered)
- ps1: 278 missing (93.2% covered)
- ds: 131 missing (96% covered)

## Next Actions

- Resolve editorial QA items for 10 released article(s), starting with data/launch-readiness/newsroom-editorial-readthrough.md.
- Resolve 2 article visual-quality warning(s), starting with data/launch-readiness/article-visual-quality.md.
- Promotion cleanup first move: review 5 prominent homepage/news placement(s) in data/launch-readiness/newsroom-promotion-readiness.json before treating them as launch-featured stories.
- Image cleanup first move: GAMEBOY Games needs an external reviewed source next: MobyGames or another reviewed commercial metadata provider; current direct/free strict passes are exhausted for the remaining rows. Larger milestone remains: Next image milestone: review 400 cover images to reach 90% coverage using data/games/milestone-review-batches/90-pct-image-review-batch.csv. Add a commercially appropriate cover-art provider key, preferably MOBYGAMES_API_KEY after confirming plan terms, validate it, then run the keyed image pipeline in dry-run mode. For manual review without a provider key, start with data/games/finishable-image-review-batches.json to close small gaps, then data/games/priority-image-review-batches.json for the largest backlogs.
- Keep marketplace trading and payments beta-disabled until legal, dispute, refund, and moderation rules are reviewed.


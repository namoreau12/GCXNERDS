# GCX v5 Product Audit

## CURRENT STATE

GCX is currently a static HTML/CSS/JavaScript site served by a lightweight Node backend, not a Next.js application in this checkout. The homepage is assembled in `index.html`, hydrated by `script.js`, styled globally in `styles.css`, and backed by JSON data plus API routes in `server.js`.

The homepage already has a strong top editorial lead with a preserved Games/Cards/marketplace area, a newsroom feed from `/api/news`, creator spotlight data from `/api/community/streamers`, and community discovery from `/api/community/discovery`. Article data lives mainly in `data/newsroom.json`; community, creator, spotlight, comments, sponsorship, traffic, and local auth-adjacent state live in `data/community.json`.

Supabase foundations exist as SQL files under `supabase/`: profiles/auth, content/community/waitlist tables, moderation reports, sponsor leads/promotions, marketplace intent rows, RLS policies, and hardening rules. The current runtime still uses local JSON as the primary content store with service-style synchronization scripts and validators.

The visual language is established but mixed: light paper background, red GCX accent, charcoal panels, strong image cards, many repeated card/grid systems, and several mobile breakpoints. The site already includes audits for visual quality, media safety, Supabase validation, launch readiness, secret exposure, auth hardening, and data hygiene.

## PROBLEMS

- The pasted brief assumed Next.js, but this repository is static HTML/JS plus Node, so a framework-level implementation would be a migration rather than an upgrade.
- The homepage below the lead previously read as separate widgets rather than a living editorial/social product.
- News hierarchy was too flat: most homepage stories used the same card treatment and the lead story could still reappear in the feed.
- There was no unified GCX Pulse adapter combining news, status, sources, timestamps, and context into a fast cultural scan.
- Clips and streaming content existed in `streamingSpotlight`, but the homepage did not expose a dedicated poster-card clip discovery rail.
- Creator Spotlight already existed but still leaned toward voting mechanics instead of premium creator discovery.
- The nav did not make Creators and Clips immediately visible as first-class destinations.
- Design tokens existed mostly as colors/media variables, but editorial type hierarchy and spacing tokens were incomplete.
- `script.js` is large and mixes homepage, cards, search, waitlist, and Pokemon logic.
- `styles.css` is large and contains many feature-specific card/grid patterns that should eventually become shared primitives.
- Local JSON contains seed/test-like community entries and engagement counts; these must remain clearly treated as local data and not fabricated production truth.
- Third-party embeds are wisely avoided on the homepage, but clip discovery needed facade cards to keep that performance posture.

## OPPORTUNITIES

- Turn existing newsroom, community, creator, and streaming data into a unified “front page of gaming culture” without rebuilding working systems.
- Use GCX Pulse as the homepage connective tissue across editorial, community, creator, and video surfaces.
- Elevate article hierarchy with a larger first feed card and breaking/developing variants.
- Keep clips lightweight with thumbnails and watch links, loading third-party players only on deliberate interaction elsewhere.
- Make Creator Spotlight feel curated and premium while still allowing votes as a signal.
- Centralize duplicate prevention around durable IDs, slugs, canonical URLs, duplicate keys, and fallback normalized titles/URLs.
- Continue moving community/auth/moderation toward Supabase, while keeping current server-only hardening posture.

## COMPONENTS TO KEEP

- Top lead story and radar structure in `index.html`.
- Existing Games/Cards/marketplace area, as requested.
- `/api/news`, `/api/community/streamers`, and `/api/community/discovery` contracts.
- Article media manifest fields in `data/newsroom.json`.
- Existing creator pages and streamer campaign routes.
- Existing community feed/member/group/event surfaces.
- Existing image fallback, media classification, and official-media warning helpers in `site.js` and `script.js`.
- Supabase RLS-first foundation and launch hardening SQL.

## COMPONENTS TO REFACTOR

- Split `script.js` into homepage, cards, search, waitlist, and shared utility modules.
- Split `styles.css` into shared tokens, editorial, pulse, community, creators, clips, cards, and layout sections.
- Convert repeated card patterns into shared editorial/card primitives.
- Move duplicate prevention into a reusable client/server helper shared by articles, clips, posts, creators, and TCG cards.
- Normalize content adapters so article, community, creator, and clip records can feed Pulse consistently.

## COMPONENTS TO REPLACE

- Flat homepage news grid should become a story hierarchy with intentional variants.
- Homepage-only creator voting framing should be replaced with curated Creator Spotlight presentation.
- Generic “traffic hooks” copy should be softened into community/discovery language as the product matures.
- Any seed/test community entries should be replaced with real moderated data before launch.

## NEW COMPONENTS REQUIRED

- `GCX Pulse` homepage section and adapter layer.
- Story card variants: large, standard, compact/breaking foundations.
- Trending Clips poster rail using `streamingSpotlight`.
- Shared editorial type and spacing tokens.
- Centralized content dedupe helper.
- Future `/creator/[slug]` equivalent for the current static routing model, likely `creator.html?id=` or generated creator pages before any Next.js migration.
- Analytics abstraction for `article_open`, `clip_open`, `clip_play`, `creator_open`, `creator_watch`, `community_open`, `topic_follow`, `share`, and `save`.

## DEDUPE STRATEGY

Use durable IDs first: article `id`, article `slug`, streaming `id`, community post `id`, creator `id`, and server-provided `duplicateKey`. If an ID is missing, fall back to canonical URL, article URL, watch URL, source URL, external URL, then normalized title. Normalize by lowercasing, removing diacritics, trimming, and replacing non-alphanumeric runs with a single separator.

Homepage dedupe should happen before rendering each mixed feed. Featured lead stories must be excluded from the immediate news feed unless a section is explicitly “related coverage.” Clips, posts, creators, and cards should each dedupe inside their own type before cross-surface mixing.

## IMPLEMENTATION NOTES

This pass keeps the current static/Node architecture and upgrades the homepage using existing data contracts. No Supabase schema changes were required in this iteration.

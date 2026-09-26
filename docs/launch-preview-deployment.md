# GCX Launch Preview Deployment

This is the safest order for putting GCX online as a public preview.

## 1. Local Preflight

Run these before deploying:

```powershell
npm run check
npm run audit:media
npm run audit:launch
```

The full launch audit starts a temporary local server, checks major pages, verifies mobile navigation and image layout, confirms marketplace language is beta-safe, scans for accidental secret exposure, and restores synthetic test data after lead-capture checks.

## 2. Hosting Choice

Use a Node web service host for the preview because GCX depends on `server.js` for APIs, dynamic article metadata, search/data endpoints, Supabase/Auth helpers, lead capture, and image fallback/proxy behavior.

Recommended first host: Render.

Render settings:

- Runtime: Node
- Build command: `npm install --omit=dev`
- Start command: `npm start`
- Health check path: `/api/health`

The included `render.yaml` captures those defaults.

## 3. Environment Variables

Set these in the host dashboard. Do not paste secret keys into frontend files.

- `GCX_SITE_URL`: live preview URL first, then the final domain after DNS is ready
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: server-side only
- `SUPABASE_ANON_KEY`: public Supabase anon/publishable key
- `SUPABASE_AUTH_ENABLED`: `true` when Supabase Auth should be live
- `GCX_ADMIN_EMAILS`: comma-separated owner/admin email allowlist, for example your login email
- `POKEMON_TCG_API_KEY`: optional but recommended for Pokemon API fallback
- `POKEMON_CACHE_TTL_MS`: `43200000`
- `NEWS_CACHE_TTL_MS`: `1200000`

Optional later:

- `RAWG_API_KEY`
- `MOBYGAMES_API_KEY`

## 4. Admin and Supabase Security Preflight

Do this before sharing the preview link publicly:

- Set `GCX_ADMIN_EMAILS` on the host to your trusted admin email address only.
- Keep `SUPABASE_SERVICE_ROLE_KEY` server-side only. Never add it to browser JavaScript, static HTML, or public repo notes.
- Keep `.env` out of deployment uploads and source control.
- Confirm Supabase Row Level Security is enabled on public tables.
- Confirm newsletter, collector waitlist, sponsor leads, and import/data tables are server-only for public users.
- Confirm marketplace trading and payments remain disabled.
- Create one normal test account and one admin test using your allowlisted email, then verify the normal account cannot open moderation/admin data.
- Use Supabase Auth redirect URLs for only the preview URL and final production domain you control.
- Do not make anyone an admin by editing user-editable profile metadata. Staff access should come from the server allowlist or trusted database role changes only.

## 5. Supabase Redirects

After the preview URL exists, update Supabase Auth:

- Site URL: the preview URL
- Additional redirect URL: preview URL
- Additional redirect URL: preview URL with `/auth.html`

After the custom domain is connected, add the final domain versions too.

## 6. Beta-Safe Launch Rules

Before public sharing:

- Keep marketplace trading, payments, payouts, and real-money checkout disabled.
- Keep marketplace pages clear that trading/selling is coming soon or beta-only.
- Keep Privacy, Terms, Contact, About, Sponsors, and Trust pages visible.
- Keep the GCX media rule active: real game stories use official screenshots/key art/trailer media, not invented visuals.

## 7. Files That Should Not Ship

Do not deploy:

- `.env`
- `.cache/`
- `node_modules/`
- old backup/share ZIP files
- temporary logs

Those are ignored in `.gitignore`, but check host upload settings if deploying without Git.

## 8. Post-Deploy Test

On the live preview URL, test:

- `/`
- `/news.html`
- one newsroom article
- `/games.html`
- `/consoles.html`
- `/pokemon.html`
- `/magic.html`
- `/yugioh.html`
- `/auth.html`
- `/search.html?q=Pokemon`
- `/api/health`
- `/api/status`
- `/robots.txt`
- `/sitemap.xml`

Then create a test email signup/login and confirm the Supabase email link returns to the live site.

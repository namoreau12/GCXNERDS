# GCX Supabase Auth Launch Checklist

Use this checklist to move GCX from prototype local accounts to real public user accounts.

## 1. Enable Auth in Supabase

In the Supabase dashboard:

- Go to `Authentication`.
- Enable email/password signups.
- Decide whether email confirmation is required before launch.
- Add the live site URL to allowed redirect URLs once the domain is chosen.

## 2. Create the profile table

Open the Supabase SQL Editor and run:

```sql
-- Paste the contents of supabase/gcx-auth-foundation.sql
```

That file creates:

- `public.profiles`
- RLS policies for public profile reads and member-owned writes
- a trigger that creates a profile when a Supabase Auth user signs up

## 2.5. Create launch data tables

After the profile foundation passes, run:

```sql
-- Paste the contents of supabase/gcx-launch-data-foundation.sql
```

That file creates RLS-enabled launch tables for:

- newsletter subscriptions
- collector marketplace waitlist interest
- article comments
- community posts and comments
- moderation reports
- sponsor leads and sponsor promotions
- marketplace listing intent placeholders

Important: this does not make trading live. `marketplace_listing_intents` is waitlist/intent only and keeps the default safety note that no listing, payment, or trade is live.

The SQL includes `local_id` / `local_post_id` bridge columns where needed so the vanilla MVP can keep stable local string IDs while Supabase stores relational UUID rows. Marketplace intent rows also include `source_id` so a waitlist request can point back to a specific card/game/console without creating a public listing. Do not remove those bridge columns until the frontend and datasets have fully migrated.

It also grants `service_role` server access plus limited `anon` / `authenticated` access where RLS policies allow public reads or member-created rows. Grants make a table reachable through the Supabase Data API; RLS still decides which rows are visible or writable.

Supabase changed newer project defaults so newly created public tables may not be exposed to the Data API automatically. Keep the explicit `grant` statements in `supabase/gcx-launch-data-foundation.sql`; without them the REST API can return 404 even when a table exists in the database.

## 3. Add local environment values

In `.env`, keep the existing private server key and add the public auth key:

```env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_private_server_key
SUPABASE_ANON_KEY=your_public_anon_or_publishable_key
SUPABASE_AUTH_ENABLED=false
GCX_ADMIN_EMAILS=owner@example.com
```

Leave `SUPABASE_AUTH_ENABLED=false` until validation passes.

`GCX_ADMIN_EMAILS` is a local/server-only fallback allowlist for moderator and admin actions while GCX is still transitioning away from JSON-backed MVP accounts. Normal staff access should come from trusted `profiles.role` values in Supabase (`member`, `moderator`, or `admin`). Do not expose the allowlist in browser code.

## 4. Validate setup

Run:

```powershell
$node='C:\Users\namor\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
& $node scripts\validate-supabase-auth-setup.js
```

Then validate the launch data tables:

```powershell
& $node scripts\validate-supabase-launch-data-setup.js
```

This validator checks two things:

- the server key can reach every launch table with the columns the Node backend writes
- the public read tables used by article comments, community posts/comments, and sponsor promotions are reachable with the public anon/publishable key while RLS still filters rows

If the validator returns `PGRST205` / `404`, the launch tables are missing from the REST schema cache. Run `supabase/gcx-launch-data-foundation.sql` in the Supabase SQL Editor, wait a moment, and rerun the validator. If the tables already exist but 404s continue, confirm the Data API settings and explicit grants.

The server now attempts best-effort relational Supabase writes for newsletter subscriptions, collector waitlist submissions, marketplace intent placeholders, sponsor leads, sponsor promotions, news article comments, community posts, community comments, and moderation reports. Local JSON remains the fallback, so the site continues working if the launch data SQL has not been applied yet.

When the key and profile table are ready, turn on:

```env
SUPABASE_AUTH_ENABLED=true
```

## 5. Harden website auth endpoints

After validation, keep the local `/api/auth/*` fallback available during development, but test the Supabase session path end to end with `SUPABASE_AUTH_ENABLED=true`.

Do this before allowing public comments, saves, watchlists, or marketplace beta features beyond closed testing.

## 6. Run Supabase advisors before public launch

In the Supabase dashboard, run Security Advisor and Performance Advisor after applying the SQL. Fix any RLS, exposed table, missing index, or policy warning before accepting public traffic.

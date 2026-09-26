# GCX Supabase Launch Data Checklist

Use this after Supabase Auth is working and before trusting remote persistence for newsletter, collector waitlist, comments, community posts, moderation reports, sponsor leads, or sponsor placements.

## Current Gate

Run the validator from the project root:

```powershell
node scripts/validate-supabase-launch-data-setup.js
```

Launch data is ready only when the validator reports:

```text
"ready": true
```

## Setup Steps

1. Open Supabase SQL Editor.
2. Paste and run the full contents of:

```text
supabase/gcx-launch-data-foundation.sql
```

3. Wait a minute for the REST schema cache to refresh.
4. Run the validator again:

```powershell
node scripts/validate-supabase-launch-data-setup.js
```

## Tables The Site Expects

- `newsletter_subscriptions`
- `collector_waitlist`
- `news_article_comments`
- `community_posts`
- `community_comments`
- `moderation_reports`
- `sponsor_leads`
- `sponsor_promotions`
- `marketplace_listing_intents`

## If Tables Still Return 404

Confirm the SQL ran in the same Supabase project as the keys in `.env`.

If the tables exist but still return 404, refresh the Supabase REST schema cache by waiting briefly and retrying. If the issue remains, check that the public schema is exposed through the Supabase Data API and that the grants in `supabase/gcx-launch-data-foundation.sql` were applied.

## Safety Notes

- Keep marketplace trading in beta. Do not enable payments or real-money trade flows yet.
- Keep RLS enabled on exposed public tables.
- Use the server/service-role path for staff-only writes and moderation actions.
- Never place the service-role key in frontend JavaScript.

# GCX Moderation Operations Readiness Checklist

Last updated August 23, 2026.

GCX moderation tools are required before the community, sponsor surfaces, streamer campaigns, and future marketplace traffic can scale. This checklist is an internal launch gate for staff operations, not a public safety guarantee or legal policy.

## Access And Roles

- Staff-only moderation pages must stay `noindex`.
- Anonymous visitors must not access moderation queues.
- Signed-in non-staff members must not access moderation queues.
- Moderator or admin access must be required for report queues, sponsor lead review, promotion status changes, and streamer closeout actions.
- Staff actions should record reviewer identity and timestamp when content status changes.

## Queue Coverage

- Reported posts must appear in a staff queue.
- Reported comments must appear in a staff queue.
- Pending streamer nominations must appear in a staff queue.
- Sponsor leads must be reviewable by staff before campaign follow-up.
- Marketplace beta signals must remain interest-only and must not create transaction obligations.
- Queues should show empty states clearly so staff can tell the system is healthy, not broken.

## Action And Evidence Gates

- Staff must be able to approve or hide posts.
- Staff must be able to approve or hide comments.
- Staff must be able to approve or reject streamer nominations.
- Review notes should be available for moderation decisions.
- Linked moderation reports should resolve when staff hides reported content.
- Moderation action history should retain status, reviewer, note, and reviewed timestamp.
- Fixture-based moderation audits must restore local data after each run.

## Marketplace-Specific Moderation Gates

- Off-platform deal pushing must remain reportable or removable.
- Suspected counterfeits, misleading condition claims, harassment, fraud, and rights issues need report categories before trading opens.
- Future listing moderation must preserve listing photos, condition changes, shipment evidence, dispute evidence, and report history.
- Repeat-offender and seller restriction processes should be documented before real transactions open.

## Launch Decision

Community and marketplace growth should not proceed until staff moderation controls pass, anonymous access is rejected, sensitive moderation APIs are `no-store`, marketplace policy readiness passes, and this moderation checklist remains current.

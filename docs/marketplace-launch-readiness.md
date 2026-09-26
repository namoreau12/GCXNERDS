# GCX Marketplace Launch Readiness Checklist

Last updated August 23, 2026.

GCX marketplace tools are beta-only. This checklist is an internal launch gate for future real-money trading, not a live seller agreement, checkout policy, payment policy, escrow policy, or legal approval.

## Required Status Before Transactions

- `marketplace.status` must remain `beta` until every gate below is complete.
- `realMoneyTradingEnabled` must remain `false`.
- `paymentsEnabled` must remain `false`.
- Collector waitlist submissions must remain interest-only and must not create public listings, trades, sales, shipping obligations, or buyer/seller contracts.
- Public pages must continue to state that trading, selling, listing publication, and payment processing are not live.

## Legal And Policy Gates

- Final terms of service reviewed for public transactions.
- Final privacy policy reviewed for transaction, seller, buyer, support, fraud, and payment-provider data handling.
- Seller agreement drafted before public seller onboarding.
- Buyer terms drafted before public checkout.
- Refund policy drafted before payment processing.
- Dispute policy drafted before payment processing.
- Shipping and delivery expectations drafted before payment processing.
- Fee schedule drafted before listing publication.
- Payment-provider terms reviewed before any provider integration is enabled.

## Seller And Listing Gates

- Seller identity and account verification requirements documented.
- High-risk item verification requirements documented.
- Prohibited-item policy documented for counterfeit, stolen, unsafe, illegal, recalled, or rights-infringing items.
- Condition standards documented for raw cards, graded cards, sealed products, video games, consoles, accessories, and mixed bundles.
- Photo requirements documented for front, back, serial numbers, seals, discs, cartridges, consoles, and accessories.
- Listing edit history and evidence retention requirements documented.
- Moderator review requirements documented for high-value or frequently counterfeited items.

## Payment And Transaction Gates

- Payment provider selected and approved for the intended marketplace model.
- Payment processing disabled in production until provider onboarding and policy review are complete.
- Seller payout timing and payout hold rules drafted.
- Chargeback and fraud workflow drafted.
- Tax/reporting responsibilities reviewed before seller onboarding.
- Refund, cancellation, and partial refund handling drafted.
- No escrow, wallet, stored balance, or payment-instruction language should appear publicly unless legally reviewed and implemented.

## Moderation And Support Gates

- Report categories documented for listings, profiles, comments, suspected counterfeits, fraud, harassment, off-platform deal pushing, and rights issues.
- Staff moderation tools verified for queue review, status updates, and evidence notes.
- Dispute intake form drafted.
- Support response expectations drafted.
- Repeat-offender and seller restriction process drafted.
- Evidence retention window drafted for listings, messages, photos, shipment proof, reports, and disputes.

## Launch Decision

Real-money trading should not open until the launch readiness report has no blockers, marketplace beta safety passes, legal/trust pages pass, staff moderation controls pass, sensitive API headers pass, and this marketplace checklist has been reviewed by qualified legal/payment/compliance support.

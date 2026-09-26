# GCX Editorial Media Policy

GCX articles should use visual media deliberately and conservatively.

## Permanent Gaming News Rule

GCX never generates a fake visual for a real game when official imagery exists.

For gaming news cards, featured stories, article hero images, and article headers, use this hierarchy:

1. Official game screenshots from the publisher, developer, platform holder, event organizer, official product page, or official press/media kit.
2. Official key art or promotional art from the same sources when no suitable screenshot is available.
3. Official trailer thumbnail or a relevant frame from the official trailer when the story is specifically about a trailer.
4. A clearly labeled generic fallback only when no official media exists or display rights are still pending.

Do not invent abstract editorial graphics, placeholder illustrations, geometric compositions, fake logos, baked headline art, or AI-created symbolic artwork for real game stories unless editorial leadership explicitly requests that treatment for a non-game explainer. Headlines, deks, labels, GCX badges, and story metadata belong in HTML/CSS, not inside the image file.

When story copy overlays imagery, the image must remain recognizable. Keep text anchored in the lower third with a restrained readability gradient, respect `heroImageFocalX` and `heroImageFocalY`, and avoid covering faces, characters, logos, or key artwork.

## Preferred Media Sources

- Official trailer embeds from the publisher, developer, platform holder, or event organizer.
- Official press screenshots, media-kit images, product pages, or approved store-page assets.
- GCX-owned editorial images and graphics.
- User-uploaded marketplace images only for the user's own physical item listings once marketplace flows are live.

## Screenshots

Screenshots may be used only when they directly support news reporting, criticism, commentary, or analysis. Use the smallest practical number, credit the owner, link to the source, and avoid recreating the underlying trailer, stream, or gallery.

Do not use leaked footage, NDA-breaching captures, watermarked reposts, or social-media screenshots as article media unless editorial leadership explicitly approves a source-link-only treatment.

## Trailers

Use official YouTube embeds instead of downloading or rehosting video. Do not cover the player controls with overlays, custom frames, or click-blocking UI.

## Card Images

Trading-card imagery should use approved data/API image paths, licensed/permissioned assets, official press material, or source-linked placeholders until usage rights are confirmed.

When card art is displayed, preserve the physical card ratio. Do not crop card faces into square tiles, wide banners, or stretched thumbnails. Card grids should use a consistent trading-card aspect ratio, and placeholder cards should use the same footprint so the page can be visually reviewed before final art is approved.

## Newsroom Media Fields

Future newsroom packages can include:

- `heroImage`: official lead screenshot, key art, promotional art, trailer thumbnail, or approved fallback URL
- `heroImageSource`: human-readable official source/provenance for the lead image
- `heroImageCredit`: visible credit, such as `Image: Square Enix`
- `heroImageAlt`: specific alt text describing the official media
- `heroImageFocalX` and `heroImageFocalY`: focal point percentages used by cards and heroes
- `trailerUrl`: official trailer URL when available
- story-level `mediaType`: `screenshot`, `key-art`, `promotional-art`, `trailer-thumbnail`, `fallback`, or `graphic`
- `mediaType`: `image`, `screenshot`, `trailer`, `video`, `gallery`, or `rights-note`
- `placement`: `lede`, `after-dek`, `after-body`, or `footer`
- `afterBlockIndex`: zero-based article body index
- `afterHeading`: heading text to place media after
- `imageUrl` or `embedUrl`
- `source`, `sourceUrl`, `caption`, `credit`, `altText`
- `rightsStatus`: `official-embed`, `press-asset`, `approved`, `owned`, `licensed`, `permission-granted`, `fair-use-review`, `source-link-only`, or `pending-review`

## Tables and Data Blocks

Tables are useful for prices, release waves, performance modes, comparison grids, and product trackers, but they must render as real article tables before publication.

Do not leave raw Markdown table separator rows visible in body copy. Text such as `| --- | ---: | --- |` is an input format, not reader-facing article text. If a newsroom package includes a table, GCX uses one of these paths:

- render it through the article table component, or
- convert it into a designed editorial module when the information is more visual than tabular.

Previews, search snippets, homepage cards, and related-story cards must strip table syntax from excerpt text.

## Placement Rules

- Put the first trailer embed near the claim or section it supports, usually `placement: "after-dek"` for a major gaming story.
- Use `afterHeading` for section-level visuals, such as a gameplay gallery after a combat section or a card grid after a checklist section.
- Use `afterBlockIndex` only when the article has no stable heading near the desired placement.
- Add no more than one visual module every few screenfuls unless the article is explicitly a visual checklist or product guide.

## Pre-Publish Media QA

- Confirm every displayed image has `altText`, `caption`, `credit`, `sourceUrl`, and a displayable `rightsStatus`.
- Confirm every trailer/video is an official embed from the publisher, developer, platform holder, event organizer, or another approved official channel.
- Confirm screenshots are limited, source-linked, and directly support the article's reporting or analysis.
- Confirm card imagery uses the GCX card aspect-ratio component and does not appear stretched, cropped, or mismatched in size.
- Confirm source-link-only media renders as a note, not as a broken or unapproved image.

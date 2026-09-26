# Game Image Review Workplan

Generated: 2026-09-26T00:50:29.500Z

## Current State

- Image coverage: 89.1%
- Missing images: 4,662
- Import-ready reviewed rows: 0
- Finishable platform rows prepared: 335

## Recommended Next Step

GAMEBOY Games needs an external reviewed source next: MobyGames or another reviewed commercial metadata provider; current direct/free strict passes are exhausted for the remaining rows.

## Import-Safe Row Requirements

A row should not be imported until it has all of these fields filled and reviewed:

- `imageUrl`: direct image URL
- `imageSourceUrl`: page or API source URL where the image was reviewed
- `imageProvider`: provider/source name
- `reviewStatus`: `approved`, `verified`, or `reviewed`
- `reviewer`: person or process that approved the row

Use the dry-run command before any real import:

```powershell
node scripts/import-game-image-urls.js data/games/milestone-review-batches/90-pct-image-review-batch.csv --dry-run --validate-remote
```

## Finishable Platform Batches

| Target | Missing/Rows | Current coverage | Batch | Provider state |
| --- | --- | --- | --- | --- |
| GAMEBOY Games | 39 | 98% | data/games/finishable-review-batches/gameboy-image-review-batch.csv | MobyGames or another reviewed commercial metadata provider; current direct/free strict passes are exhausted for the remaining rows. |
| SATURN Games | 41 | 96% | data/games/finishable-review-batches/saturn-image-review-batch.csv | MobyGames or another reviewed commercial metadata provider; current direct/free strict passes are exhausted for the remaining rows. |
| PS5 Games | 57 | 94.7% | data/games/finishable-review-batches/ps5-image-review-batch.csv | MobyGames or another reviewed commercial metadata provider; current direct/free strict passes are exhausted for the remaining rows. |
| WII Games | 67 | 95.8% | data/games/finishable-review-batches/wii-image-review-batch.csv | MobyGames or another reviewed commercial metadata provider; current direct/free strict passes are exhausted for the remaining rows. |
| DS Games | 131 | 96% | data/games/finishable-review-batches/ds-image-review-batch.csv | MobyGames or another reviewed commercial metadata provider; the current PriceCharting Nintendo DS sweep is now low-yield for the remaining rows. |

## Priority Platform Batches

| Target | Missing/Rows | Current coverage | Batch | Provider state |
| --- | --- | --- | --- | --- |
| PS2 Games | 727 | 83.2% | data/games/review-batches/ps2-image-review-batch.csv | MobyGames or another reviewed commercial metadata provider; current automated Libretro and PlayStation Chihiro passes are exhausted for the remaining PS2 rows. |
| VITA Games | 631 | 63.2% | data/games/review-batches/vita-image-review-batch.csv | Manual review rows can continue |
| PS3 Games | 607 | 73.7% | data/games/review-batches/ps3-image-review-batch.csv | Manual review rows can continue |
| SWITCH Games | 475 | 89.1% | data/games/review-batches/switch-image-review-batch.csv | Manual review rows can continue |
| 3DS Games | 460 | 74.5% | data/games/review-batches/3ds-image-review-batch.csv | MobyGames or another reviewed commercial metadata provider; current PriceCharting pass returned no safe imports for this checked chunk. |
| PSP Games | 445 | 76.7% | data/games/review-batches/psp-image-review-batch.csv | Manual review rows can continue |
| XBOX360 Games | 366 | 82.9% | data/games/review-batches/xbox360-image-review-batch.csv | Manual review rows can continue |
| PS4 Games | 311 | 91% | data/games/review-batches/ps4-image-review-batch.csv | Manual review rows can continue |

## Coverage Milestones

| Target | Additional images needed | Rows | Platforms | Batch |
| --- | --- | --- | --- | --- |
| 90% | 400 | 400 | ps2 | data/games/milestone-review-batches/90-pct-image-review-batch.csv |
| 95% | 2531 | 2531 | ps2, vita, ps3, switch, 3ds | data/games/milestone-review-batches/95-pct-image-review-batch.csv |
| 100% | 4662 | 4662 | ps2, vita, ps3, switch, 3ds, psp, xbox360, ps4, ps1, ds, wii, ps5, saturn, gameboy, gba, snes, xbox | data/games/milestone-review-batches/100-pct-image-review-batch.csv |

## Guardrails

- Import only rows with a direct image URL, direct source URL, provider name, approved/verified/reviewed status, and reviewer.
- Prefer official publisher/store/media-kit assets, then commercially appropriate providers after confirming terms.
- Do not bulk import scraped artwork, watermarked images, logos, screenshots, or mismatched regional covers as box art.

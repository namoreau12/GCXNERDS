# GCX Game Image Review Workflow

Use this workflow when filling missing game box art without enabling broad automated matches.

## 1. Export the queues

```powershell
$node='C:\Users\namor\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
& $node scripts\build-data-health-cleanup-queue.js
& $node scripts\export-game-image-queues.js
```

This creates:

- `data/games/review-image-batch.csv` - focused 50-row batch from the largest current backlog
- `data/games/review-batches/*.csv` - 100-row platform-specific batches for the largest current backlogs
- `data/games/priority-image-review-batches.json` - index used by the Data Health dashboard
- `data/games/finishable-review-batches/*.csv` - full platform batches for libraries closest to 100% image coverage
- `data/games/finishable-image-review-batches.json` - index for the finishable review batches
- `data/games/finishable-image-queue.csv` - smaller platforms closest to completion
- `data/games/missing-image-queue.csv` - full game image backlog

The CSVs are exported with a UTF-8 marker so Excel should preserve accented titles.

## 2. Choose the image source path

GCX uses one of two safe paths:

- **Provider-assisted bulk review:** add a commercially appropriate provider key to `.env`, validate it, then run a dry-run enrichment pipeline before importing anything.
- **Manual review:** fill the CSV fields yourself only after checking that the image matches the exact game and platform.

For the provider-assisted path, MobyGames is the current preferred candidate for bulk cover-art work because the GCX pipeline already supports it and the provider publishes API documentation and subscription information. Before using it for GCX production, confirm that the selected plan permits the site's intended use.

Useful links:

- MobyGames API documentation: `https://www.mobygames.com/info/api/`
- MobyGames API subscription page: `https://www.mobygames.com/api/subscribe/`
- MobyGames terms: `https://www.mobygames.com/info/terms/`

Add the key to `.env` only:

```powershell
MOBYGAMES_API_KEY=your_key_here
```

Do not put real provider keys in HTML, JavaScript, JSON data files, screenshots, docs, or commits.

Then validate without printing the key:

```powershell
& $node scripts\validate-image-provider-keys.js --mobygames
& $node scripts\report-image-provider-readiness.js
& $node scripts\audit-game-image-import-readiness.js
```

If validation passes, run a small dry run first:

```powershell
& $node scripts\run-priority-mobygames-image-enrichment.js --dry-run --limit-platforms=1 --limit-per-platform=10
```

Only run a real enrichment pass after reviewing the dry-run report, provider terms, and match quality.

## 3. Review only confident matches

Open `data/games/review-image-batch.csv` first for the single highest-priority batch, use `data/games/review-batches/` when you want to focus on a large platform backlog, or use `data/games/finishable-review-batches/` when you want to close a near-complete library. Fill only these columns for rows you personally verify:

- `imageUrl`
- `imageSourceUrl`
- `imageProvider`
- `notes`
- `reviewStatus` - use `approved`, `verified`, or `reviewed`
- `reviewer` - your name or initials

Leave uncertain rows blank. Blank `imageUrl` rows are ignored by the importer.

The importer rejects search-result URLs in `imageUrl`. Use the direct image URL for the cover art and put the source/catalog page in `imageSourceUrl`.

The Image Queue page scans review batches and shows how many rows are actually import-ready. A row is import-ready only when it has a direct `imageUrl`, valid `imageSourceUrl`, `imageProvider`, approved/verified/reviewed `reviewStatus`, and a `reviewer`.

## 4. Validate before import

```powershell
& $node scripts\import-game-image-urls.js data\games\review-image-batch.csv --dry-run --validate-remote
```

Fix rejected rows before importing. Common rejection reasons are invalid URLs, missing provider labels, title mismatches, duplicate rows, or remote URLs that do not return image content.

## 5. Import verified rows

```powershell
& $node scripts\import-game-image-urls.js data\games\review-image-batch.csv --validate-remote
```

The importer updates only games without images unless `--force` is passed. After import it rebuilds health reports and queue files.

## 6. Keep launch standards

Prefer official stores, publisher pages, MobyGames, or other commercially appropriate catalog sources. Do not use uncertain search-result thumbnails, fan art, watermarked images, or mismatched regional covers unless the listing clearly identifies the source and match.

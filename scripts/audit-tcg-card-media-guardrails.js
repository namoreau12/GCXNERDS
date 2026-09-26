const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const styles = fs.readFileSync(path.join(root, "styles.css"), "utf8");
const site = fs.readFileSync(path.join(root, "site.js"), "utf8");
const server = fs.readFileSync(path.join(root, "server.js"), "utf8");
const article = fs.readFileSync(path.join(root, "article.js"), "utf8");
const dataHealth = fs.readFileSync(path.join(root, "data-health.js"), "utf8");
const pokemon = fs.readFileSync(path.join(root, "script.js"), "utf8");
const magic = fs.readFileSync(path.join(root, "magic.js"), "utf8");
const magicCard = fs.readFileSync(path.join(root, "magic-card.js"), "utf8");
const yugioh = fs.readFileSync(path.join(root, "yugioh.js"), "utf8");
const yugiohCard = fs.readFileSync(path.join(root, "yugioh-card.js"), "utf8");
const card = fs.readFileSync(path.join(root, "card.js"), "utf8");
const importPokemon = fs.readFileSync(path.join(root, "scripts", "import-pokemon-data.js"), "utf8");
const importMagic = fs.readFileSync(path.join(root, "scripts", "import-magic-data.js"), "utf8");
const importYugioh = fs.readFileSync(path.join(root, "scripts", "import-yugioh-data.js"), "utf8");
const pipelineUtils = fs.readFileSync(path.join(root, "scripts", "tcg-card-pipeline-utils.js"), "utf8");
const displayableStatusBlock = site.match(/const displayableTcgImageStatuses = new Set\(\[([\s\S]*?)\]\);/)?.[1] || "";

const checks = [
  {
    label: "Shared TCG card aspect token exists",
    ok: /--tcg-card-aspect:\s*63\s*\/\s*88\s*;/.test(styles),
  },
  {
    label: "Pikachu card art uses shared TCG aspect token",
    ok: /\.pikachu-card-art\s*{[\s\S]*aspect-ratio:\s*var\(--tcg-card-aspect\)/.test(styles),
  },
  {
    label: "Pokemon/Magic/Yu-Gi-Oh grid card images use shared TCG aspect token",
    ok: /\.pokemon-card img,\s*[\r\n]\.card-tile img\s*{[\s\S]*aspect-ratio:\s*var\(--tcg-card-aspect\)/.test(styles),
  },
  {
    label: "Card detail images use shared TCG aspect token",
    ok: /\.card-detail\s+\.tcg-card-media\s*>\s*img\s*{[\s\S]*aspect-ratio:\s*var\(--tcg-card-aspect\)/.test(styles),
  },
  {
    label: "Runtime fallback classification recognizes Pikachu card art",
    ok: /pikachu-card-art/.test(site),
  },
  {
    label: "Runtime assigns portrait intrinsic dimensions to TCG card images",
    ok: /\["630",\s*"880"\]/.test(site),
  },
  {
    label: "Article renderer gates card images behind rights status",
    ok: /displayableImageRights/.test(article) && /canDisplayRightsManagedImage/.test(article),
  },
  {
    label: "Shared TCG image policy helper exists",
    ok: /window\.GCX_TCG_MEDIA/.test(site) && /inferTcgImagePolicy/.test(site) && /displayableTcgImageStatuses/.test(site),
  },
  {
    label: "Shared TCG canonical identity helper exists",
    ok: /window\.GCX_TCG_IDENTITY/.test(site) && /canonicalTcgCardKey/.test(site) && /dedupeTcgCards/.test(site),
  },
  {
    label: "Server enriches API card responses with canonical identity",
    ok: /function enrichCardIdentity/.test(server) && /canonicalCardKey/.test(server) && /cardApiPayload/.test(server),
  },
  {
    label: "Server dedupes Pokemon/Magic/Yu-Gi-Oh card API responses",
    ok:
      /cardApiPayload\(ordered,\s*url,\s*"pokemon"/.test(server) &&
      /cardApiPayload\(filtered,\s*url,\s*"magic"/.test(server) &&
      /cardApiPayload\(filtered,\s*url,\s*"yugioh"/.test(server),
  },
  {
    label: "Data health dashboard surfaces card system report",
    ok: /loadCardSystemHealth/.test(dataHealth) && /card-system-health\.json/.test(dataHealth),
  },
  {
    label: "Source-linked API card images can display with launch review notes",
    ok:
      displayableStatusBlock.includes("api-sourced-review-required") &&
      /Source-linked API card image\. Preserve the full card frame and review usage rights before launch/.test(site),
  },
  {
    label: "Missing card images use honest neutral fallback language",
    ok: /Image unavailable/.test(site) && /pikachu-card-art-unavailable/.test(article) && !/fallbackInitials\(label,\s*"card"\)/.test(site),
  },
  {
    label: "TCG detail and index pages render card images through the shared policy helper",
    ok: [pokemon, magic, magicCard, yugioh, yugiohCard, card].every((source) => /GCX_TCG_MEDIA\.renderImage/.test(source)),
  },
  {
    label: "TCG grids and search results dedupe rendered cards",
    ok: [pokemon, magic, yugioh].every((source) => /GCX_TCG_IDENTITY\.dedupeCards/.test(source) && /DUPLICATE_RENDER_ON_PAGE/.test(source)),
  },
  {
    label: "TCG detail pages wrap media and rights notes together",
    ok: [pokemon, magic, magicCard, yugioh, yugiohCard, card].every((source) => /tcg-card-media/.test(source)),
  },
  {
    label: "Standalone TCG detail pages expose collector identity fields",
    ok: [magicCard, yugiohCard, card].every((source) => /Collector Identity/.test(source) && /identity-list/.test(source) && /canonicalKey/.test(source)),
  },
  {
    label: "Magic and Yu-Gi-Oh detail pages load enriched API set records",
    ok: /\/api\/magic\/sets/.test(magicCard) && /\/api\/yugioh\/sets/.test(yugiohCard) && /\/api\/magic\/sets/.test(magic) && /\/api\/yugioh\/sets/.test(yugioh),
  },
  {
    label: "TCG import pipeline validates and dedupes before writing card data",
    ok:
      /function guardCardsForImport/.test(pipelineUtils) &&
      [importPokemon, importMagic, importYugioh].every((source) => /guardCardsForImport/.test(source)),
  },
  {
    label: "Pikachu guide uses neutral unavailable state for unapproved card images",
    ok: /Image held until usage rights are approved/.test(article) && /Image unavailable/.test(article),
  },
];

const failures = checks.filter((check) => !check.ok);

console.table(checks.map(({ label, ok }) => ({ check: label, ok })));

if (failures.length) {
  console.error(`TCG media guardrail audit failed: ${failures.map((failure) => failure.label).join("; ")}`);
  process.exit(1);
}

console.log("TCG media guardrails passed.");

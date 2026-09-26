const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const dataPath = path.join(rootDir, "data", "games", "switch.json");
const manifestPath = path.join(rootDir, "data", "games", "switch-manifest.json");
const sourceUrl = "https://www.nintendo.co.jp/data/software/xml/switch.xml";

function readJsonIfExists(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  const tempPath = `${filePath}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(value, null, 2));
  fs.renameSync(tempPath, filePath);
}

function decodeXml(value) {
  return String(value || "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function tagValue(block, tagName) {
  const match = block.match(new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`, "i"));
  return decodeXml(match?.[1] || "").trim();
}

function normalizeTitle(value) {
  return String(value || "")
    .replace(/[™®©]/g, "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\btm\b/gi, "")
    .replace(/\bneo\s*geo\b/gi, "neogeo")
    .replace(/&/g, " and ")
    .replace(/\b(nintendo switch|switch)\b/gim, "")
    .replace(/\b(edition|digital|download)\b/gim, "")
    .replace(/[^a-z0-9]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function parseTitleInfo(xml) {
  return Array.from(xml.matchAll(/<TitleInfo>([\s\S]*?)<\/TitleInfo>/g))
    .map((match) => {
      const block = match[1];
      return {
        title: tagValue(block, "TitleName"),
        maker: tagValue(block, "MakerName"),
        salesDate: tagValue(block, "SalesDate"),
        softType: tagValue(block, "SoftType"),
        platformId: tagValue(block, "PlatformID"),
        linkUrl: tagValue(block, "LinkURL"),
        imageUrl: tagValue(block, "ScreenshotImgURL"),
      };
    })
    .filter((item) => item.title && item.imageUrl);
}

function sourcePageUrl(item) {
  return item.linkUrl ? `https://www.nintendo.co.jp${item.linkUrl}` : sourceUrl;
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const games = readJsonIfExists(dataPath, null);
  const manifest = readJsonIfExists(manifestPath, {});
  if (!Array.isArray(games)) throw new Error("Switch game data was not found.");

  const response = await fetch(sourceUrl, {
    headers: {
      Accept: "application/xml,text/xml",
      "User-Agent": "GamesCardsExchange/0.1 (local Switch Nintendo JP image enrichment)",
    },
  });
  if (!response.ok) throw new Error(`Nintendo JP XML returned ${response.status}`);
  const xml = await response.text();
  const entries = parseTitleInfo(xml);
  const byTitle = new Map();

  for (const entry of entries) {
    const key = normalizeTitle(entry.title);
    if (!key || byTitle.has(key)) continue;
    byTitle.set(key, entry);
  }

  let matched = 0;
  const unmatched = [];
  for (const game of games.filter((item) => !item.imageUrl)) {
    const candidates = [game.title, ...(game.aliases || [])].map(normalizeTitle).filter(Boolean);
    const match = candidates.map((candidate) => byTitle.get(candidate)).find(Boolean);
    if (!match) {
      if (unmatched.length < 40) unmatched.push(game.title);
      continue;
    }

    if (!dryRun) {
      game.imageUrl = match.imageUrl;
      game.imageSourceUrl = sourcePageUrl(match);
      game.imageProvider = "Nintendo Japan official software catalog";
      game.imageMatchedTitle = match.title;
      game.imageMatchScore = 1000;
      game.healthUpdatedAt = new Date().toISOString();
    }
    matched += 1;
  }

  const imageCount = games.filter((game) => game.imageUrl).length;
  if (!dryRun) {
    writeJson(dataPath, games);
    writeJson(manifestPath, {
      ...manifest,
      nintendoJpImageEnrichedAt: new Date().toISOString(),
      nintendoJpImageSource: "Nintendo Japan official Switch software XML catalog",
      nintendoJpImageSourceUrl: sourceUrl,
      nintendoJpImageEntryCount: entries.length,
      nintendoJpImageLatestRunMatchCount: matched,
      nintendoJpImageTotalProviderCount: games.filter((game) => game.imageProvider === "Nintendo Japan official software catalog").length,
      nintendoJpImageUnmatchedSamples: unmatched,
      imageCount,
      missingImageCount: games.length - imageCount,
    });
  }

  console.log(JSON.stringify({ dryRun, entries: entries.length, matched, imageCount, missingImageCount: games.length - imageCount }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

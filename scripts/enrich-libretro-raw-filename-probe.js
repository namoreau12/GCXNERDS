const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesDir = path.join(rootDir, "data", "games");
const repoOwner = "libretro-thumbnails";
const branch = "master";

const repoNames = {
  "3ds": "Nintendo_-_Nintendo_3DS",
  dreamcast: "Sega_-_Dreamcast",
  ds: "Nintendo_-_Nintendo_DS",
  gameboy: "Nintendo_-_Game_Boy",
  gamecube: "Nintendo_-_GameCube",
  gba: "Nintendo_-_Game_Boy_Advance",
  genesis: "Sega_-_Mega_Drive_-_Genesis",
  n64: "Nintendo_-_Nintendo_64",
  nes: "Nintendo_-_Nintendo_Entertainment_System",
  ps1: "Sony_-_PlayStation",
  ps2: "Sony_-_PlayStation_2",
  ps3: "Sony_-_PlayStation_3",
  ps4: "Sony_-_PlayStation_4",
  psp: "Sony_-_PlayStation_Portable",
  saturn: "Sega_-_Saturn",
  snes: "Nintendo_-_Super_Nintendo_Entertainment_System",
  vita: "Sony_-_PlayStation_Vita",
  wii: "Nintendo_-_Wii",
  xbox: "Microsoft_-_Xbox",
  xbox360: "Microsoft_-_Xbox_360",
};

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const limit = Number((args.find((arg) => arg.startsWith("--limit=")) || "").split("=")[1] || 0);
const offset = Number((args.find((arg) => arg.startsWith("--offset=")) || "").split("=")[1] || 0);
const maxCandidates = Number((args.find((arg) => arg.startsWith("--max-candidates=")) || "").split("=")[1] || 24);
const concurrency = Number((args.find((arg) => arg.startsWith("--concurrency=")) || "").split("=")[1] || 8);
const requestedPlatforms = args.filter((arg) => !arg.startsWith("--"));

function readJsonIfExists(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  const tempPath = `${filePath}.tmp`;
  fs.writeFileSync(tempPath, `${JSON.stringify(value, null, 2)}\n`);
  fs.renameSync(tempPath, filePath);
}

function hasImage(game) {
  return Boolean(game.imageUrl || game.coverUrl || game.boxArtUrl || game.coverImage || game.thumbnailUrl);
}

function imageSignature(bytes) {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpeg";
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "png";
  if (bytes.length >= 6 && bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) return "gif";
  if (bytes.length >= 12 && bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) return "webp";
  return "";
}

function sourceUrlFromPath(filePath, baseUrl) {
  return `${baseUrl}${filePath.split("/").map(encodeURIComponent).join("/")}`;
}

function cleanTitle(value) {
  return String(value || "")
    .normalize("NFC")
    .replace(/[“”]/g, "\"")
    .replace(/[’]/g, "'")
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function titleVariants(title) {
  const clean = cleanTitle(title);
  const variants = new Set([clean]);
  variants.add(clean.replace(/:/g, " -"));
  variants.add(clean.replace(/:/g, " - "));
  variants.add(clean.replace(/\s*-\s*/g, " - "));
  variants.add(clean.replace(/\s*&\s*/g, " _ "));
  variants.add(clean.replace(/\s*&\s*/g, " and "));
  variants.add(clean.replace(/×/g, "x"));
  variants.add(clean.replace(/^\.hack\/\//i, "Dot Hack "));
  variants.add(clean.replace(/^\.hack/i, "Dot Hack"));
  variants.add(clean.replace(/^@/, ""));
  variants.add(clean.replace(/^[-\s]+/, ""));
  variants.add(clean.replace(/\s+/g, " "));
  return Array.from(variants)
    .map((value) => value.replace(/\s+/g, " ").trim())
    .filter((value) => value.length >= 2);
}

function regionTagsFor(game) {
  const regions = new Set([...(game.releasedRegions || []), ...Object.entries(game.releases || {}).filter(([, value]) => value).map(([key]) => key)]);
  const tags = [];
  if (regions.has("northAmerica") || regions.has("usa")) tags.push("USA");
  if (regions.has("europe") || regions.has("pal")) tags.push("Europe");
  if (regions.has("japan") || regions.has("asiaJapan")) tags.push("Japan");
  if (regions.has("australia") || regions.has("australasia")) tags.push("Australia");
  ["USA", "Europe", "Japan", "World"].forEach((tag) => {
    if (!tags.includes(tag)) tags.push(tag);
  });
  return tags;
}

function languageSuffixes(region) {
  if (region === "USA") return ["", " (En,Fr,Es)", " (En)", " (En,Fr)", " (En,Es)"];
  if (region === "Europe") return ["", " (En,Fr,De,Es,It)", " (En,Fr,De)", " (En,Fr,De,Nl)", " (En,Fr,Es)", " (En)"];
  if (region === "Japan") return ["", " (v1.01)", " (v1.02)", " (Rev 1)"];
  if (region === "Australia") return ["", " (En)"];
  return [""];
}

function candidateFileNames(game) {
  const names = new Set();
  const titleValues = [game.title, ...(game.aliases || [])].filter(Boolean);
  for (const title of titleValues) {
    for (const variant of titleVariants(title)) {
      for (const region of regionTagsFor(game)) {
        for (const suffix of languageSuffixes(region)) {
          names.add(`${variant} (${region})${suffix}.png`);
        }
      }
      names.add(`${variant}.png`);
    }
  }
  return Array.from(names).slice(0, maxCandidates);
}

async function fetchSignature(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);
  try {
    const response = await fetch(url, {
      headers: {
        Range: "bytes=0-15",
        "User-Agent": "GamesCardsExchange/0.1 local raw Libretro filename probe",
      },
      signal: controller.signal,
    });
    if (!response.ok) return "";
    const bytes = new Uint8Array(await response.arrayBuffer());
    return imageSignature(bytes);
  } catch {
    return "";
  } finally {
    clearTimeout(timeout);
  }
}

async function firstMatchingFile(fileNames, rawBaseUrl) {
  for (let index = 0; index < fileNames.length; index += concurrency) {
    const group = fileNames.slice(index, index + concurrency);
    const checked = await Promise.all(
      group.map(async (fileName) => {
        const filePath = `Named_Boxarts/${fileName}`;
        const rawUrl = sourceUrlFromPath(filePath, rawBaseUrl);
        const signature = await fetchSignature(rawUrl);
        return { fileName, signature };
      })
    );
    const match = checked.find((item) => item.signature);
    if (match) return { ...match, checked: index + checked.length };
  }
  return { fileName: "", signature: "", checked: fileNames.length };
}

async function enrichPlatform(slug) {
  const repoName = repoNames[slug];
  if (!repoName) throw new Error(`Unsupported platform: ${slug}`);
  const dataPath = path.join(gamesDir, `${slug}.json`);
  const manifestPath = path.join(gamesDir, `${slug}-manifest.json`);
  const reportPath = path.join(gamesDir, `${slug}-libretro-raw-probe-report.json`);
  const games = readJsonIfExists(dataPath, null);
  const manifest = readJsonIfExists(manifestPath, {});
  if (!Array.isArray(games)) return null;

  const rawBaseUrl = `https://raw.githubusercontent.com/${repoOwner}/${repoName}/${branch}/`;
  const htmlBaseUrl = `https://github.com/${repoOwner}/${repoName}/blob/${branch}/`;
  const candidates = games.filter((game) => !hasImage(game)).slice(offset, limit ? offset + limit : undefined);
  const samples = [];
  let matched = 0;
  let checkedUrls = 0;

  for (const game of candidates) {
    const fileNames = candidateFileNames(game);
    const match = await firstMatchingFile(fileNames, rawBaseUrl);
    checkedUrls += match.checked;
    if (match.signature) {
      const fileName = match.fileName;
      const filePath = `Named_Boxarts/${fileName}`;
      const rawUrl = sourceUrlFromPath(filePath, rawBaseUrl);
      if (!dryRun) {
        game.imageUrl = rawUrl;
        game.imageSourceUrl = sourceUrlFromPath(filePath, htmlBaseUrl);
        game.imageProvider = "libretro-thumbnails raw filename probe";
        game.imageMatchedTitle = fileName;
        game.imageMatchScore = 1000;
        game.healthUpdatedAt = new Date().toISOString();
        delete game.imageQualityNote;
      }
      matched += 1;
      if (samples.length < 60) samples.push({ title: game.title, matchedTitle: fileName });
    }
  }

  const imageCount = games.filter(hasImage).length;
  const report = {
    generatedAt: new Date().toISOString(),
    dryRun,
    offset,
    source: `raw.githubusercontent.com ${repoName} Named_Boxarts filename probing`,
    candidates: candidates.length,
    checkedUrls,
    matched,
    samples,
  };

  if (!dryRun) {
    writeJson(dataPath, games);
    writeJson(manifestPath, {
      ...manifest,
      libretroRawProbeEnrichedAt: new Date().toISOString(),
      libretroRawProbeMatchCount: (manifest.libretroRawProbeMatchCount || 0) + matched,
      imageCount,
      missingImageCount: games.length - imageCount,
    });
    writeJson(reportPath, report);
  }

  return { platform: slug, candidates: candidates.length, checkedUrls, matched, imageCount, total: games.length, samples };
}

async function main() {
  const platforms = requestedPlatforms.length ? requestedPlatforms : Object.keys(repoNames);
  const results = [];
  for (const platform of platforms) {
    const result = await enrichPlatform(platform);
    if (result) results.push(result);
  }
  console.table(results.map(({ platform, candidates, checkedUrls, matched, imageCount, total }) => ({ platform, candidates, checkedUrls, matched, imageCount, total, missing: total - imageCount })));
  for (const result of results) {
    if (!result.samples.length) continue;
    console.log(`\n${result.platform} samples:`);
    result.samples.slice(0, 20).forEach((sample) => console.log(`- ${sample.title} => ${sample.matchedTitle}`));
  }
  if (dryRun) console.log("Dry run only; no files were changed.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const wiiPath = path.join(rootDir, "data", "games", "wii.json");
const manifestPath = path.join(rootDir, "data", "games", "wii-manifest.json");

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const force = args.has("--force");
const sample = args.has("--sample");
const limitArg = process.argv.find((arg) => arg.startsWith("--limit="));
const limit = limitArg ? Number(limitArg.split("=")[1]) : 0;

const genericPageTerms = [
  "company",
  "corporation",
  "developer",
  "entertainment",
  "franchise",
  "list",
  "publisher",
  "series",
  "studio",
];

const sharedArticleLooseWorwii = new Set([
  "alpha",
  "bond",
  "fifa",
  "hack",
  "james",
  "robot",
  "wars",
]);

const titleStopWorwii = new Set([
  "advance",
  "adventure",
  "battle",
  "championship",
  "collection",
  "deluxe",
  "edition",
  "episode",
  "game",
  "games",
  "greatest",
  "hits",
  "international",
  "japan",
  "legend",
  "legenwii",
  "part",
  "playstation",
  "portable",
  "remix",
  "series",
  "special",
  "super",
  "ultimate",
  "version",
  "volume",
  "world",
]);

const gameSignals =
  /video game|computer game|console game|arcade game|role-playing|role playing|rpg|action-adventure|action adventure|platform game|platformer|shooter|shoot 'em up|shoot-em-up|fighting game|racing game|sports game|simulation|visual novel|adventure game|survival horror|stealth game|strategy game|tactical|rhythm game|music game|puzzle game|beat 'em up|beat-em-up|hack and slash|wrestling game|football game|basketball game|baseball game|soccer game|tennis game|golf game|snowboarding game|skateboarding game|vehicular combat/i;

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readJsonIfExists(filePath, fallback) {
  return fs.existsSync(filePath) ? readJson(filePath) : fallback;
}

function writeJson(filePath, value) {
  const tempPath = `${filePath}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(value, null, 2));
  fs.renameSync(tempPath, filePath);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function decodeHtml(value) {
  return String(value || "")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([a-f0-9]+);/gi, (_, code) => String.fromCharCode(Number.parseInt(code, 16)))
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&ndash;/g, "-")
    .replace(/&mdash;/g, "-")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function stripTags(value) {
  return decodeHtml(
    String(value || "")
      .replace(/<span[^>]*data-mw[^>]*>[\s\S]*?<\/span>/gi, "")
      .replace(/<sup[\s\S]*?<\/sup>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<table[\s\S]*?<\/table>/gi, "")
      .replace(/<figure[\s\S]*?<\/figure>/gi, "")
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<[^>]+>/g, " ")
  )
    .replace(/\[[^\]]+\]/g, "")
    .replace(/"\}\]\]\}'>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function worwii(value) {
  return normalizeText(value).split(/\s+/).filter(Boolean);
}

function pageTitleFromUrl(articleUrl) {
  try {
    const url = new URL(articleUrl, "https://en.wikipedia.org");
    if (url.hostname !== "en.wikipedia.org" || !url.pathname.startsWith("/wiki/")) return "";
    return decodeURIComponent(url.pathname.replace(/^\/wiki\//, "")).replaceAll("_", " ");
  } catch (error) {
    return "";
  }
}

function cleanArticleUrl(articleUrl) {
  if (!articleUrl) return null;
  if (/redlink=1|\/w\/index\.php/i.test(articleUrl)) return null;

  try {
    const url = new URL(articleUrl, "https://en.wikipedia.org");
    if (url.hostname !== "en.wikipedia.org" || !url.pathname.startsWith("/wiki/")) return null;
    url.search = "";
    return url;
  } catch (error) {
    return null;
  }
}

function canonicalArticleUrl(articleUrl) {
  const url = cleanArticleUrl(articleUrl);
  if (!url) return "";
  url.hash = "";
  return url.toString();
}

function titleWorwii(title) {
  const allWorwii = worwii(title)
    .filter((word) => word.length > 2)
    .filter((word) => !titleStopWorwii.has(word))
    .filter((word) => !/^\d+$/.test(word));
  return Array.from(new Set(allWorwii)).slice(0, 7);
}

function titlePhrases(title) {
  const normalizedTitle = normalizeText(title);
  const meaningful = worwii(title)
    .filter((word) => word.length > 1)
    .filter((word) => !titleStopWorwii.has(word))
    .filter((word) => !sharedArticleLooseWorwii.has(word));
  const phrases = new Set();

  if (normalizedTitle.length > 4) phrases.add(normalizedTitle);

  const colonParts = String(title || "").split(/[:–-]/).map((part) => normalizeText(part)).filter((part) => part.length > 4);
  colonParts.forEach((part) => phrases.add(part));

  for (let index = 0; index < meaningful.length - 1; index += 1) {
    phrases.add(`${meaningful[index]} ${meaningful[index + 1]}`);
  }

  if (meaningful.length === 1 && meaningful[0].length > 4) phrases.add(meaningful[0]);

  return Array.from(phrases).filter((phrase) => phrase.length > 4);
}

function titleLooksCloseToPage(game, sourceUrl) {
  const gameWorwii = titleWorwii(game.title);
  const pageWorwii = titleWorwii(pageTitleFromUrl(sourceUrl));
  if (!gameWorwii.length || !pageWorwii.length) return false;
  const overlap = gameWorwii.filter((word) => pageWorwii.includes(word)).length;
  return overlap >= Math.min(2, gameWorwii.length) || normalizeText(pageTitleFromUrl(sourceUrl)).includes(normalizeText(game.title).slice(0, 16));
}

function isObviouslyGenericArticle(articleUrl) {
  const pageWorwii = worwii(pageTitleFromUrl(articleUrl));
  return pageWorwii.some((word) => genericPageTerms.includes(word));
}

function paragraphHasTitleSignal(paragraph, game) {
  const lower = normalizeText(paragraph);
  const phrases = titlePhrases(game.title);
  if (!phrases.length) return true;
  return phrases.some((phrase) => lower.includes(phrase));
}

function paragraphHasDistinctSharedSignal(paragraph, game, sourceUrl) {
  const lower = normalizeText(paragraph);
  const pageWordSet = new Set(titleWorwii(pageTitleFromUrl(sourceUrl)));
  const distinctiveWorwii = titleWorwii(game.title).filter((word) => !pageWordSet.has(word) && !sharedArticleLooseWorwii.has(word));
  if (!distinctiveWorwii.length) return false;
  return distinctiveWorwii.some((word) => lower.includes(word));
}

function paragraphConflictsWithPlatform(paragraph, game) {
  const platformNames = [game.platform, ...(game.platforms || [])].map(normalizeText).filter(Boolean);
  const platformAliases = [
    ['playstation 5', ['playstation 5', 'ps5']],
    ['playstation 4', ['playstation 4', 'ps4']],
    ['playstation 3', ['playstation 3', 'ps3']],
    ['playstation 2', ['playstation 2', 'ps2']],
    ['playstation', ['playstation', 'ps1', 'psone']],
    ['playstation portable', ['playstation portable', 'psp']],
    ['playstation vita', ['playstation vita', 'ps vita', 'vita']],
    ['nintendo ds', ['nintendo ds', 'ds']],
    ['nintendo 3ds', ['nintendo 3ds', '3ds']],
    ['game boy color', ['game boy color', 'gbc']],
    ['game boy advance', ['game boy advance', 'gba']],
    ['game boy', ['game boy']],
    ['nintendo gamecube', ['nintendo gamecube', 'gamecube']],
    ['nintendo wii', ['nintendo wii', 'wii']],
    ['nintendo switch', ['nintendo switch', 'switch']],
    ['nintendo 64', ['nintendo 64', 'n64']],
    ['super nintendo', ['super nintendo', 'snes']],
    ['nintendo entertainment system', ['nintendo entertainment system', 'nes']],
    ['xbox 360', ['xbox 360']],
    ['xbox', ['xbox']],
    ['dreamcast', ['dreamcast']],
    ['sega saturn', ['sega saturn', 'saturn']],
    ['sega genesis', ['sega genesis', 'genesis', 'mega drive']],
  ];
  const wanted = new Set(platformNames.flatMap((name) => {
    const match = platformAliases.find(([, aliases]) => aliases.includes(name));
    return match ? match[1] : [name];
  }));
  const opening = normalizeText(paragraph.slice(0, 460));
  const mentioned = platformAliases.filter(([, aliases]) => aliases.some((alias) => opening.includes(alias)));
  if (!mentioned.length) return false;
  return !mentioned.some(([, aliases]) => aliases.some((alias) => wanted.has(alias)));
}
function isUsefulParagraph(paragraph, game, sourceUrl, articleUseCount) {
  if (!paragraph || paragraph.length < 95 || paragraph.length > 1800) return false;
  if (paragraphConflictsWithPlatform(paragraph, game)) return false;
  if (/may refer to:|can refer to:|list of|redirects here|not to be confused with/i.test(paragraph)) return false;
  const opening = paragraph.slice(0, 360);
  const mediaArticleSignal = /\b(anime television series|television series|book series|series of books|manga series|light novel series|animated series|film of the same name|novel of the same name|media franchise)\b/i;
  if (mediaArticleSignal.test(opening) && !/\b(video game|computer game|console game|arcade game)\b/i.test(opening)) return false;
  if (/\bseries of\b.{0,80}\bvideo games\b/i.test(opening) && articleUseCount > 1 && !paragraphHasDistinctSharedSignal(paragraph, game, sourceUrl)) return false;
  if (/^(this list|the following list|this article provides|this page provides|this list provides|the series follows|the franchise follows|a series of|several [^.]{0,80}video games?\b)\b/i.test(paragraph)) return false;
  if (/^(critics|reviewers) (gave|praised|criticized|criticised) the series\b/i.test(paragraph)) return false;
  if (/\b(review site|rated .*\d\/?\d|praised the title|criticized the title|criticised the title|said:|wrote:)\b/i.test(opening)) return false;
  if (/\b(is|are|was|were) (the title of )?(a|an)? ?[^.]{0,80}\bseries of\b.{0,120}\b(video games|games)\b/i.test(opening)) return false;
  if (/\b(the title of a series|appears in several|each [^.]{0,80} game consists)\b/i.test(opening)) return false;
  if (/\b(the series contains|series of|franchise of|library of|catalogue of|catalog of|media franchise)\b/i.test(paragraph) && (articleUseCount > 1 || !paragraphHasTitleSignal(paragraph, game))) return false;
  if (!gameSignals.test(paragraph)) return false;

  const closePage = titleLooksCloseToPage(game, sourceUrl);
  const hasTitleSignal = paragraphHasTitleSignal(paragraph, game);
  const genericArticle = isObviouslyGenericArticle(sourceUrl);

  if (genericArticle) return false;
  if (articleUseCount > 1 && !paragraphHasDistinctSharedSignal(paragraph, game, sourceUrl)) return false;
  return hasTitleSignal && (closePage || paragraphHasDistinctSharedSignal(paragraph, game, sourceUrl) || articleUseCount === 1);
}

function trimToOverview(paragraph) {
  const clean = paragraph
    .replace(/\s+\(\s*\)/g, "")
    .replace(/\s+,\s+/g, ", ")
    .replace(/\s+\./g, ".")
    .trim();
  const sentences = clean.match(/[^.!?]+[.!?]+/g) || [clean];
  let overview = "";

  for (const sentence of sentences) {
    const next = `${overview} ${sentence.trim()}`.trim();
    if (next.length > 560 && overview) break;
    overview = next;
    if (overview.length >= 230) break;
  }

  if (overview.length < 140 && clean.length > overview.length) {
    overview = clean.slice(0, 520).replace(/\s+\S*$/, "").trim();
  }

  return overview;
}

function extractParagraphs(html) {
  return Array.from(html.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi))
    .map((match) => stripTags(match[1]))
    .filter(Boolean);
}

function extractSections(html) {
  const sections = [];
  const headingRegex = /<h([2-4])\b[^>]*>([\s\S]*?)<\/h\1>/gi;
  const matches = Array.from(html.matchAll(headingRegex));

  matches.forEach((match, index) => {
    const headingHtml = match[2];
    const start = match.index + match[0].length;
    const end = index + 1 < matches.length ? matches[index + 1].index : html.length;
    const idMatch = headingHtml.match(/id="([^"]+)"/i);
    const heading = stripTags(headingHtml);
    const paragraphs = extractParagraphs(html.slice(start, end));
    sections.push({
      id: idMatch ? decodeHtml(idMatch[1]) : "",
      heading,
      paragraphs,
    });
  });

  return sections;
}

function anchorParagraphs(html, sourceUrl) {
  const url = cleanArticleUrl(sourceUrl);
  if (!url?.hash) return [];
  const wanted = normalizeText(decodeURIComponent(url.hash.slice(1)));
  if (!wanted) return [];

  const section = extractSections(html).find((candidate) => {
    return normalizeText(candidate.id) === wanted || normalizeText(candidate.heading) === wanted;
  });

  return section?.paragraphs || [];
}

function bestOverviewFromHtml(html, game, sourceUrl, articleUseCount) {
  const anchored = anchorParagraphs(html, sourceUrl);
  const paragraphs = [...anchored, ...extractParagraphs(html)];
  const seen = new Set();

  for (const paragraph of paragraphs) {
    const key = normalizeText(paragraph).slice(0, 180);
    if (seen.has(key)) continue;
    seen.add(key);
    if (!isUsefulParagraph(paragraph, game, sourceUrl, articleUseCount)) continue;
    return trimToOverview(paragraph);
  }

  return "";
}

async function fetchOverview(game, articleUseCount) {
  const sourceUrl = canonicalArticleUrl(game.articleUrl);
  if (!sourceUrl) return null;

  const response = await fetch(sourceUrl, {
    headers: {
      Accept: "text/html",
      "User-Agent": "GamesCarwiiExchange/0.1 (local WII overview enrichment; contact: local-dev)",
    },
  });

  if (!response.ok) return null;

  const html = await response.text();
  const finalUrl = response.url && response.url.startsWith("https://en.wikipedia.org/wiki/") ? response.url : sourceUrl;
  const overview = bestOverviewFromHtml(html, game, finalUrl, articleUseCount);
  if (!overview) return null;

  return {
    overview,
    sourceUrl: finalUrl,
  };
}

function statusCounts(games) {
  return games.reduce((counts, game) => {
    const status = game.overviewStatus || "unknown";
    counts[status] = (counts[status] || 0) + 1;
    return counts;
  }, {});
}

function providerCounts(games) {
  return games.reduce((counts, game) => {
    const provider = game.descriptionProvider || "none";
    counts[provider] = (counts[provider] || 0) + 1;
    return counts;
  }, {});
}

function updateSearchText(game) {
  const base = [game.title, game.platform, ...(game.publishers || []), ...(game.developers || []), ...(game.genres || []), game.description || ""]
    .filter(Boolean)
    .join(" ");
  game.searchText = normalizeText(base);
}

function save(games, manifest, stats) {
  if (dryRun) return;
  writeJson(wiiPath, games);
  writeJson(manifestPath, {
    ...manifest,
    wikipediaOverviewEnrichedAt: new Date().toISOString(),
    wikipediaOverviewProvider: "Wikipedia direct article overview",
    wikipediaOverviewStats: stats,
    overviewStatusCounts: statusCounts(games),
    descriptionProviderCounts: providerCounts(games),
  });
}

async function main() {
  const games = readJson(wiiPath);
  const manifest = readJsonIfExists(manifestPath, {});
  const articleUseCounts = games.reduce((counts, game) => {
    const sourceUrl = canonicalArticleUrl(game.articleUrl);
    if (sourceUrl) counts.set(sourceUrl, (counts.get(sourceUrl) || 0) + 1);
    return counts;
  }, new Map());
  const stats = {
    attempted: 0,
    enriched: 0,
    skippedNoSource: games.filter((game) => !canonicalArticleUrl(game.articleUrl)).length,
    skippedAlreadyPublished: games.filter((game) => game.overviewStatus === "published" && !force).length,
    skippedNoOverview: 0,
    failed: 0,
  };
  let targets = games
    .filter((game) => force || game.overviewStatus !== "published" || !game.descriptionProvider || !game.description)
    .filter((game) => canonicalArticleUrl(game.articleUrl));

  if (limit > 0) targets = targets.slice(0, limit);

  const concurrency = 4;
  let cursor = 0;

  console.log(`${dryRun ? "Dry-run " : ""}WII overview targets: ${targets.length}`);

  while (cursor < targets.length) {
    const batch = targets.slice(cursor, cursor + concurrency);
    const results = await Promise.allSettled(
      batch.map((game) => fetchOverview(game, articleUseCounts.get(canonicalArticleUrl(game.articleUrl)) || 1))
    );

    results.forEach((result, index) => {
      const game = batch[index];
      stats.attempted += 1;

      if (result.status !== "fulfilled") {
        stats.failed += 1;
        return;
      }

      if (!result.value) {
        stats.skippedNoOverview += 1;
        return;
      }

      if (sample || dryRun) {
        console.log(`\n${game.title}`);
        console.log(result.value.overview);
      }

      if (!dryRun) {
        game.description = result.value.overview;
        game.descriptionProvider = "Wikipedia direct article overview";
        game.descriptionSourceUrl = result.value.sourceUrl;
        game.overviewStatus = "published";
        updateSearchText(game);
      }

      stats.enriched += 1;
    });

    cursor += concurrency;

    if (cursor % 80 === 0 || cursor >= targets.length) {
      save(games, manifest, stats);
      console.log(`Processed ${cursor}/${targets.length}; enriched ${stats.enriched}; published ${statusCounts(games).published || 0}/${games.length}.`);
    }

    await sleep(300);
  }

  save(games, manifest, stats);
  console.log(`Published WII overviews: ${statusCounts(games).published || 0}/${games.length}.`);
  console.log(`Still needing editorial: ${statusCounts(games).needs_editorial || 0}.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

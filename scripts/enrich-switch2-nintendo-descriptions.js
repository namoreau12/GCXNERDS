const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const switch2Path = path.join(rootDir, "data", "games", "switch2.json");
const manifestPath = path.join(rootDir, "data", "games", "switch2-manifest.json");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  const tempPath = `${filePath}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(value, null, 2));
  fs.renameSync(tempPath, filePath);
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

function cleanDescription(value) {
  return decodeHtml(value)
    .replace(/\s+/g, " ")
    .replace(/\s+\./g, ".")
    .trim();
}

function extractMetaDescription(html) {
  const meta = html.match(/<meta\b(?=[^>]*\bname=["']description["'])(?=[^>]*\bcontent=["']([^"']+)["'])[^>]*>/i);
  return cleanDescription(meta?.[1] || "");
}

function stripHtml(value) {
  return cleanDescription(
    String(value || "")
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<\/p>/gi, " ")
      .replace(/<[^>]+>/g, " ")
  );
}

function isWeakStoreDescription(value) {
  return /^Shop .+ for Nintendo Switch 2 at Nintendo Store\. See game details, editions, and availability\.?$/i.test(
    String(value || "")
  );
}

function firstUsefulSentences(value, maxLength = 260) {
  const text = stripHtml(value);
  if (!text || isWeakStoreDescription(text)) return "";

  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  let output = "";

  for (const sentence of sentences) {
    const next = `${output} ${sentence.trim()}`.trim();
    if (next.length > maxLength && output) break;
    output = next;
    if (output.length >= 120) break;
  }

  return output || text.slice(0, maxLength).trim();
}

function extractProductData(html, game) {
  const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
  if (!match) return null;

  const data = JSON.parse(match[1]);
  const apolloState = data.props?.pageProps?.initialApolloState || {};
  const products = Object.entries(apolloState)
    .filter(([key]) => key.startsWith("Product:"))
    .map(([key, value]) => ({ key, value }))
    .filter(Boolean);

  return (
    products.find((product) => product.key.includes(`"sku":"${game.sku}"`))?.value ||
    products.find((product) => product.key.includes(`"nsuid":"${game.nsuid}"`))?.value ||
    products.find((product) => product.value?.sku === game.sku)?.value ||
    products.find((product) => product.value?.nsuid === game.nsuid)?.value ||
    products[0]?.value ||
    null
  );
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchNintendoDescription(game) {
  if (!game.sourceUrl) return "";

  const response = await fetch(game.sourceUrl, {
    headers: {
      Accept: "text/html",
      "User-Agent": "GamesCardsExchange/0.1 (local Switch 2 Nintendo description enrichment)",
    },
  });

  if (!response.ok) {
    console.warn(`Skipped ${game.title}: ${response.status}`);
    return "";
  }

  const html = await response.text();
  const product = extractProductData(html, game);
  const headline = firstUsefulSentences(product?.headline, 220);
  const productDescription = firstUsefulSentences(product?.description, 280);
  const metaDescription = firstUsefulSentences(extractMetaDescription(html), 220);
  const description = productDescription && (!headline || headline.length < 80)
    ? productDescription
    : headline || productDescription || metaDescription;

  if (!description || /whoops|nintendo official site/i.test(description) || isWeakStoreDescription(description)) {
    return "";
  }

  return {
    description,
    sourceType: description === productDescription
      ? "Nintendo Store product description"
      : headline
        ? "Nintendo Store product headline"
        : "Nintendo Store meta description",
  };
}

async function main() {
  const games = readJson(switch2Path);
  const manifest = fs.existsSync(manifestPath) ? readJson(manifestPath) : {};
  let updated = 0;

  for (const game of games) {
    const result = await fetchNintendoDescription(game);

    if (result?.description && !isWeakStoreDescription(result.description)) {
      game.description = result.description;
      game.descriptionProvider = result.sourceType;
      game.descriptionSourceUrl = game.sourceUrl;
      game.overviewStatus = "published";
      updated += 1;
    } else if (!game.descriptionProvider || isWeakStoreDescription(game.description)) {
      game.description = "";
      delete game.descriptionProvider;
      delete game.descriptionSourceUrl;
      game.overviewStatus = "needs_editorial";
    }

    delete game.importDescription;
    await sleep(250);
  }

  writeJson(switch2Path, games);
  writeJson(manifestPath, {
    ...manifest,
    nintendoDescriptionEnrichedAt: new Date().toISOString(),
    nintendoDescriptionProvider: "Nintendo Store product page headline/description/meta fields",
    nintendoDescriptionCount: games.filter((game) => game.descriptionProvider?.startsWith("Nintendo Store")).length,
    overviewStatusCounts: games.reduce((counts, game) => {
      const status = game.overviewStatus || "unknown";
      counts[status] = (counts[status] || 0) + 1;
      return counts;
    }, {}),
  });

  console.log(`Nintendo descriptions available for ${updated}/${games.length} Switch 2 records.`);
  console.log(`Titles still needing editorial overview: ${games.filter((game) => game.overviewStatus === "needs_editorial").length}.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

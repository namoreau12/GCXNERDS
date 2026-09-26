const baseUrl = process.env.GCX_AUDIT_BASE_URL || "http://localhost:3000";

const pagePaths = [
  "/pokemon.html",
  "/magic.html",
  "/yugioh.html",
  "/card.html?id=base1-1",
  "/magic-card.html?set=lea&id=d5c83259-9b90-47c2-b48e-c7d78519e792",
  "/yugioh-card.html?set=2-player-starter-set&id=20721928-STAS-EN001",
  "/data-health.html",
];

const cardApiChecks = [
  {
    label: "Pokemon card search",
    url: "/api/pokemon/cards?q=id:base1-1&pageSize=1&page=1",
    franchise: "pokemon",
  },
  {
    label: "Magic set cards",
    url: "/api/magic/sets/lea",
    franchise: "magic",
  },
  {
    label: "Yu-Gi-Oh set cards",
    url: "/api/yugioh/sets/2-player-starter-set",
    franchise: "yugioh",
  },
];

async function fetchText(path) {
  const response = await fetch(new URL(path, baseUrl));
  const text = await response.text();
  return { response, text };
}

function hasDuplicateCanonicalKeys(cards) {
  const seen = new Set();
  for (const card of cards) {
    if (!card.canonicalKey) continue;
    if (seen.has(card.canonicalKey)) return true;
    seen.add(card.canonicalKey);
  }
  return false;
}

function validateCardApiPayload(label, payload) {
  const cards = payload.data || [];
  const first = cards[0] || {};
  const requiredFields = ["cardId", "cardName", "setCode", "cardNumberDisplay", "imageStatus", "canonicalKey"];
  const missingFields = requiredFields.filter((field) => !first[field]);
  if (!cards.length) throw new Error(`${label} returned no cards.`);
  if (missingFields.length) throw new Error(`${label} missing enriched fields: ${missingFields.join(", ")}`);
  if (hasDuplicateCanonicalKeys(cards)) throw new Error(`${label} returned duplicate canonical cards.`);
  if (!first.imageFront && !first.imageThumbnail && first.imageStatus !== "missing") {
    throw new Error(`${label} returned no image URL without marking the card missing.`);
  }
}

async function main() {
  const results = [];

  for (const path of pagePaths) {
    const { response, text } = await fetchText(path);
    results.push({ surface: path, status: response.status, ok: response.ok, bytes: text.length });
    if (!response.ok) throw new Error(`${path} returned HTTP ${response.status}`);
  }

  for (const check of cardApiChecks) {
    const { response, text } = await fetchText(check.url);
    if (!response.ok) throw new Error(`${check.label} returned HTTP ${response.status}`);
    const payload = JSON.parse(text);
    validateCardApiPayload(check.label, payload);
    results.push({
      surface: check.label,
      status: response.status,
      ok: true,
      count: payload.count ?? payload.data?.length ?? 0,
      totalCount: payload.totalCount ?? payload.data?.length ?? 0,
    });
  }

  console.table(results);
  console.log("TCG runtime surface audit passed.");
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});

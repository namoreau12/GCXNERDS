const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const cardsPath = path.join(rootDir, "data", "pokemon", "cards.json");
const cardsBySetDir = path.join(rootDir, "data", "pokemon", "cards-by-set");
const reportPath = path.join(rootDir, "data", "launch-readiness", "pokemon-card-duplicate-repair.json");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function richnessScore(card) {
  return JSON.stringify(card).length + (card.images?.large ? 500 : 0) + (card.tcgplayer?.prices ? 250 : 0) + (card.cardmarket?.prices ? 150 : 0);
}

function mergeExactDuplicateRecords(records) {
  const best = [...records].sort((a, b) => richnessScore(b) - richnessScore(a))[0];
  const merged = { ...best };

  for (const record of records) {
    for (const [key, value] of Object.entries(record)) {
      if (merged[key] == null || merged[key] === "" || (Array.isArray(merged[key]) && !merged[key].length)) {
        merged[key] = value;
      }
    }
  }

  return merged;
}

function dedupeExactById(cards = []) {
  const groups = new Map();
  for (const card of cards) {
    const id = String(card.id || "").trim();
    if (!id) continue;
    if (!groups.has(id)) groups.set(id, []);
    groups.get(id).push(card);
  }

  const duplicates = [...groups.entries()].filter(([, records]) => records.length > 1);
  const mergedById = new Map();
  for (const [id, records] of duplicates) mergedById.set(id, mergeExactDuplicateRecords(records));

  const seen = new Set();
  const repaired = [];
  for (const card of cards) {
    const id = String(card.id || "").trim();
    if (!id) {
      repaired.push(card);
      continue;
    }
    if (seen.has(id)) continue;
    seen.add(id);
    repaired.push(mergedById.get(id) || card);
  }

  return {
    cards: repaired,
    duplicateGroups: duplicates.map(([id, records]) => ({
      id,
      count: records.length,
      setId: records[0]?.set?.id || "",
      setName: records[0]?.set?.name || "",
      name: records[0]?.name || "",
      number: records[0]?.number || "",
    })),
    removedCount: cards.length - repaired.length,
  };
}

const allCards = readJson(cardsPath);
const allRepair = dedupeExactById(allCards);
writeJson(cardsPath, allRepair.cards);

const setRepairs = [];
for (const fileName of fs.readdirSync(cardsBySetDir).filter((name) => name.endsWith(".json"))) {
  const filePath = path.join(cardsBySetDir, fileName);
  const cards = readJson(filePath);
  const repair = dedupeExactById(cards);
  if (!repair.removedCount) continue;
  writeJson(filePath, repair.cards);
  setRepairs.push({
    file: path.relative(rootDir, filePath),
    removedCount: repair.removedCount,
    duplicateGroupCount: repair.duplicateGroups.length,
    duplicateGroups: repair.duplicateGroups.slice(0, 25),
  });
}

const report = {
  ok: true,
  generatedAt: new Date().toISOString(),
  repairedFiles: [
    {
      file: "data/pokemon/cards.json",
      removedCount: allRepair.removedCount,
      duplicateGroupCount: allRepair.duplicateGroups.length,
      duplicateGroups: allRepair.duplicateGroups.slice(0, 50),
    },
    ...setRepairs,
  ].filter((item) => item.removedCount),
  totalRemovedRecords: allRepair.removedCount + setRepairs.reduce((sum, item) => sum + item.removedCount, 0),
  note: "Only exact duplicate Pokemon records with the same API card id were merged. Variant-looking records were left untouched.",
};

writeJson(reportPath, report);
console.log(JSON.stringify({ ok: true, totalRemovedRecords: report.totalRemovedRecords, repairedFiles: report.repairedFiles.length, reportPath: path.relative(rootDir, reportPath) }, null, 2));

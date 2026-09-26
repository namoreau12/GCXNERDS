const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const setsPath = path.join(rootDir, "data", "pokemon", "sets.json");
const outputDir = path.join(rootDir, "data", "launch-readiness");
const outputPath = path.join(outputDir, "pokemon-set-quality.json");

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function isSupplementalPokemonSet(set) {
  const id = normalize(set.id);
  const name = normalize(set.name);
  const series = normalize(set.series);
  return (
    series === "pop" ||
    id === "sve" ||
    id.endsWith("p") ||
    id.endsWith("tg") ||
    id.endsWith("gg") ||
    id.endsWith("sv") ||
    id.startsWith("mcd") ||
    id.startsWith("pop") ||
    id.startsWith("tk") ||
    ["black star promos", "trainer gallery", "galarian gallery", "shiny vault", "classic collection", "mcdonald", "trainer kit", "energies"].some((term) =>
      name.includes(term)
    )
  );
}

function duplicateGroups(items, keyFn) {
  const groups = new Map();
  items.forEach((item) => {
    const key = keyFn(item);
    if (!key) return;
    groups.set(key, [...(groups.get(key) || []), item]);
  });
  return [...groups.entries()]
    .filter(([, group]) => group.length > 1)
    .map(([key, group]) => ({
      key,
      count: group.length,
      ids: group.map((item) => item.id),
      names: group.map((item) => item.name),
    }));
}

function main() {
  const sets = JSON.parse(fs.readFileSync(setsPath, "utf8"));
  const duplicateIds = duplicateGroups(sets, (set) => normalize(set.id));
  const duplicateNamesInSeries = duplicateGroups(sets, (set) => `${normalize(set.series)}:${normalize(set.name)}`);
  const supplementalSets = sets.filter(isSupplementalPokemonSet);
  const mainSets = sets.filter((set) => !isSupplementalPokemonSet(set));
  const supplementalInMain = mainSets.filter(isSupplementalPokemonSet);
  const missingIdentity = sets.filter((set) => !set.id || !set.name || !set.series);
  const missingImages = sets.filter((set) => !set.images?.logo && !set.images?.symbol);
  const failures = [
    ...duplicateIds.map((item) => `Duplicate Pokemon set id: ${item.key}`),
    ...duplicateNamesInSeries.map((item) => `Duplicate Pokemon set name in series: ${item.key}`),
    ...missingIdentity.map((item) => `Pokemon set missing id/name/series: ${item.id || item.name || "unknown"}`),
    ...supplementalInMain.map((item) => `Supplemental set appears in main view: ${item.id}`),
  ];

  const report = {
    generatedAt: new Date().toISOString(),
    ok: failures.length === 0,
    totalSets: sets.length,
    mainExpansionSets: mainSets.length,
    supplementalSets: supplementalSets.length,
    duplicateIds,
    duplicateNamesInSeries,
    missingIdentity: missingIdentity.map((set) => set.id || set.name || "unknown"),
    missingImageCount: missingImages.length,
    supplementalExamples: supplementalSets.slice(0, 12).map((set) => ({
      id: set.id,
      name: set.name,
      series: set.series,
    })),
    failures,
  };

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.ok ? 0 : 1);
}

try {
  main();
} catch (error) {
  console.error(error.message || error);
  process.exit(1);
}

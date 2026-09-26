const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const newsroomPath = path.join(rootDir, "data", "newsroom.json");
const reportPath = path.join(rootDir, "data", "launch-readiness", "newsroom-internal-language-cleanup.json");

const replacements = [
  [/What GCX can say/g, "Confirmed framing"],
  [/What GCX should not say yet/g, "What is not confirmed"],
  [
    /GCX should use official gameplay pages, official trailers, or source-linked notes for Pokemon battle-system comparisons\. Do not use leaked or speculative gameplay captures\./g,
    "Only official gameplay pages, official trailers, or source-linked notes are suitable for Pokemon battle-system comparisons; leaked or speculative gameplay captures stay out of this guide.",
  ],
  [
    /GCX should not publish leaked artist names or checklist guesses as confirmed facts\./g,
    "Leaked artist names or checklist guesses are not treated as confirmed facts.",
  ],
  [/the row should move from placeholder status to revealed status/g, "the row moves from placeholder status to revealed status"],
  [
    /GCX should not publish a clean [“"]1-in-30[”"] claim/g,
    'This guide does not publish a clean "1-in-30" claim',
  ],
  [/this watchlist should receive one approved visual per top entry/g, "this watchlist will receive one approved visual per top entry"],
  [
    /GCX should avoid dressing rumor or placeholder coverage as confirmed media\./g,
    "Rumor or placeholder coverage is not presented as confirmed media.",
  ],
  [/GCX should not move games from rumored to confirmed/g, "Games are not moved from rumored to confirmed"],
  [/GCX should update this answer/g, "This answer will be updated"],
  [/GCX should update this guide/g, "This guide will be updated"],
  [/\bGCX should\b/g, "This guide should"],
  [/\bso This guide does not publish\b/g, "so this guide does not publish"],
  [/\bUntil then, Rumor or placeholder coverage\b/g, "Until then, rumor or placeholder coverage"],
];

function writeJsonAtomic(filePath, value) {
  const tmpPath = `${filePath}.tmp`;
  fs.writeFileSync(tmpPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  fs.renameSync(tmpPath, filePath);
}

function cleanString(value, changes, trail) {
  let next = value;
  for (const [pattern, replacement] of replacements) {
    next = next.replace(pattern, replacement);
  }

  if (next !== value) {
    changes.push({
      path: trail.join("."),
      before: value,
      after: next,
    });
  }

  return next;
}

function walk(value, changes, trail = []) {
  if (typeof value === "string") return cleanString(value, changes, trail);
  if (Array.isArray(value)) return value.map((item, index) => walk(item, changes, trail.concat(index)));
  if (!value || typeof value !== "object") return value;

  const next = {};
  for (const [key, child] of Object.entries(value)) {
    next[key] = walk(child, changes, trail.concat(key));
  }
  return next;
}

function main() {
  const newsroom = JSON.parse(fs.readFileSync(newsroomPath, "utf8"));
  const changes = [];
  const cleaned = walk(newsroom, changes);

  if (changes.length > 0) writeJsonAtomic(newsroomPath, cleaned);

  const report = {
    ok: true,
    generatedAt: new Date().toISOString(),
    changedStringCount: changes.length,
    changes: changes.slice(0, 50),
    truncatedChanges: Math.max(0, changes.length - 50),
  };

  writeJsonAtomic(reportPath, report);
  console.log(JSON.stringify(report, null, 2));
}

main();

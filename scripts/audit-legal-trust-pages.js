const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const outputPath = path.join(rootDir, "data", "launch-readiness", "legal-trust-pages.json");

const checks = [
  {
    file: "privacy.html",
    required: ["Last updated August 23, 2026", "Beta notice", "Your Choices", "GCX Contact", "payment obligations"],
  },
  {
    file: "terms.html",
    required: [
      "Last updated August 23, 2026",
      "Beta Scope",
      "not a final transaction marketplace agreement",
      "GCX Contact",
      "Trading, selling, payment processing, and listing publication are not live",
      "Images, Artwork, and Third-Party IP",
      "not affiliated with or endorsed by those owners",
    ],
  },
  {
    file: "marketplace-rules.html",
    required: ["Last updated August 23, 2026", "waitlist only", "not a live seller agreement", "GCX Contact", "Trading is coming soon, not live"],
  },
  {
    file: "trust.html",
    required: [
      "trading stays in beta",
      "Presale pricing is never described as settled market value",
      "Real-money trading will not open",
      "Image Rights",
      "Rights-managed card art should stay source-link-only",
    ],
  },
  {
    file: "pokemon.html",
    required: ["approved card images where available", "metadata-first placeholders", "trust.html#image-rights", "approved imagery when available"],
    forbidden: ["with official card artwork"],
  },
  {
    file: "magic.html",
    required: ["approved card images where available", "metadata-first placeholders", "trust.html#image-rights", "approved imagery when available"],
    forbidden: ["with Scryfall card artwork"],
  },
  {
    file: "yugioh.html",
    required: ["approved card images where available", "metadata-first placeholders", "trust.html#image-rights", "approved imagery when available"],
    forbidden: ["with YGOPRODeck card artwork"],
  },
];

function normalize(value) {
  return String(value || "").replace(/\s+/g, " ").toLowerCase();
}

function main() {
  const failures = [];

  checks.forEach((check) => {
    const filePath = path.join(rootDir, check.file);
    const text = fs.readFileSync(filePath, "utf8");
    const normalized = normalize(text);
    (check.required || []).forEach((phrase) => {
      if (!normalized.includes(normalize(phrase))) {
        failures.push({ file: check.file, issue: `Missing required phrase: ${phrase}` });
      }
    });
    (check.forbidden || []).forEach((phrase) => {
      if (normalized.includes(normalize(phrase))) {
        failures.push({ file: check.file, issue: `Unsafe affirmative phrase found: ${phrase}` });
      }
    });
  });

  const report = {
    ok: failures.length === 0,
    generatedAt: new Date().toISOString(),
    checkedPages: checks.length,
    checkedFiles: checks.map((check) => ({
      file: check.file,
      required: (check.required || []).length,
      forbidden: (check.forbidden || []).length,
    })),
    failures,
  };

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  const tempPath = `${outputPath}.tmp`;
  fs.writeFileSync(tempPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  fs.renameSync(tempPath, outputPath);

  console.log(JSON.stringify(report, null, 2));

  if (failures.length) process.exitCode = 1;
}

main();

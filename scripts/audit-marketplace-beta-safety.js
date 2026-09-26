const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const outputPath = path.join(rootDir, "data", "launch-readiness", "marketplace-beta-safety.json");
const publicExtensions = new Set([".html", ".js"]);
const excluded = new Set(["server.js"]);

const hardBlockPatterns = [
  /\bpaypal\b/i,
  /\bstripe\b/i,
  /\bcheckout\b/i,
  /\bescrow\b/i,
  /\bpayout\b/i,
  /\bpayment\s+intent\b/i,
  /\bclient_secret\b/i,
];

const transactionActionPatterns = [
  /\bbuy\s+now\b/i,
  /\bsell\s+now\b/i,
  /\btrade\s+now\b/i,
  /\bstart\s+selling\b/i,
  /\bcreate\s+(a\s+)?listing\b/i,
  /\blisting\s+(created|published|is\s+live)\b/i,
  /\bpay\s+(now|with)\b/i,
  /\bcomplete\s+(purchase|transaction)\b/i,
  /\breal[-\s]?money\s+trading\s+(is\s+)?(live|open|enabled)\b/i,
  /\btransactions?\s+(are\s+)?(live|open|enabled)\b/i,
];

const betaContextPattern =
  /\b(beta|waitlist|coming soon|future|not live|not enabled|not open|closed|before launch|before real|interest only|no public listing|no listing|no payment|no trade|no sale|does not create|do not create|will not enable|should publish|should finalize|must publish|marketplace status)\b/i;
const negativePaymentProviderContextPattern = /\b(does not collect|do not collect|not collect|no payment|not live|not enabled|beta|privacy)\b/i;

function shouldScan(filePath) {
  const relative = path.relative(rootDir, filePath);
  if (excluded.has(relative)) return false;
  if (relative.includes(path.sep)) return false;
  return publicExtensions.has(path.extname(relative).toLowerCase());
}

function walkTopLevel() {
  return fs
    .readdirSync(rootDir)
    .map((name) => path.join(rootDir, name))
    .filter((filePath) => fs.statSync(filePath).isFile() && shouldScan(filePath));
}

function snippetAround(text, index, length = 180) {
  const start = Math.max(0, index - length);
  const end = Math.min(text.length, index + length);
  return text.slice(start, end).replace(/\s+/g, " ").trim();
}

function findPatternHits(text, patterns) {
  const hits = [];
  for (const pattern of patterns) {
    const flags = pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`;
    const regex = new RegExp(pattern.source, flags);
    let match;
    while ((match = regex.exec(text))) {
      hits.push({
        pattern: pattern.source,
        index: match.index,
        match: match[0],
        context: snippetAround(text, match.index),
      });
    }
  }
  return hits;
}

function writeJsonAtomic(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.tmp`;
  fs.writeFileSync(tempPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  fs.renameSync(tempPath, filePath);
}

function main() {
  const files = walkTopLevel();
  const hardBlocks = [];
  const riskyActions = [];

  for (const filePath of files) {
    const relative = path.relative(rootDir, filePath);
    const text = fs.readFileSync(filePath, "utf8");

    findPatternHits(text, hardBlockPatterns).forEach((hit) => {
      if (/\b(paypal|stripe)\b/i.test(hit.match) && negativePaymentProviderContextPattern.test(hit.context)) return;
      if (betaContextPattern.test(hit.context) && !/\b(payment\s+intent|client_secret)\b/i.test(hit.match)) return;
      hardBlocks.push({ file: relative, match: hit.match, context: hit.context });
    });

    findPatternHits(text, transactionActionPatterns).forEach((hit) => {
      if (betaContextPattern.test(hit.context)) return;
      riskyActions.push({ file: relative, match: hit.match, context: hit.context });
    });
  }

  const requiredBetaFiles = ["marketplace-rules.html", "terms.html", "trust.html", "card.js", "magic-card.js", "yugioh-card.js"];
  const missingBetaCopy = requiredBetaFiles.filter((relative) => {
    const filePath = path.join(rootDir, relative);
    if (!fs.existsSync(filePath)) return true;
    return !betaContextPattern.test(fs.readFileSync(filePath, "utf8"));
  });

  const report = {
    generatedAt: new Date().toISOString(),
    scannedFiles: files.length,
    hardBlocks,
    riskyActions,
    missingBetaCopy,
    ok: hardBlocks.length === 0 && riskyActions.length === 0 && missingBetaCopy.length === 0,
  };

  writeJsonAtomic(outputPath, report);
  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) process.exitCode = 1;
}

main();

const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const outputPath = path.join(rootDir, "data", "launch-readiness", "marketplace-policy-readiness.json");

const checks = [
  {
    file: "docs/marketplace-launch-readiness.md",
    required: [
      "marketplace.status",
      "realMoneyTradingEnabled",
      "paymentsEnabled",
      "interest-only",
      "Final terms of service",
      "Final privacy policy",
      "Seller agreement",
      "Buyer terms",
      "Refund policy",
      "Dispute policy",
      "Shipping and delivery",
      "Fee schedule",
      "Payment-provider terms",
      "Seller identity",
      "High-risk item verification",
      "Prohibited-item policy",
      "Condition standards",
      "Photo requirements",
      "Listing edit history",
      "Seller payout timing",
      "Chargeback and fraud",
      "Tax/reporting",
      "Dispute intake form",
      "Evidence retention",
      "qualified legal/payment/compliance support",
    ],
  },
  {
    file: "marketplace-rules.html",
    required: [
      "Trading is coming soon, not live",
      "waitlist only",
      "not a live seller agreement",
      "verification, listing, dispute, refund, and moderation policies",
      "marketplace launch readiness checklist",
    ],
  },
  {
    file: "terms.html",
    required: [
      "Trading, selling, payment processing, and listing publication are not live",
      "does not create a listing, sale, trade, shipping obligation, seller relationship",
      "Before real transactions open",
      "seller verification",
      "dispute intake",
      "refund expectations",
    ],
  },
  {
    file: "trust.html",
    required: [
      "GCX trading stays in beta",
      "Real-money trading will not open",
      "dispute intake",
      "refund expectations",
      "seller verification",
      "payment-provider rules",
    ],
  },
];

function normalize(value) {
  return String(value || "").replace(/\s+/g, " ").toLowerCase();
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.tmp`;
  fs.writeFileSync(tempPath, `${JSON.stringify(value, null, 2)}\n`);
  fs.renameSync(tempPath, filePath);
}

function main() {
  const failures = [];
  const checked = [];

  for (const check of checks) {
    const filePath = path.join(rootDir, check.file);
    if (!fs.existsSync(filePath)) {
      failures.push({ file: check.file, issue: "Missing file" });
      continue;
    }
    const text = fs.readFileSync(filePath, "utf8");
    const normalized = normalize(text);
    const missing = check.required.filter((phrase) => !normalized.includes(normalize(phrase)));
    missing.forEach((phrase) => failures.push({ file: check.file, issue: `Missing required phrase: ${phrase}` }));
    checked.push({ file: check.file, required: check.required.length, missing: missing.length });
  }

  const report = {
    ok: failures.length === 0,
    generatedAt: new Date().toISOString(),
    checkedFiles: checked,
    failures,
  };
  writeJson(outputPath, report);
  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) process.exitCode = 1;
}

main();

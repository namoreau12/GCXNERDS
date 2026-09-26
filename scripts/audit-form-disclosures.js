const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");

const requiredForms = [
  {
    file: "index.html",
    selector: "trade-card",
    label: "collector waitlist",
    required: ["form-disclosure", "Privacy", "Terms", "no listing", "payment"],
  },
  {
    file: "index.html",
    selector: "newsletter",
    label: "newsletter",
    required: ["form-disclosure", "email", "Privacy"],
  },
  {
    file: "sponsors.html",
    selector: "sponsor-lead-form",
    label: "sponsor inquiry",
    required: ["form-disclosure", "stores sponsor inquiries", "does not create a public placement", "charge"],
  },
  {
    file: "auth.html",
    selector: "signup-form",
    label: "account signup",
    required: ["form-disclosure", "stores your email", "Terms", "Privacy"],
  },
  {
    file: "profile.html",
    selector: "profile-edit-form",
    label: "profile edit",
    required: ["form-disclosure", "public", "private contact", "payment"],
  },
  {
    file: "community.html",
    selector: "community-form",
    label: "community post",
    required: ["form-disclosure", "public", "moderated", "payment", "shipping"],
  },
];

function compact(value) {
  return String(value || "").replace(/\s+/g, " ");
}

function snippetForSelector(text, selector) {
  const selectorPatterns = [
    new RegExp(`<form[^>]+id=["']${selector}["'][\\s\\S]*?<\\/form>`, "i"),
    new RegExp(`<form[^>]+class=["'][^"']*${selector}[^"']*["'][\\s\\S]*?<\\/form>`, "i"),
    new RegExp(`<section[^>]+class=["'][^"']*${selector}[^"']*["'][\\s\\S]*?<\\/section>`, "i"),
  ];

  for (const pattern of selectorPatterns) {
    const match = text.match(pattern);
    if (match) return match[0];
  }
  return "";
}

function main() {
  const failures = [];

  for (const form of requiredForms) {
    const filePath = path.join(rootDir, form.file);
    const text = fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "";
    const snippet = snippetForSelector(text, form.selector);
    if (!snippet) {
      failures.push({ file: form.file, label: form.label, issue: "form/section not found" });
      continue;
    }
    const readable = compact(snippet).toLowerCase();
    const missing = form.required.filter((term) => !readable.includes(term.toLowerCase()));
    if (missing.length) failures.push({ file: form.file, label: form.label, issue: "missing disclosure terms", missing });
  }

  const report = {
    checkedForms: requiredForms.length,
    failures,
    ok: failures.length === 0,
  };

  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) process.exitCode = 1;
}

main();

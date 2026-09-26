const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("./playwright-loader");

const rootDir = path.join(__dirname, "..");
const outputDir = path.join(rootDir, "data", "launch-readiness");
const outputPath = path.join(outputDir, "auth-page-ux.json");
const base = process.env.GCX_AUDIT_BASE_URL || `http://localhost:${process.env.PORT || "3000"}`;
const executablePath = process.env.CHROME_EXECUTABLE_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";

function pass(condition, message, failures) {
  if (!condition) failures.push(message);
}

async function main() {
  const browser = await chromium.launch({ executablePath, headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
  const consoleErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));

  try {
    const response = await page.goto(`${base}/auth.html`, { waitUntil: "domcontentloaded", timeout: 20000 });
    await page.waitForTimeout(700);

    const values = await page.evaluate(() => {
      const attr = (selector, name) => document.querySelector(selector)?.getAttribute(name) || "";
      const count = (selector) => document.querySelectorAll(selector).length;
      const text = (selector) => document.querySelector(selector)?.textContent || "";
      return {
        loginEmailAutocomplete: attr("#login-form input[name='email']", "autocomplete"),
        loginPasswordAutocomplete: attr("#login-form input[name='password']", "autocomplete"),
        signupDisplayNameAutocomplete: attr("#signup-form input[name='displayName']", "autocomplete"),
        signupEmailAutocomplete: attr("#signup-form input[name='email']", "autocomplete"),
        signupPasswordAutocomplete: attr("#signup-form input[name='password']", "autocomplete"),
        signupConfirmAutocomplete: attr("#signup-form input[name='confirmPassword']", "autocomplete"),
        resetPasswordAutocomplete: attr("#reset-password-form input[name='password']", "autocomplete"),
        resetConfirmAutocomplete: attr("#reset-password-form input[name='confirmPassword']", "autocomplete"),
        passwordToggleCount: count(".password-toggle"),
        passwordFieldCount: count("input[type='password']"),
        socialButtonCount: count(".social-auth-button"),
        signupDisclosure: text("#signup-form .form-disclosure"),
        overflow: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) > document.documentElement.clientWidth + 1,
      };
    });

    const failures = [];
    pass(response?.status() === 200, `auth.html expected 200, got ${response?.status()}`, failures);
    pass(values.loginEmailAutocomplete === "username", "login email should use autocomplete=username", failures);
    pass(values.loginPasswordAutocomplete === "current-password", "login password should use autocomplete=current-password", failures);
    pass(values.signupDisplayNameAutocomplete === "name", "signup display name should use autocomplete=name", failures);
    pass(values.signupEmailAutocomplete === "email", "signup email should use autocomplete=email", failures);
    pass(values.signupPasswordAutocomplete === "new-password", "signup password should use autocomplete=new-password", failures);
    pass(values.signupConfirmAutocomplete === "new-password", "signup confirm password should use autocomplete=new-password", failures);
    pass(values.resetPasswordAutocomplete === "new-password", "reset password should use autocomplete=new-password", failures);
    pass(values.resetConfirmAutocomplete === "new-password", "reset confirm password should use autocomplete=new-password", failures);
    pass(values.passwordToggleCount >= 5, "all password fields should have visibility toggles", failures);
    pass(values.passwordFieldCount >= 5, "expected login/signup/reset password fields", failures);
    pass(values.socialButtonCount === 3, "expected Google, Apple, and Facebook social placeholders", failures);
    pass(/terms/i.test(values.signupDisclosure) && /privacy/i.test(values.signupDisclosure), "signup disclosure should link terms and privacy", failures);
    pass(!values.overflow, "auth page should not overflow at 390px", failures);

    const firstToggle = page.locator(".password-toggle").first();
    const firstPassword = page.locator("#login-form input[name='password']");
    await firstToggle.click();
    pass((await firstPassword.getAttribute("type")) === "text", "password toggle should reveal the password", failures);
    pass((await firstToggle.getAttribute("aria-label")) === "Hide password", "password toggle aria-label should update when revealed", failures);
    await firstToggle.click();
    pass((await firstPassword.getAttribute("type")) === "password", "password toggle should hide the password again", failures);
    pass((await firstToggle.getAttribute("aria-label")) === "Show password", "password toggle aria-label should reset when hidden", failures);

    await page.locator(".social-auth-button").first().click();
    const socialStatus = await page.locator("#social-status").innerText();
    pass(/supabase/i.test(socialStatus) && /enable/i.test(socialStatus), "social placeholder should clearly say provider must be enabled in Supabase", failures);

    const result = {
      generatedAt: new Date().toISOString(),
      base,
      ok: failures.length === 0 && consoleErrors.length === 0,
      status: response?.status(),
      values,
      failures,
      consoleErrors,
    };
    fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`);
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.ok ? 0 : 1);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});

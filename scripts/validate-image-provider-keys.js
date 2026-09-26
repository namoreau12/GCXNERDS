const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const envPath = path.join(rootDir, ".env");
const args = new Set(process.argv.slice(2));

function loadEnvFile() {
  if (!fs.existsSync(envPath)) return {};
  return Object.fromEntries(
    fs
      .readFileSync(envPath, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const index = line.indexOf("=");
        const key = line.slice(0, index).trim();
        const value = line.slice(index + 1).trim().replace(/^["']|["']$/g, "");
        return [key, value];
      })
  );
}

function hasUsableKey(env, key) {
  const value = String(env[key] || "").trim();
  return Boolean(value && !/^(replace_with_|your_)/i.test(value));
}

async function fetchJson(url, label) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "GamesCardsExchange/0.1 local provider key validation",
    },
  });
  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = null;
  }
  if (!response.ok) {
    const detail = body?.message || body?.error || response.statusText || "request failed";
    throw new Error(`${label} returned ${response.status}: ${detail}`);
  }
  return body;
}

async function validateMobyGames(apiKey) {
  const url = new URL("https://api.mobygames.com/v1/games");
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("title", "Pac-Man");
  url.searchParams.set("limit", "1");
  const body = await fetchJson(url, "MobyGames");
  return Array.isArray(body?.games) || Array.isArray(body?.results);
}

async function validateRawg(apiKey) {
  const url = new URL("https://api.rawg.io/api/games");
  url.searchParams.set("key", apiKey);
  url.searchParams.set("search", "Pac-Man");
  url.searchParams.set("page_size", "1");
  const body = await fetchJson(url, "RAWG");
  return Array.isArray(body?.results);
}

async function validateProvider({ id, key, enabled, validate }) {
  if (!enabled) return null;
  if (!key) return { provider: id, status: "missing", detail: "No usable key found in .env." };
  try {
    const ok = await validate(key);
    return { provider: id, status: ok ? "valid" : "invalid", detail: ok ? "Key accepted by provider API." : "Provider response shape was unexpected." };
  } catch (error) {
    return { provider: id, status: "invalid", detail: error.message };
  }
}

async function main() {
  const env = loadEnvFile();
  const mobyRequested = args.has("--mobygames");
  const rawgRequested = args.has("--rawg");
  const validateAll = !mobyRequested && !rawgRequested;

  const checks = [
    {
      id: "MobyGames",
      key: hasUsableKey(env, "MOBYGAMES_API_KEY") ? env.MOBYGAMES_API_KEY : "",
      enabled: validateAll || mobyRequested,
      validate: validateMobyGames,
    },
    {
      id: "RAWG",
      key: hasUsableKey(env, "RAWG_API_KEY") ? env.RAWG_API_KEY : "",
      enabled: validateAll || rawgRequested,
      validate: validateRawg,
    },
  ];

  const results = (await Promise.all(checks.map(validateProvider))).filter(Boolean);
  console.table(results);
  if (results.some((result) => result.status !== "valid")) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

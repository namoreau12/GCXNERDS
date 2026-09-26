const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const dataDir = path.join(rootDir, "data");
const envPath = path.join(rootDir, ".env");
const outputDir = path.join(rootDir, "data", "launch-readiness");
const outputPath = path.join(outputDir, "supabase-data-freshness.json");

const normalizedRootFiles = new Set([
  "data/consoles.json",
  "data/games.json",
  "data/magic/sets.json",
  "data/newsroom.json",
  "data/pokemon/cards.json",
  "data/pokemon/sets.json",
  "data/yugioh/sets.json",
]);

const platformLibraryFiles = new Set([
  "data/games/3ds.json",
  "data/games/dreamcast.json",
  "data/games/ds.json",
  "data/games/gameboy.json",
  "data/games/gamecube.json",
  "data/games/gba.json",
  "data/games/genesis.json",
  "data/games/n64.json",
  "data/games/nes.json",
  "data/games/ps1.json",
  "data/games/ps2.json",
  "data/games/ps3.json",
  "data/games/ps4.json",
  "data/games/ps5.json",
  "data/games/psp.json",
  "data/games/saturn.json",
  "data/games/snes.json",
  "data/games/switch.json",
  "data/games/switch2.json",
  "data/games/vita.json",
  "data/games/wii.json",
  "data/games/xbox.json",
  "data/games/xbox360.json",
]);

function loadEnvFile() {
  if (!fs.existsSync(envPath)) return;
  fs.readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return;
      const equalsIndex = trimmed.indexOf("=");
      if (equalsIndex === -1) return;
      const key = trimmed.slice(0, equalsIndex).trim();
      const value = trimmed.slice(equalsIndex + 1).trim().replace(/^["']|["']$/g, "");
      if (key && process.env[key] === undefined) process.env[key] = value;
    });
}

function relativePath(filePath) {
  return path.relative(rootDir, filePath).replaceAll("\\", "/");
}

function walkJsonFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return walkJsonFiles(fullPath);
    return entry.isFile() && entry.name.endsWith(".json") ? [fullPath] : [];
  });
}

function selectedPathSet() {
  const pathsArg = process.argv.find((arg) => arg.startsWith("--paths="));
  if (!pathsArg) return null;
  return new Set(
    pathsArg
      .slice("--paths=".length)
      .split(",")
      .map((value) => value.trim().replaceAll("\\", "/"))
      .filter(Boolean)
  );
}

function includeCardSetShards() {
  return process.argv.includes("--full-card-sets") || process.env.GCX_SUPABASE_FRESHNESS_FULL_CARD_SETS === "true";
}

function isLaunchDataFile(sourcePath) {
  const parts = sourcePath.split("/");
  if (normalizedRootFiles.has(sourcePath)) return true;
  if (platformLibraryFiles.has(sourcePath)) return true;
  if (includeCardSetShards() && parts[1] === "magic" && parts[2] === "cards-by-set") return true;
  if (includeCardSetShards() && parts[1] === "yugioh" && parts[2] === "cards-by-set") return true;
  return false;
}

function expectedRecordCount(filePath) {
  const sourcePath = relativePath(filePath);
  const parts = sourcePath.split("/");
  const fileName = path.basename(sourcePath, ".json");
  const content = JSON.parse(fs.readFileSync(filePath, "utf8"));

  const hasNormalizedRows =
    (normalizedRootFiles.has(sourcePath) && sourcePath !== "data/newsroom.json") ||
    (platformLibraryFiles.has(sourcePath) && Array.isArray(content)) ||
    (parts[1] === "magic" && parts[2] === "cards-by-set" && Array.isArray(content)) ||
    (parts[1] === "yugioh" && parts[2] === "cards-by-set" && Array.isArray(content));

  if (!hasNormalizedRows) return null;

  if (sourcePath === "data/community.json" && content && typeof content === "object" && !Array.isArray(content)) {
    return Object.values(content).reduce((total, value) => total + (Array.isArray(value) ? value.length : 0), 0);
  }
  return Array.isArray(content) ? content.length : null;
}

function writeReport(report) {
  fs.mkdirSync(outputDir, { recursive: true });
  const tempPath = `${outputPath}.tmp`;
  fs.writeFileSync(tempPath, `${JSON.stringify(report, null, 2)}\n`);
  fs.renameSync(tempPath, outputPath);
}

function restUrl(pathname) {
  return `${String(process.env.SUPABASE_URL || "").replace(/\/+$/, "")}/rest/v1/${pathname}`;
}

async function supabaseRequest(pathname, options = {}) {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const authHeaders = key?.startsWith("sb_secret_") ? {} : { Authorization: `Bearer ${key}` };
  const attempts = 3;
  let lastError = null;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(restUrl(pathname), {
        ...options,
        headers: {
          apikey: key,
          ...authHeaders,
          "Content-Type": "application/json",
          ...(options.headers || {}),
        },
      });
      const text = await response.text();
      const json = text ? safeParseJson(text) : null;
      if (response.ok || ![500, 502, 503, 520, 525].includes(response.status) || attempt === attempts) {
        return {
          ok: response.ok,
          status: response.status,
          text,
          json,
          count: parseContentRangeCount(response.headers.get("content-range")),
        };
      }
      lastError = new Error(`Supabase returned ${response.status}`);
    } catch (error) {
      lastError = error;
      if (attempt === attempts) break;
    }
    await new Promise((resolve) => setTimeout(resolve, 400 * attempt * attempt));
  }
  return {
    ok: false,
    status: 0,
    text: lastError?.message || "fetch failed",
    json: null,
    count: null,
  };
}

function safeParseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function parseContentRangeCount(value) {
  const match = String(value || "").match(/\/(\d+)$/);
  return match ? Number(match[1]) : null;
}

async function remoteSnapshot(sourcePath) {
  const encodedPath = encodeURIComponent(sourcePath);
  const dataFile = await supabaseRequest(`gcx_data_files?path=eq.${encodedPath}&select=path,file_size_bytes,updated_at&limit=1`, {
    method: "GET",
  });
  const records = await supabaseRequest(`gcx_records?source_path=eq.${encodedPath}&select=record_id&limit=0`, {
    method: "GET",
    headers: {
      Prefer: "count=exact",
    },
  });
  return { dataFile, records };
}

async function checkFile(filePath) {
  const sourcePath = relativePath(filePath);
  const stat = fs.statSync(filePath);
  const expectedRecords = expectedRecordCount(filePath);
  const remote = await remoteSnapshot(sourcePath);
  const row = Array.isArray(remote.dataFile.json) ? remote.dataFile.json[0] : null;
  const issues = [];

  if (!remote.dataFile.ok) {
    issues.push(`gcx_data_files request failed with ${remote.dataFile.status}`);
  } else if (!row) {
    issues.push("missing gcx_data_files row");
  } else if (Number(row.file_size_bytes || 0) !== stat.size) {
    issues.push(`file size mismatch: local ${stat.size}, Supabase ${Number(row.file_size_bytes || 0)}`);
  }

  if (!remote.records.ok) {
    issues.push(`gcx_records count failed with ${remote.records.status}`);
  } else if (expectedRecords !== null && Number(remote.records.count || 0) !== expectedRecords) {
    issues.push(`record count mismatch: local ${expectedRecords}, Supabase ${Number(remote.records.count || 0)}`);
  }

  return {
    path: sourcePath,
    ok: issues.length === 0,
    localFileSizeBytes: stat.size,
    supabaseFileSizeBytes: row?.file_size_bytes ?? null,
    expectedRecords,
    supabaseRecords: remote.records.count,
    supabaseUpdatedAt: row?.updated_at || null,
    issues,
  };
}

async function main() {
  loadEnvFile();
  const configured = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
  const selectedPaths = selectedPathSet();

  if (!configured) {
    const report = {
      ok: false,
      configured: false,
      generatedAt: new Date().toISOString(),
      checkedFiles: 0,
      staleFiles: 0,
      message: "SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing, so Supabase data freshness could not be checked.",
    };
    writeReport(report);
    console.log(JSON.stringify(report, null, 2));
    process.exitCode = 1;
    return;
  }

  const files = walkJsonFiles(dataDir)
    .filter((filePath) => isLaunchDataFile(relativePath(filePath)))
    .filter((filePath) => !selectedPaths || selectedPaths.has(relativePath(filePath)))
    .sort((a, b) => relativePath(a).localeCompare(relativePath(b)));

  const results = [];
  for (const filePath of files) {
    results.push(await checkFile(filePath));
  }

  const stale = results.filter((result) => !result.ok);
  const report = {
    ok: stale.length === 0,
    configured: true,
    generatedAt: new Date().toISOString(),
    checkedFiles: results.length,
    staleFiles: stale.length,
    stale,
    sampledFreshFiles: results.filter((result) => result.ok).slice(0, 12).map((result) => result.path),
    nextStep: stale.length
      ? `Sync stale paths with scripts/migrate-data-to-supabase.js --paths=${stale.map((result) => result.path).join(",")}, then rerun this audit.`
      : "Supabase launch data snapshots and normalized record counts match local launch JSON files.",
  };

  writeReport(report);
  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) process.exitCode = 1;
}

main().catch((error) => {
  const report = {
    ok: false,
    configured: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
    generatedAt: new Date().toISOString(),
    checkedFiles: 0,
    staleFiles: 0,
    message: error.message,
  };
  writeReport(report);
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
});

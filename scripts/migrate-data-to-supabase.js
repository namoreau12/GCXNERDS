const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const rootDir = path.join(__dirname, "..");
const dataDir = path.join(rootDir, "data");
const envPath = path.join(rootDir, ".env");
const checkpointPath = path.join(rootDir, ".cache", "supabase-migration-checkpoint.json");
const maxRawFileContentBytes = Number(process.env.SUPABASE_MAX_RAW_FILE_CONTENT_BYTES || 500000);
const requestDelayMs = Number(process.env.SUPABASE_IMPORT_REQUEST_DELAY_MS || 75);
const args = process.argv.slice(2);
const flags = new Set(args.filter((arg) => arg.startsWith("-")));

function printHelp() {
  console.log(`
Usage:
  node scripts/migrate-data-to-supabase.js
  node scripts/migrate-data-to-supabase.js --paths=data/games/ds.json,data/launch-readiness/latest.json
  node scripts/migrate-data-to-supabase.js --paths=data/games/ds.json --refresh-selected

Options:
  --paths=<comma-separated paths>
      Import only the listed JSON files, using project-relative paths.

  --refresh-selected
      With --paths, ignore the local checkpoint for those selected files and
      write a fresh Supabase snapshot even when the file hash already matches.

  --help, -h
      Show this help text without importing anything.

Safety:
  The script reads Supabase settings from .env, never prints secret values, and
  updates data snapshots plus normalized records through the server-side key.
`.trim());
}

function loadEnvFile() {
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const equalsIndex = trimmed.indexOf("=");
    if (equalsIndex === -1) return;
    const key = trimmed.slice(0, equalsIndex).trim();
    const value = trimmed.slice(equalsIndex + 1).trim().replace(/^["']|["']$/g, "");
    if (key && process.env[key] === undefined) process.env[key] = value;
  });
}

function walkJsonFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return walkJsonFiles(fullPath);
    return entry.isFile() && entry.name.endsWith(".json") ? [fullPath] : [];
  });
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readCheckpoint() {
  if (!fs.existsSync(checkpointPath)) {
    return { completedPaths: [], completedFiles: {} };
  }

  try {
    const checkpoint = JSON.parse(fs.readFileSync(checkpointPath, "utf8"));
    return {
      completedPaths: checkpoint.completedPaths || [],
      completedFiles: checkpoint.completedFiles || {},
    };
  } catch (error) {
    return { completedPaths: [], completedFiles: {} };
  }
}

function writeCheckpoint(checkpoint) {
  fs.mkdirSync(path.dirname(checkpointPath), { recursive: true });
  fs.writeFileSync(checkpointPath, JSON.stringify(checkpoint, null, 2));
}

function relativePath(filePath) {
  return path.relative(rootDir, filePath).replaceAll("\\", "/");
}

function fileFingerprint(filePath) {
  const stat = fs.statSync(filePath);
  const hash = crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
  return {
    size: stat.size,
    sha256: hash,
  };
}

function slug(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

function recordId(item, fallback) {
  return String(item?.id || item?.uuid || item?.slug || item?.nsuid || item?.name || item?.title || fallback);
}

function recordTitle(item) {
  return item?.title || item?.name || item?.set?.name || item?.id || "";
}

function recordPlatform(item) {
  return item?.platform || (Array.isArray(item?.platforms) ? item.platforms[0] : "") || "";
}

function recordCategory(item) {
  return item?.category || item?.supertype || item?.type || item?.rarity || "";
}

async function supabaseRequest(pathname, options = {}) {
  const baseUrl = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!baseUrl || !key) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.");
  }

  const attempts = 5;
  const authHeaders = key.startsWith("sb_secret_") ? {} : { Authorization: `Bearer ${key}` };
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const response = await fetch(`${baseUrl.replace(/\/+$/, "")}/rest/v1/${pathname}`, {
      ...options,
      headers: {
        apikey: key,
        ...authHeaders,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates",
        ...(options.headers || {}),
      },
    });

    const text = await response.text();
    if (response.ok) return text ? JSON.parse(text) : null;

    const retryable =
      response.status === 500 ||
      response.status === 502 ||
      response.status === 503 ||
      response.status === 520 ||
      response.status === 525 ||
      text.includes("statement timeout") ||
      text.includes("schema cache");
    if (!retryable || attempt === attempts) {
      throw new Error(`${options.method || "GET"} ${pathname} failed with ${response.status}: ${text}`);
    }

    await new Promise((resolve) => setTimeout(resolve, 1000 * attempt * attempt));
  }
}

async function upsertRows(table, rows, batchSize = 200) {
  for (let index = 0; index < rows.length; index += batchSize) {
    const batch = rows.slice(index, index + batchSize);
    await upsertBatch(table, batch);
    if (requestDelayMs) await new Promise((resolve) => setTimeout(resolve, requestDelayMs));
  }
}

async function upsertBatch(table, batch) {
  try {
    await supabaseRequest(table, {
      method: "POST",
      body: JSON.stringify(batch),
    });
  } catch (error) {
    if (batch.length <= 1) throw error;
    const midpoint = Math.ceil(batch.length / 2);
    await upsertBatch(table, batch.slice(0, midpoint));
    await upsertBatch(table, batch.slice(midpoint));
  }
}

async function deleteFileRecords(sourcePath) {
  const encodedPath = encodeURIComponent(sourcePath);
  await supabaseRequest(`gcx_records?source_path=eq.${encodedPath}`, {
    method: "DELETE",
  });
}

async function logImportRun(row) {
  try {
    await supabaseRequest("gcx_import_runs", {
      method: "POST",
      body: JSON.stringify([row]),
    });
  } catch (error) {
    console.warn(`Warning: could not write import run log: ${error.message}`);
  }
}

async function fetchExistingDataFilePaths() {
  const paths = [];
  const pageSize = 1000;

  for (let offset = 0; ; offset += pageSize) {
    const rows = await supabaseRequest(`gcx_data_files?select=path&order=path.asc&limit=${pageSize}&offset=${offset}`, {
      method: "GET",
      headers: {
        Prefer: "",
      },
    });
    if (!Array.isArray(rows) || !rows.length) break;
    rows.forEach((row) => {
      if (row.path) paths.push(row.path);
    });
    if (rows.length < pageSize) break;
  }

  return paths;
}

function contentSnapshot(filePath, content) {
  const size = fs.statSync(filePath).size;
  if (size <= maxRawFileContentBytes) return content;

  return {
    skippedRawContent: true,
    reason: "File is imported as normalized gcx_records rows; raw jsonb snapshot skipped to avoid REST gateway limits.",
    fileSizeBytes: size,
    itemCount: Array.isArray(content) ? content.length : null,
    keys: content && typeof content === "object" && !Array.isArray(content) ? Object.keys(content) : [],
  };
}

function dataFileRow(filePath, content) {
  return {
    path: relativePath(filePath),
    kind: "json",
    file_size_bytes: fs.statSync(filePath).size,
    content: contentSnapshot(filePath, content),
    updated_at: new Date().toISOString(),
  };
}

function collectionRows(collection, sourcePath, items) {
  const counts = new Map();
  const sourceSlug = slug(sourcePath) || "source";

  return items.map((item, index) => {
    const baseId = recordId(item, `${sourcePath}:${index}`);
    const key = String(baseId);
    const count = counts.get(key) || 0;
    counts.set(key, count + 1);
    const duplicateSuffix = count ? `--${count + 1}` : "";
    const printScopedCollections = new Set(["magic_cards", "yugioh_cards"]);
    const scopedId = printScopedCollections.has(collection) ? `${sourceSlug}--${key}${duplicateSuffix}` : `${key}${duplicateSuffix}`;

    return {
      collection,
      record_id: scopedId,
      title: recordTitle(item),
      platform: recordPlatform(item),
      category: recordCategory(item),
      source_path: sourcePath,
      data: item,
      updated_at: new Date().toISOString(),
    };
  });
}

function rowsForJsonFile(filePath, content) {
  const sourcePath = relativePath(filePath);
  const parts = sourcePath.split("/");
  const fileName = path.basename(sourcePath, ".json");

  if (sourcePath === "data/consoles.json" && Array.isArray(content)) return collectionRows("consoles", sourcePath, content);
  if (sourcePath === "data/games.json" && Array.isArray(content)) return collectionRows("games_index", sourcePath, content);
  if (sourcePath === "data/pokemon/cards.json" && Array.isArray(content)) return collectionRows("pokemon_cards", sourcePath, content);
  if (sourcePath === "data/pokemon/sets.json" && Array.isArray(content)) return collectionRows("pokemon_sets", sourcePath, content);
  if (sourcePath === "data/magic/sets.json" && Array.isArray(content)) return collectionRows("magic_sets", sourcePath, content);
  if (sourcePath === "data/yugioh/sets.json" && Array.isArray(content)) return collectionRows("yugioh_sets", sourcePath, content);

  if (parts[1] === "games" && Array.isArray(content) && !fileName.includes("manifest") && !fileName.includes("libretro")) {
    return collectionRows(`game_${fileName}`, sourcePath, content);
  }

  if (parts[1] === "magic" && parts[2] === "cards-by-set" && Array.isArray(content)) {
    return collectionRows("magic_cards", sourcePath, content);
  }

  if (parts[1] === "yugioh" && parts[2] === "cards-by-set" && Array.isArray(content)) {
    return collectionRows("yugioh_cards", sourcePath, content);
  }

  if (sourcePath === "data/community.json" && content && typeof content === "object") {
    return Object.entries(content).flatMap(([key, value]) => {
      if (!Array.isArray(value)) return [];
      return collectionRows(`community_${key}`, sourcePath, value);
    });
  }

  return [];
}

function selectedPathSet() {
  const pathsArg = args.find((arg) => arg.startsWith("--paths="));
  if (!pathsArg) return null;
  return new Set(
    pathsArg
      .slice("--paths=".length)
      .split(",")
      .map((value) => value.trim().replaceAll("\\", "/"))
      .filter(Boolean)
  );
}

async function main() {
  if (flags.has("--help") || flags.has("-h")) {
    printHelp();
    return;
  }

  loadEnvFile();
  const startedAt = new Date().toISOString();
  const selectedPaths = selectedPathSet();
  const refreshSelected = flags.has("--refresh-selected");
  if (refreshSelected && !selectedPaths) {
    throw new Error("--refresh-selected requires --paths so a full import is not refreshed accidentally.");
  }

  const jsonFiles = walkJsonFiles(dataDir).filter((filePath) => {
    if (!selectedPaths) return true;
    return selectedPaths.has(relativePath(filePath));
  });
  const summary = {
    files: 0,
    skippedFiles: 0,
    records: 0,
    collections: {},
    startedAt,
  };
  const checkpoint = readCheckpoint();
  const existingPaths = checkpoint.completedPaths?.length ? checkpoint.completedPaths : await fetchExistingDataFilePaths();
  const completedPaths = new Set(existingPaths || []);
  const completedFiles = checkpoint.completedFiles || {};

  console.log(`Importing ${jsonFiles.length.toLocaleString()} JSON files to Supabase...`);
  if (completedPaths.size) {
    console.log(`Found ${completedPaths.size.toLocaleString()} completed file snapshots; resuming from remaining files.`);
  }
  await logImportRun({ label: "local_data_migration", status: "started", summary: { startedAt } });

  for (const filePath of jsonFiles) {
    const sourcePath = relativePath(filePath);
    const fingerprint = fileFingerprint(filePath);
    const completedFile = completedFiles[sourcePath];
    const forceRefresh = refreshSelected && selectedPaths.has(sourcePath);
    if (!forceRefresh && completedPaths.has(sourcePath) && completedFile?.sha256 === fingerprint.sha256) {
      summary.skippedFiles += 1;
      if ((summary.files + summary.skippedFiles) % 100 === 0) {
        console.log(`Skipped ${summary.skippedFiles.toLocaleString()} completed files, processed ${summary.files.toLocaleString()} this run...`);
      }
      continue;
    }

    const content = readJson(filePath);
    await upsertRows("gcx_data_files", [dataFileRow(filePath, content)], 1);
    summary.files += 1;

    const rows = rowsForJsonFile(filePath, content);
    if (rows.length) {
      await deleteFileRecords(sourcePath);
      await upsertRows("gcx_records", rows);
      summary.records += rows.length;
      rows.forEach((row) => {
        summary.collections[row.collection] = (summary.collections[row.collection] || 0) + 1;
      });
    }

    completedPaths.add(sourcePath);
    completedFiles[sourcePath] = {
      ...fingerprint,
      importedAt: new Date().toISOString(),
    };
    writeCheckpoint({
      completedPaths: Array.from(completedPaths).sort(),
      completedFiles,
      lastCompletedPath: sourcePath,
      updatedAt: new Date().toISOString(),
    });

    if (summary.files % 50 === 0 || rows.length >= 1000) {
      console.log(`Imported ${summary.files.toLocaleString()}/${jsonFiles.length.toLocaleString()} files, ${summary.records.toLocaleString()} records...`);
    }
  }

  summary.finishedAt = new Date().toISOString();
  await logImportRun({ label: "local_data_migration", status: "finished", summary, finished_at: summary.finishedAt });

  console.log("\nSupabase import complete.");
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});

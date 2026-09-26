const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const outputPath = path.join(rootDir, "data", "launch-readiness", "deploy-artifact-hygiene.json");

function readText(relativePath) {
  try {
    return fs.readFileSync(path.join(rootDir, relativePath), "utf8");
  } catch {
    return "";
  }
}

function writeJsonAtomic(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.tmp`;
  fs.writeFileSync(tempPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  fs.renameSync(tempPath, filePath);
}

function lineSet(text) {
  return new Set(
    text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"))
  );
}

function hasRule(lines, rule) {
  const withoutSlash = rule.replace(/\/$/, "");
  return lines.has(rule) || lines.has(withoutSlash) || lines.has(`${withoutSlash}/`);
}

function rootFilesByExtension(extension) {
  return fs
    .readdirSync(rootDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(extension))
    .map((entry) => {
      const stat = fs.statSync(path.join(rootDir, entry.name));
      return {
        name: entry.name,
        bytes: stat.size,
      };
    })
    .sort((a, b) => b.bytes - a.bytes || a.name.localeCompare(b.name));
}

function renderEnvVars(renderYaml) {
  const matches = [...renderYaml.matchAll(/-\s+key:\s*([A-Z0-9_]+)([\s\S]*?)(?=\n\s*-\s+key:|\n\S|$)/g)];
  return new Map(
    matches.map((match) => [
      match[1],
      {
        block: match[2],
        syncFalse: /sync:\s*false\b/.test(match[2]),
        hasLiteralValue: /value:\s*["']?[^"'\n]+["']?/.test(match[2]),
      },
    ])
  );
}

function envExampleValues(text) {
  return Object.fromEntries(
    text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const index = line.indexOf("=");
        return [line.slice(0, index).trim(), line.slice(index + 1).trim()];
      })
  );
}

function main() {
  const gitignore = lineSet(readText(".gitignore"));
  const dockerignore = lineSet(readText(".dockerignore"));
  const renderYaml = readText("render.yaml");
  const dockerfile = readText("Dockerfile");
  const envExample = readText(".env.example");
  const launchPreviewGuide = readText("docs/launch-preview-deployment.md");
  const packageJson = JSON.parse(readText("package.json") || "{}");
  const rootZipFiles = rootFilesByExtension(".zip");
  const zeroByteZipFiles = rootZipFiles.filter((file) => file.bytes === 0);
  const envVars = renderEnvVars(renderYaml);
  const exampleValues = envExampleValues(envExample);
  const failures = [];
  const warnings = [];

  for (const [fileName, lines] of [
    [".gitignore", gitignore],
    [".dockerignore", dockerignore],
  ]) {
    [".env", "*.zip", "node_modules", ".cache"].forEach((rule) => {
      if (!hasRule(lines, rule)) failures.push(`${fileName} must ignore ${rule}.`);
    });
  }

  if (!/healthCheckPath:\s*\/api\/health\b/.test(renderYaml)) {
    failures.push("render.yaml must use /api/health as its healthCheckPath.");
  }
  if (!/Health check path:\s*`\/api\/health`/.test(launchPreviewGuide)) {
    failures.push("docs/launch-preview-deployment.md must document /api/health as the Render health check path.");
  }

  if (!/COPY\s+\.\s+\./.test(dockerfile)) {
    warnings.push("Dockerfile copy pattern changed; confirm .dockerignore still protects local-only files.");
  }

  if (packageJson.scripts?.start !== "node server.js") {
    failures.push("package.json start script should run node server.js for the current Render service.");
  }

  const requiredRenderSecrets = ["GCX_SITE_URL", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_ANON_KEY", "GCX_ADMIN_EMAILS"];
  requiredRenderSecrets.forEach((key) => {
    const entry = envVars.get(key);
    if (!entry) {
      failures.push(`render.yaml must define ${key}.`);
    } else if (!entry.syncFalse) {
      failures.push(`render.yaml must keep ${key} as sync: false.`);
    }
  });

  ["SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_ANON_KEY", "POKEMON_TCG_API_KEY", "RAWG_API_KEY", "MOBYGAMES_API_KEY"].forEach((key) => {
    const value = exampleValues[key] || "";
    if (value && !/^(replace_with_|your_|https:\/\/your-)/i.test(value)) {
      failures.push(`.env.example must keep ${key} as a placeholder, not a real value.`);
    }
  });

  if (rootZipFiles.length) {
    warnings.push(`${rootZipFiles.length} root-level ZIP backup/share artifact(s) exist locally; keep deploys Git/Docker-based or move them outside the web root before manual upload.`);
  }
  if (zeroByteZipFiles.length) {
    warnings.push(`${zeroByteZipFiles.length} root-level ZIP artifact(s) are zero bytes and should not be shared or uploaded.`);
  }

  const report = {
    ok: failures.length === 0,
    generatedAt: new Date().toISOString(),
    failures,
    warnings,
    rootZipFiles,
    zeroByteZipFiles,
    checks: {
      gitignoreProtectsEnv: hasRule(gitignore, ".env"),
      gitignoreProtectsZip: hasRule(gitignore, "*.zip"),
      dockerignoreProtectsEnv: hasRule(dockerignore, ".env"),
      dockerignoreProtectsZip: hasRule(dockerignore, "*.zip"),
      renderHealthCheckPath: /healthCheckPath:\s*\/api\/health\b/.test(renderYaml) ? "/api/health" : "missing-or-different",
      launchGuideHealthCheckPath: /Health check path:\s*`\/api\/health`/.test(launchPreviewGuide) ? "/api/health" : "missing-or-different",
      renderSecretsAreDashboardSynced: requiredRenderSecrets.every((key) => envVars.get(key)?.syncFalse),
      envExampleUsesPlaceholders: failures.every((failure) => !failure.includes(".env.example")),
      startScript: packageJson.scripts?.start || "",
    },
  };

  writeJsonAtomic(outputPath, report);
  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) process.exitCode = 1;
}

main();

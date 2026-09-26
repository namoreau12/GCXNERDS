const fs = require("node:fs");
const path = require("node:path");
const { writeJsonAtomic } = require("./game-dataset-utils");

const rootDir = path.join(__dirname, "..");
const gamesDir = path.join(rootDir, "data", "games");
const outputPath = path.join(rootDir, "data", "launch-readiness", "game-image-coverage-plan.json");

function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function main() {
  const planPath = path.join(gamesDir, "image-coverage-plan.json");
  const plan = readJson(planPath, {});
  const failures = [];
  const milestones = Array.isArray(plan.milestones) ? plan.milestones : [];
  const targets = milestones.map((milestone) => Number(milestone.targetPct));

  if (!fs.existsSync(planPath)) failures.push("Missing data/games/image-coverage-plan.json.");
  if (!Number(plan.totals?.totalGames || 0)) failures.push("Coverage plan is missing totalGames.");
  if (!Number(plan.totals?.currentImages || 0)) failures.push("Coverage plan is missing currentImages.");
  if (!targets.includes(90)) failures.push("Coverage plan is missing a 90% milestone.");
  if (!targets.includes(95)) failures.push("Coverage plan is missing a 95% milestone.");
  if (!targets.includes(100)) failures.push("Coverage plan is missing a 100% milestone.");

  milestones.forEach((milestone) => {
    const needed = Number(milestone.additionalImagesNeeded || 0);
    const plannedRows = (milestone.platformPlan || []).reduce((sum, item) => sum + Number(item.reviewedImages || 0), 0);
    if (needed < 0) failures.push(`${milestone.targetPct}% milestone has negative additionalImagesNeeded.`);
    if (!milestone.targetMet && plannedRows <= 0) failures.push(`${milestone.targetPct}% milestone has no platform plan.`);
    if (plannedRows > needed) failures.push(`${milestone.targetPct}% milestone plans more rows than needed.`);
  });

  if (!Number(plan.reviewCapacity?.totalPreparedRows || 0)) failures.push("Coverage plan does not include prepared review batch capacity.");
  if (!Array.isArray(plan.finishablePlatforms) || !plan.finishablePlatforms.length) failures.push("Coverage plan does not include finishable platforms.");
  if (!Array.isArray(plan.recommendedSequence) || plan.recommendedSequence.length < 3) failures.push("Coverage plan is missing recommended sequence steps.");

  const report = {
    ok: failures.length === 0,
    generatedAt: new Date().toISOString(),
    totalGames: plan.totals?.totalGames || 0,
    imagePct: plan.totals?.imagePct || 0,
    missingImages: plan.totals?.missingImages || 0,
    milestones: milestones.map(({ targetPct, additionalImagesNeeded, targetMet }) => ({ targetPct, additionalImagesNeeded, targetMet })),
    totalPreparedRows: plan.reviewCapacity?.totalPreparedRows || 0,
    failures,
  };

  writeJsonAtomic(fs, outputPath, report);
  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) process.exitCode = 1;
}

main();

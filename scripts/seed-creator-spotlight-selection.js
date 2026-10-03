const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const communityPath = path.join(rootDir, "data", "community.json");

const selectedSlots = [
  {
    streamerId: "cohhcarnage",
    slotKey: "spotlight-lead",
    slotLabel: "Editorial Pick",
    slotDescription: "A polished variety creator who gives GCX a strong front-door creator signal.",
  },
  {
    streamerId: "lirik",
    slotKey: "spotlight-community",
    slotLabel: "Variety Pick",
    slotDescription: "A broad gaming channel for discovery, reactions, and what people are playing now.",
  },
  {
    streamerId: "shroud",
    slotKey: "spotlight-owner",
    slotLabel: "FPS Pick",
    slotDescription: "A skill-first competitive creator built for highlights and FPS conversation.",
  },
  {
    streamerId: "itmejp",
    slotKey: "spotlight-conversation",
    slotLabel: "Community Host",
    slotDescription: "A discussion-friendly creator fit for gaming culture, interviews, and community context.",
  },
  {
    streamerId: "gamesdonequick",
    slotKey: "spotlight-event",
    slotLabel: "Speedrun Pick",
    slotDescription: "Event-scale gaming culture that can drive watch parties and community moments.",
  },
  {
    streamerId: "iitztimmy",
    slotKey: "spotlight-competitive",
    slotLabel: "Competitive Pick",
    slotDescription: "High-energy competitive streaming with strong clip and discovery potential.",
  },
];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function main() {
  const data = readJson(communityPath);
  const streamerIds = new Set((data.streamers || []).map((streamer) => streamer.id));
  const missing = selectedSlots.filter((slot) => !streamerIds.has(slot.streamerId));
  const duplicateIds = selectedSlots
    .map((slot) => slot.streamerId)
    .filter((id, index, ids) => ids.indexOf(id) !== index);

  if (selectedSlots.length !== 6) {
    throw new Error("Creator spotlight must contain exactly six slots.");
  }
  if (missing.length) {
    throw new Error(`Missing streamer records: ${missing.map((slot) => slot.streamerId).join(", ")}`);
  }
  if (duplicateIds.length) {
    throw new Error(`Duplicate creator spotlight ids: ${Array.from(new Set(duplicateIds)).join(", ")}`);
  }

  data.creatorSpotlight = selectedSlots;
  data.campaign = {
    ...(data.campaign || {}),
    spotlightTheme: "GCX six creator highlights",
  };

  writeJson(communityPath, data);
  console.log(JSON.stringify({
    slots: data.creatorSpotlight.length,
    selected: data.creatorSpotlight.map((slot) => slot.streamerId),
    campaignTheme: data.campaign.spotlightTheme,
  }, null, 2));
}

main();

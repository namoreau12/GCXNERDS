const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const communityPath = path.join(rootDir, "data", "community.json");

const twitchEmbedsById = {
  "spotlight-games-done-quick": "https://player.twitch.tv/?channel=gamesdonequick",
};

function main() {
  const data = JSON.parse(fs.readFileSync(communityPath, "utf8"));
  let updated = 0;
  (data.streamingSpotlight || []).forEach((item) => {
    const embedUrl = twitchEmbedsById[item.id];
    if (!embedUrl) return;
    item.embed_url = embedUrl;
    item.updated_at = new Date().toISOString();
    updated += 1;
  });
  fs.writeFileSync(communityPath, `${JSON.stringify(data, null, 2)}\n`);
  console.log(JSON.stringify({ ok: true, updated }, null, 2));
}

main();

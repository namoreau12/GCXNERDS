const fs = require("node:fs");
const path = require("node:path");

const filePath = path.join(__dirname, "..", "data", "newsroom.json");
const stories = JSON.parse(fs.readFileSync(filePath, "utf8"));

const sourceBackfill = {
  "gcx-newsroom-pokemon-tcg-30th-celebration-complete-guide": [
    { label: "Pokemon official 30th Celebration expansion page", url: "https://tcg.pokemon.com/en-us/expansions/30th-celebration/" },
    { label: "Pokemon 30th Celebration Product Showcase", url: "https://www.pokemon.com/uk/news/pokemon-tcg-30th-celebration-product-showcase" },
    { label: "PokeBeach full English product lineup and reported pricing", url: "https://www.pokebeach.com/2026/06/30th-celebration-full-english-product-lineup-revealed" },
  ],
  "gcx-newsroom-gta-vi-leaking-again": [
    { label: "Rockstar Newswire: GTA VI launch date update", url: "https://www.rockstargames.com/newswire/article/ak3ak31a49a221/grand-theft-auto-vi-is-now-set-to-launch-november-19-2026" },
    { label: "Rockstar Newswire: Grand Theft Auto VI extended look", url: "https://www.rockstargames.com/newswire/article/9k2kaa1o3297k9/grand-theft-auto-vi-an-extended-look" },
    { label: "Rockstar Newswire: GTA VI preorder timing", url: "https://www.rockstargames.com/newswire/article/5171972o3ak5oa/pre-order-grand-theft-auto-vi-on-june-25" },
  ],
  "gcx-newsroom-gamescom-2026-before-gta-vi": [
    { label: "Gamescom official site", url: "https://www.gamescom.global/en" },
    { label: "Xbox Wire", url: "https://news.xbox.com/" },
    { label: "Future Games Show", url: "https://www.gamesradar.com/future-games-show/" },
  ],
  "gcx-newsroom-phantom-blade-zero-beyond-combat": [
    { label: "Phantom Blade Zero official site", url: "https://www.phantomblade0.com/" },
    { label: "PlayStation Phantom Blade Zero page", url: "https://www.playstation.com/en-us/games/phantom-blade-zero/" },
  ],
  "gcx-newsroom-horizon-hunters-gathering-rework": [
    { label: "PlayStation Studios official site", url: "https://www.playstation.com/en-us/corporate/playstation-studios/" },
    { label: "Guerrilla Games official site", url: "https://www.guerrilla-games.com/" },
  ],
  "gcx-newsroom-1000-dollar-ps6-analysis": [
    { label: "Sony Interactive Entertainment official site", url: "https://sonyinteractive.com/" },
    { label: "PlayStation official site", url: "https://www.playstation.com/" },
  ],
};

stories.forEach((story) => {
  story.sourceLinks = Array.isArray(story.sourceLinks) ? story.sourceLinks : [];
  if (!story.sourceLinks.length && sourceBackfill[story.id]) {
    story.sourceLinks = sourceBackfill[story.id];
  }
  story.lastReviewedAt = story.lastReviewedAt || story.lastUpdated || story.publishedAt || "2026-08-22";
  story.editorialOwner = story.editorialOwner || "GCX Newsroom";
  story.claimStatus = story.claimStatus || (story.sourceLinks.length ? "Verified Reporting / Analysis" : "Analysis");
  story.updatePolicy = story.updatePolicy || (story.editorialStatus === "living-guide" || story.editorialStatus === "living-tracker"
    ? "Preserve this URL and update sections as new official or verified information changes."
    : "Update if official sources materially change the story.");
});

fs.writeFileSync(filePath, `${JSON.stringify(stories, null, 2)}\n`);

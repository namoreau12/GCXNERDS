const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const newsroomPath = path.join(rootDir, "data", "newsroom.json");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function story(id, fields) {
  return {
    id,
    slug: id.replace(/^gcx-newsroom-/, ""),
    sourceName: "GCX Newsroom",
    sourceUrl: "news.html",
    externalUrl: "news.html",
    shareUrl: "community.html",
    type: "editorial",
    editorialStatus: "ready-for-publish",
    storyLifecycleState: "ready-for-publish",
    qaScore: 91,
    deepResearchUsed: false,
    livingArticle: false,
    updateFrequency: "Update if official source pages, trailer embeds, launch details, screenshots, or post-launch patch details change.",
    ...fields,
  };
}

function proxiedImage(url) {
  return `/api/image-proxy?url=${encodeURIComponent(url)}`;
}

const minecraftLiveSource = {
  label: "Official Minecraft Live hub and FAQ",
  url: "https://www.minecraft.net/en-us/live",
};

const minecraftLiveHeroImage =
  "https://www.minecraft.net/content/dam/minecraftnet/games/minecraft/key-art/MCL-Twitch-26_Social-Share_570x321.png";
const minecraftHeroCapeImage =
  "https://www.minecraft.net/content/dam/minecraftnet/games/spicewood/key-art/Dungeons-I_Media-Block-B_Hero-Cape_888x500.png";
const minecraftWildernessImage =
  "https://www.minecraft.net/content/dam/minecraftnet/games/minecraft/key-art/MCL-Fall-26_Media-Block-B_FGD-25_888x540.jpg";

const stories = [
  story("gcx-newsroom-minecraft-live-2026-time-how-to-watch-what-to-expect", {
    title: "Minecraft Live Is This Saturday - Here's the Time, Where to Watch, and What Mojang Is Teasing",
    seoTitle: "Minecraft Live 2026: Time, How to Watch, and What to Expect",
    excerpt:
      "Minecraft Live returns Saturday, September 26 at 1 PM ET. Here's how to watch, what Mojang has officially confirmed, and what we are watching for during the showcase.",
    metaDescription:
      "Minecraft Live returns Saturday, September 26 at 1 PM ET. Here's how to watch, what Mojang has officially confirmed, and what GCX is watching for during the latest Minecraft showcase.",
    category: "Gaming",
    articleType: "Event Preview / Living Guide",
    publishedAt: "2026-09-24T11:00:00.000-04:00",
    lastUpdated: "2026-09-24",
    lastReviewedAt: "2026-09-24",
    opportunityScore: 91,
    topicCluster: "Minecraft Live September 2026",
    canonicalTopic: "Minecraft Live",
    targetSearchIntent: "Minecraft Live September 2026 time, how to watch Minecraft Live, Minecraft Live 1 PM ET",
    updatePolicy: "Preserve this URL and update it into a live recap or reveal tracker when Mojang's September 26 showcase begins.",
    claimStatus: "Official / GCX Analysis",
    confidence: "Official / GCX Analysis",
    heroImage: proxiedImage(minecraftLiveHeroImage),
    heroImageSource: "Official Minecraft Live Fall 2026 hero artwork",
    heroImageSourceUrl: "https://www.minecraft.net/en-us/live",
    heroImageCredit: "Mojang Studios / Microsoft",
    heroImageAlt: "Official artwork for Minecraft Live 2026 promoting the September 26 livestream.",
    heroImageFocalX: "50%",
    heroImageFocalY: "50%",
    trailerUrl: "https://www.minecraft.net/en-us/live",
    mediaType: "promotional-art",
    imageUrl: proxiedImage(minecraftLiveHeroImage),
    imageCredit: "Mojang Studios / Microsoft",
    tags: ["Minecraft", "Minecraft Live", "Mojang", "Microsoft", "Showcase"],
    relatedLinks: [
      { label: "Game Database", url: "games.html" },
      { label: "GCX Social", url: "community.html" },
    ],
    sourceLinks: [minecraftLiveSource],
    media: [
      {
        id: "minecraft-live-hero-cape-official-art",
        mediaType: "image",
        afterHeading: "The Hero Cape Is Part of the Current Push",
        source: "Mojang Studios / Microsoft",
        sourceUrl: "https://www.minecraft.net/en-us/live",
        imageUrl: proxiedImage(minecraftHeroCapeImage),
        caption: "Official Hero Cape promotional image from the Minecraft Live page.",
        credit: "Mojang Studios / Microsoft",
        altText: "Official Minecraft Hero Cape promotional image.",
        rightsStatus: "press-asset",
      },
      {
        id: "minecraft-live-wilderness-bound-official-art",
        mediaType: "image",
        afterHeading: "Wilderness Bound Is Already Live",
        source: "Mojang Studios / Microsoft",
        sourceUrl: "https://www.minecraft.net/en-us/live",
        imageUrl: proxiedImage(minecraftWildernessImage),
        caption: "Official Minecraft Live page artwork tied to the current Wilderness Bound game drop.",
        credit: "Mojang Studios / Microsoft",
        altText: "Official Minecraft Wilderness Bound promotional artwork.",
        rightsStatus: "press-asset",
      },
      {
        id: "minecraft-live-stream-source-note",
        mediaType: "rights-note",
        afterHeading: "How to Watch",
        source: "Minecraft.net",
        sourceUrl: "https://www.minecraft.net/en-us/live",
        caption:
          "Games Exchange links the official Minecraft Live hub until Mojang publishes or exposes the exact approved YouTube livestream embed for this event.",
        rightsStatus: "source-link-only",
      },
      {
        id: "minecraft-live-more-official-media-needed",
        mediaType: "rights-note",
        afterHeading: "What Mojang Has Confirmed",
        source: "GCX media review",
        sourceUrl: "https://www.minecraft.net/en-us/live",
        caption:
          "The article will add the exact official YouTube livestream embed once Mojang publishes or exposes the approved player URL.",
        rightsStatus: "source-link-only",
      },
    ],
    body: [
      "Minecraft Live returns this Saturday, September 26, and Mojang is once again using the livestream format to deliver updates, creators, and news from across the wider Minecraft ecosystem.",
      "The next show is scheduled for **1 PM ET / 10 AM PT**, and Mojang's official Minecraft Live hub says viewers can watch on Minecraft.net/live, YouTube, and Twitch.",
      "## How to Watch",
      "**Date:** Saturday, September 26, 2026\n**Time:** 1 PM ET / 10 AM PT\n**Where:** Minecraft.net/live, YouTube, and Twitch\n**Expected length:** about 30 to 60 minutes",
      "## What Mojang Has Confirmed",
      "Mojang describes Minecraft Live as a virtual event with news about Minecraft games, content creators, updates, and more.",
      "The official FAQ also says the show typically runs between thirty minutes and one hour, depending on how much there is to share.",
      {
        type: "table",
        caption: "Minecraft Live quick facts from Mojang's official hub.",
        headers: ["Item", "Official status", "Why it matters"],
        rows: [
          ["Date and time", "September 26, 2026 at 1 PM ET", "Readers can plan around the actual showcase window."],
          ["Watch locations", "Minecraft.net/live, YouTube, Twitch", "The article can add an embed once Mojang publishes the approved stream."],
          ["Show length", "About 30 to 60 minutes", "Sets expectations without overselling a marathon showcase."],
          ["Next update", "Tune in to find out", "Mojang is teasing update news without naming the feature yet."],
        ],
      },
      "## The Hero Cape Is Part of the Current Push",
      "One concrete promotion tied to the current Minecraft Live page is the **Hero Cape**.",
      "Mojang says players who use the same Microsoft account to play Minecraft Dungeons I and Minecraft Dungeons II can qualify for the cape in Minecraft Dungeons II and in Minecraft: Java Edition and Bedrock Edition.",
      "## Wilderness Bound Is Already Live",
      "The Minecraft Live hub also highlights **Wilderness Bound**, the current game drop available now in Minecraft.",
      "That gives the event immediate context: Mojang is not just promoting a future show, it is using the page to connect current content with whatever comes next.",
      "## What We're Watching",
      "* the next update reveal\n* any Minecraft Dungeons II visibility tied to the Hero Cape push\n* creator and community segments\n* anything that clarifies Mojang's roadmap for the next few months",
      "## What Not to Present as Confirmed",
      "GCX should not present a specific biome, expansion, surprise spin-off, platform change, or release date as confirmed unless Mojang says it directly.",
      "## Latest Update - September 24, 2026",
      "Mojang's official Minecraft Live hub confirms the September 26 timing, watch locations, Hero Cape promotion, and Wilderness Bound context.",
    ],
  }),
  story("gcx-newsroom-silent-hill-townfall-launch-first-person-horror", {
    title: "Silent Hill: Townfall Is Out Today - and Its First-Person Shift Changes More Than Just the Camera",
    seoTitle: "Silent Hill: Townfall Launches Today on PS5 and PC",
    excerpt:
      "Townfall brings Silent Hill to the Scottish island of St. Amelia with first-person exploration, puzzle-driven horror, and a CRTV mechanic built around unstable signals.",
    metaDescription:
      "Silent Hill: Townfall launches on PS5 and PC, bringing a first-person perspective, puzzle-driven horror, and the foggy Scottish setting of St. Amelia to Konami's horror franchise.",
    category: "Gaming",
    articleType: "Major News / Launch Coverage",
    publishedAt: "2026-09-24T12:00:00.000-04:00",
    lastUpdated: "2026-09-24",
    lastReviewedAt: "2026-09-24",
    opportunityScore: 93,
    topicCluster: "Silent Hill: Townfall",
    canonicalTopic: "Silent Hill: Townfall",
    targetSearchIntent: "Silent Hill Townfall launch, Silent Hill Townfall first person, St. Amelia, PS5 PC",
    updatePolicy: "Preserve this URL and update if Konami, PlayStation, Screen Burn, or Annapurna publish launch patches, review timing, or additional platform details.",
    claimStatus: "Official / GCX Analysis",
    confidence: "Official / GCX Analysis",
    heroImage: "https://blog.playstation.com/tachyon/2026/06/d86a7dc035f1d019e05b02b9af2c5946bf406659.jpg",
    heroImageSource: "PlayStation Blog official Silent Hill: Townfall feature image",
    heroImageSourceUrl: "https://blog.playstation.com/2026/06/02/silent-hill-townfall-launches-september-24-on-ps5/",
    heroImageCredit: "Konami / Screen Burn Interactive / PlayStation",
    heroImageAlt: "Simon explores the fog-covered Scottish island of St. Amelia in Silent Hill: Townfall.",
    heroImageFocalX: "50%",
    heroImageFocalY: "46%",
    trailerUrl: "https://www.youtube.com/watch?v=owiC_bApFmU",
    mediaType: "key-art",
    imageUrl: "https://blog.playstation.com/tachyon/2026/06/d86a7dc035f1d019e05b02b9af2c5946bf406659.jpg",
    imageCredit: "Konami / Screen Burn Interactive / PlayStation",
    tags: ["Silent Hill", "Konami", "Screen Burn Interactive", "Annapurna Interactive", "Horror", "PlayStation"],
    relatedLinks: [
      { label: "PS5 Game Library", url: "ps5.html" },
      { label: "Game Database", url: "games.html" },
    ],
    sourceLinks: [
      { label: "Konami official release-date announcement", url: "https://www.konami.com/games/eu/en/topics/19146/" },
      { label: "PlayStation Blog official Townfall feature", url: "https://blog.playstation.com/2026/06/02/silent-hill-townfall-launches-september-24-on-ps5/" },
      { label: "Official Silent Hill: Townfall site", url: "https://www.konami.com/games/silenthill/townfall/us/en/" },
    ],
    media: [
      {
        id: "silent-hill-townfall-official-playstation-key-art",
        mediaType: "image",
        placement: "after-dek",
        source: "PlayStation Blog / Konami",
        sourceUrl: "https://blog.playstation.com/2026/06/02/silent-hill-townfall-launches-september-24-on-ps5/",
        imageUrl: "https://blog.playstation.com/tachyon/2026/06/d86a7dc035f1d019e05b02b9af2c5946bf406659.jpg",
        caption: "Official PlayStation Blog artwork for Silent Hill: Townfall's release-date reveal.",
        credit: "Konami / Screen Burn Interactive / PlayStation",
        altText: "Simon holds a device while standing in foggy Silent Hill Townfall artwork.",
        rightsStatus: "press-asset",
      },
      {
        id: "silent-hill-townfall-official-trailer",
        mediaType: "trailer",
        afterHeading: "Why First Person Matters",
        source: "Konami / PlayStation",
        sourceUrl: "https://www.youtube.com/watch?v=owiC_bApFmU",
        embedUrl: "https://www.youtube.com/watch?v=owiC_bApFmU",
        caption: "Konami's official Silent Hill: Townfall trailer highlights the first-person perspective and St. Amelia setting.",
        credit: "Video: Konami / Screen Burn Interactive",
        rightsStatus: "official-embed",
      },
      {
        id: "silent-hill-townfall-trailer-thumbnail",
        mediaType: "screenshot",
        afterHeading: "A Launch Worth Watching",
        source: "PlayStation official YouTube trailer thumbnail",
        sourceUrl: "https://www.youtube.com/watch?v=eXLfSEipn7I",
        imageUrl: "https://i.ytimg.com/vi/eXLfSEipn7I/maxresdefault.jpg",
        caption: "Official trailer thumbnail for Silent Hill: Townfall from PlayStation's YouTube embed.",
        credit: "Konami / Screen Burn Interactive / PlayStation",
        altText: "A character appears in official Silent Hill Townfall trailer art.",
        rightsStatus: "press-asset",
      },
      {
        id: "silent-hill-townfall-more-official-media-needed",
        mediaType: "rights-note",
        afterHeading: "What We Know",
        source: "GCX media review",
        sourceUrl: "https://www.konami.com/games/eu/en/topics/19146/",
        caption:
          "Games Exchange will add separate official St. Amelia, CRTV, and creature screenshots once approved source URLs are available from Konami, PlayStation, or the press kit.",
        rightsStatus: "source-link-only",
      },
    ],
    body: [
      "Silent Hill: Townfall launches today on PlayStation 5, Steam, and the Epic Games Store, giving Konami's long-running horror series another major reinvention.",
      "Developed by **Screen Burn Interactive** and co-published by **Konami** and **Annapurna Interactive**, Townfall trades the series' usual third-person distance for a more intimate first-person perspective.",
      "## Silent Hill Moves to St. Amelia",
      "Townfall is set on **St. Amelia**, a cold, isolated Scottish island wrapped in fog, guilt, and things that do not want to stay buried.",
      "Players step into the role of **Simon Ordell**, who is drawn back to the island to put things right while using a strange CRTV pocket television to uncover pieces of the town's past.",
      "## Why First Person Matters",
      "Sony's preview of the game makes the angle clear: Townfall is using first person to make the horror more immediate, more vulnerable, and more claustrophobic.",
      "Instead of watching fear happen to a character, players experience the island directly through Simon's perspective. That affects exploration, puzzle-solving, evasion, combat, and the emotional tone of the game.",
      "## Puzzle Horror, Not Just Combat Horror",
      "Konami has described Townfall as a full-length, self-contained psychological horror game, and the design language appears to lean as hard on atmosphere and puzzles as it does on direct confrontation.",
      "The CRTV is central to that identity. It is a core mechanic for uncovering clues, tuning into unstable signals, and navigating the layered reality of St. Amelia.",
      "## What We Know",
      "* Silent Hill: Townfall launches September 24, 2026\n* platforms: PS5, Steam, Epic Games Store\n* developed by Screen Burn Interactive\n* co-published by Konami and Annapurna Interactive\n* set on the island of St. Amelia\n* Simon Ordell is the player character\n* the game is played in first person\n* the CRTV is central to puzzles and exploration",
      "## What We Still Don't Know",
      "* how long Townfall ultimately is\n* how heavily it leans into combat versus evasion\n* whether it becomes one of the series' more influential experiments\n* how broadly players embrace the first-person approach",
      "## A Launch Worth Watching",
      "If the first-person approach lands, Townfall may influence what players expect from future Silent Hill games - not because it copies the past, but because it proves the franchise can still mutate without losing itself.",
      "## Latest Update - September 24, 2026",
      "Konami and PlayStation's official materials frame Townfall around St. Amelia, Simon Ordell, first-person horror, narrative puzzles, and the CRTV mechanic.",
    ],
  }),
  story("gcx-newsroom-control-resonant-launch-hotfix-combat", {
    title: "CONTROL Resonant Is Out Now - and Remedy's First Hotfix Goes Straight After Early Combat Complaints",
    seoTitle: "CONTROL Resonant Launches With First Hotfix for Early Combat Issues",
    excerpt:
      "Remedy's CONTROL sequel is out now, and the launch conversation is already being shaped by a fast first hotfix aimed at early combat feel.",
    metaDescription:
      "CONTROL Resonant is out now on PS5, Xbox Series X and Series S, and PC, and Remedy has already pushed its first hotfix to address early complaints about enemy durability and combat flow.",
    category: "Gaming",
    articleType: "Major News / Launch Coverage",
    publishedAt: "2026-09-24T13:00:00.000-04:00",
    lastUpdated: "2026-09-24",
    lastReviewedAt: "2026-09-24",
    opportunityScore: 94,
    topicCluster: "CONTROL Resonant",
    canonicalTopic: "CONTROL Resonant",
    targetSearchIntent: "Control Resonant launch hotfix, Remedy combat patch, Control Resonant enemy health",
    updatePolicy: "Preserve this URL and update if Remedy publishes additional patch notes, launch statements, or official media assets.",
    claimStatus: "Official / Verified Reporting / GCX Analysis",
    confidence: "Official / Verified Reporting / GCX Analysis",
    heroImage: "https://img.youtube.com/vi/SqvAvOAd1VA/maxresdefault.jpg",
    heroImageSource: "Official Remedy YouTube launch trailer thumbnail",
    heroImageSourceUrl: "https://www.youtube.com/watch?v=SqvAvOAd1VA",
    heroImageCredit: "Remedy Entertainment",
    heroImageAlt: "Official CONTROL Resonant launch trailer image showing Dylan Faden amid paranatural action.",
    heroImageFocalX: "50%",
    heroImageFocalY: "44%",
    trailerUrl: "https://www.youtube.com/watch?v=SqvAvOAd1VA",
    mediaType: "trailer-thumbnail",
    imageUrl: "https://img.youtube.com/vi/SqvAvOAd1VA/maxresdefault.jpg",
    imageCredit: "Remedy Entertainment",
    tags: ["CONTROL Resonant", "Remedy", "Control", "Hotfix", "Action RPG", "PlayStation", "Xbox", "PC"],
    relatedLinks: [
      { label: "PS5 Game Library", url: "ps5.html" },
      { label: "Xbox Series Library", url: "games.html" },
    ],
    sourceLinks: [
      { label: "Remedy official launch trailer press release", url: "https://mailchi.mp/remedygames.com/controlresonantlaunchtrailer" },
      { label: "Remedy media and influencers page", url: "https://www.remedygames.com/media-and-influencers" },
      { label: "Official CONTROL Resonant Steam announcements", url: "https://steamcommunity.com/app/3669870/announcements/" },
      { label: "Remedy official support", url: "https://remedy.helpshift.com/hc/en/5-control-resonant/" },
    ],
    media: [
      {
        id: "control-resonant-official-launch-trailer",
        mediaType: "trailer",
        placement: "after-dek",
        source: "Remedy Entertainment",
        sourceUrl: "https://www.youtube.com/watch?v=SqvAvOAd1VA",
        embedUrl: "https://www.youtube.com/watch?v=SqvAvOAd1VA",
        caption: "Remedy's official CONTROL Resonant launch trailer.",
        credit: "Video: Remedy Entertainment",
        rightsStatus: "official-embed",
      },
      {
        id: "control-resonant-launch-trailer-thumbnail",
        mediaType: "screenshot",
        afterHeading: "Remedy's Sequel Is Finally Here",
        source: "Remedy Entertainment official YouTube trailer thumbnail",
        sourceUrl: "https://www.youtube.com/watch?v=SqvAvOAd1VA",
        imageUrl: "https://img.youtube.com/vi/SqvAvOAd1VA/maxresdefault.jpg",
        caption: "Official CONTROL Resonant launch trailer thumbnail from Remedy's YouTube upload.",
        credit: "Remedy Entertainment",
        altText: "Official CONTROL Resonant launch trailer thumbnail.",
        rightsStatus: "press-asset",
      },
      {
        id: "control-resonant-media-kit-note",
        mediaType: "rights-note",
        afterHeading: "The First Hotfix Focuses on Combat Feel",
        source: "Remedy media kit",
        sourceUrl: "https://www.remedygames.com/media-and-influencers",
        caption:
          "Remedy lists launch and Gamescom media kits; Games Exchange will add separate combat, Manhattan, and story screenshots once approved image URLs are captured.",
        rightsStatus: "source-link-only",
      },
    ],
    body: [
      "CONTROL Resonant launches today for PlayStation 5, Xbox Series X and Series S, and PC, bringing players back into Remedy's paranatural universe with Dylan Faden at the center of the story.",
      "But the launch-day conversation is not just about the game finally being available.",
      "Remedy has already pushed out its first hotfix, addressing one of the biggest early complaints around the game's combat: enemies feeling too durable in the opening hours.",
      "## Remedy's Sequel Is Finally Here",
      "Remedy locked in the September 24 release date earlier this year, confirming a worldwide launch across PS5, Xbox Series X and Series S, Steam, and the Epic Games Store.",
      "The sequel shifts the spotlight from Jesse Faden to **Dylan Faden**, who is sent into a Manhattan being warped by new supernatural forces.",
      "## The First Hotfix Focuses on Combat Feel",
      "Launch-day patch coverage suggests Remedy moved quickly to respond to one of the loudest early criticisms: combat pacing.",
      "The first hotfix reportedly lowers base health for most enemies, adjusts Falter requirements, improves Dylan's damage scaling, reduces respeccing friction, and clarifies some UI wording around combat stats.",
      "## Why the Patch Matters",
      "Fast balance updates are becoming normal, but this one is notable because it hits one of the game's defining systems right away.",
      "If players feel underpowered and combat feels sticky in the first few hours, that can shape the game's reputation almost immediately. By moving on day one, Remedy is trying to get ahead of that narrative.",
      "## What We Know",
      "* CONTROL Resonant launches September 24, 2026\n* platforms: PS5, Xbox Series X and Series S, Steam, Epic Games Store\n* Mac version is still planned for later in 2026\n* Dylan Faden is the playable lead\n* Remedy has shipped a first hotfix focused on early combat balance and progression feel",
      "## What We Still Don't Know",
      "* whether the launch-day hotfix fully solves early combat complaints\n* whether additional balance patches are already planned\n* how the wider player base will respond over the first weekend\n* when the Mac version will arrive",
      "## Launch Day Is Now Also Patch Day",
      "That is not automatically a bad sign. Sometimes it simply means a studio is reacting fast.",
      "Still, the first big conversation around CONTROL Resonant is no longer just that the sequel is out. It is also that Remedy is already tuning the combat.",
      "## Latest Update - September 24, 2026",
      "Remedy's official launch-trailer press release confirms the September 24 launch, platforms, edition details, and official media-kit availability. GCX is tracking the first hotfix through official announcement channels.",
    ],
  }),
];

const existing = readJson(newsroomPath);
if (!Array.isArray(existing)) {
  throw new Error("data/newsroom.json must be an array");
}

const incomingIds = new Set(stories.map((item) => item.id));
const preserved = existing.filter((item) => !incomingIds.has(item.id));
writeJson(newsroomPath, [...stories, ...preserved]);

console.log(
  JSON.stringify(
    {
      ok: true,
      imported: stories.map((item) => item.id),
      total: stories.length + preserved.length,
    },
    null,
    2
  )
);

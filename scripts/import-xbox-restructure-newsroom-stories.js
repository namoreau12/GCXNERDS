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
    qaScore: 92,
    deepResearchUsed: false,
    livingArticle: false,
    claimStatus: "Official / GCX Analysis",
    confidence: "Official / GCX Analysis",
    updateFrequency: "Update if Microsoft, Xbox, Activision, Undead Labs, Ninja Theory, or related official channels clarify ownership, staffing, publishing, or release timing.",
    ...fields,
  };
}

const xboxResetSource = {
  label: "Xbox Wire restructuring memo",
  url: "https://news.xbox.com/en-us/2026/09/22/continuing-our-reset/",
};

const stories = [
  story("gcx-newsroom-activision-next-halo-xbox-restructure", {
    title: "Activision Is Taking Over the Next Halo Game as Xbox Restructures Again",
    seoTitle: "Activision Will Develop the Next Halo Game Under Xbox Restructure",
    excerpt:
      "Xbox says Activision will lead development on the next Halo game with a new purpose-built team, while a smaller Halo Studios group keeps supporting the current community.",
    metaDescription:
      "Microsoft says Activision will develop the next Halo title as Xbox reorganizes first-party studios, moves Rare and World's Edge under Activision, and cuts 268 roles.",
    category: "Gaming",
    articleType: "Major News / Industry Analysis",
    publishedAt: "2026-09-23T10:30:00.000-04:00",
    lastUpdated: "2026-09-23",
    lastReviewedAt: "2026-09-23",
    opportunityScore: 99,
    topicCluster: "Halo / Xbox Restructure",
    canonicalTopic: "Xbox Restructure",
    targetSearchIntent: "Activision next Halo game, Xbox restructure, Halo Studios, Rare World's Edge Activision",
    updatePolicy:
      "Preserve this URL and update if Xbox names the game, confirms leadership, shows footage, or clarifies Halo Studios' ongoing role.",
    heroImage: "https://img.youtube.com/vi/DPrm70EK2f0/maxresdefault.jpg",
    heroImageSource: "Official Xbox YouTube trailer thumbnail",
    heroImageSourceUrl: "https://www.youtube.com/watch?v=DPrm70EK2f0",
    heroImageCredit: "Image: Xbox / Halo Studios",
    heroImageAlt: "Official Halo Campaign Evolved trailer image used as recognizable Halo franchise art.",
    heroImageFocalX: "50%",
    heroImageFocalY: "42%",
    trailerUrl: "https://www.youtube.com/watch?v=DPrm70EK2f0",
    mediaType: "trailer-thumbnail",
    imageUrl: "https://img.youtube.com/vi/DPrm70EK2f0/maxresdefault.jpg",
    imageCredit: "Image: Xbox / Halo Studios",
    tags: ["Halo", "Activision", "Xbox", "Microsoft", "Halo Studios", "Rare", "World's Edge"],
    relatedLinks: [
      { label: "Xbox Game Library", url: "xbox.html" },
      { label: "Original Xbox Game Library", url: "xbox-game.html" },
      { label: "Xbox 360 Game Library", url: "xbox360.html" },
    ],
    sourceLinks: [xboxResetSource],
    media: [
      {
        id: "halo-campaign-evolved-trailer-thumbnail",
        mediaType: "image",
        placement: "after-dek",
        source: "Xbox / Halo Studios",
        sourceUrl: "https://www.youtube.com/watch?v=DPrm70EK2f0",
        imageUrl: "https://img.youtube.com/vi/DPrm70EK2f0/maxresdefault.jpg",
        caption:
          "GCX is using official Halo trailer media as recognizable franchise art while Xbox has not shown the newly announced Activision-led Halo project.",
        credit: "Image: Xbox / Halo Studios",
        altText: "Official Halo trailer thumbnail showing recognizable Halo franchise imagery.",
        rightsStatus: "press-asset",
      },
      {
        id: "xbox-reset-source-note",
        mediaType: "rights-note",
        afterHeading: "This Is Part of a Much Bigger Xbox Reorganization",
        source: "Xbox Wire",
        sourceUrl: "https://news.xbox.com/en-us/2026/09/22/continuing-our-reset/",
        caption:
          "The restructuring details in this story come from Xbox Wire's September 22 memo. GCX will update this page if Xbox publishes game-specific media for the new Halo project.",
        rightsStatus: "source-link-only",
      },
    ],
    body: [
      "Halo is changing hands.",
      "Microsoft has confirmed that **Activision will develop the next Halo title** as part of another major reshuffling of Xbox's first-party studios.",
      "The new Halo team will be **purpose-built and separate from Call of Duty**, according to Xbox, while a smaller team at Halo Studios will remain in place to support the current Halo community and games already on the market.",
      "## Activision Gets the Next Halo",
      "Xbox says Activision's remit is expanding to include both **Rare** and **World's Edge**, while the publisher also takes on development of the next Halo title.",
      "The Halo project will be led by a newly created team inside Activision.",
      "## Halo Studios Is Not Disappearing",
      "The existing Halo Studios operation is not being shut down.",
      "Xbox says a smaller team there will continue supporting the Halo community and current games.",
      "That suggests the franchise is entering a split structure:",
      "* Activision: next major Halo title\n* Halo Studios: live support and existing releases",
      "## This Is Part of a Much Bigger Xbox Reorganization",
      "Xbox also announced:",
      "* Rare will move under Activision\n* World's Edge will move under Activision\n* Obsidian will move under Bethesda\n* Playground Games and Turn 10 will combine into one studio focused on Forza and Fable\n* Microsoft Casual Games will move under King",
      "Xbox also confirmed **268 role eliminations** across Halo Studios, other first-party studios, and central management functions.",
      "## Why This Matters",
      "Halo has been one of the defining brands of Xbox since the original console launched.",
      "Moving development of the next major game under Activision signals that Microsoft is willing to reorganize even its most iconic franchises if it believes a different structure can improve execution.",
      "## What We Still Don't Know",
      "Microsoft has not yet confirmed:",
      "* the title of the next Halo game\n* a release date\n* whether it is a sequel, reboot, or another format\n* who will lead the new Activision Halo team\n* how much of the current Halo Studios creative leadership moves with it\n* whether the game will remain exclusive to Xbox platforms",
      "## Latest Update - September 23, 2026",
      "Xbox confirmed the restructuring on September 22, including Activision's expanded role and its responsibility for the next Halo title.",
    ],
  }),
  story("gcx-newsroom-ninja-theory-proposed-closure-xbox", {
    title: "Ninja Theory Could Close After Two Sale Deals Fell Through",
    seoTitle: "Ninja Theory Faces Proposed Closure After Two Failed Sale Deals",
    excerpt:
      "Xbox says two proposed deals to move Ninja Theory to new ownership fell through, and consultation has begun on a proposed closure while alternatives are still being explored.",
    metaDescription:
      "Ninja Theory faces a proposed closure after two sale agreements fell through, according to Xbox's September 2026 restructuring memo.",
    category: "Gaming",
    articleType: "Major News",
    publishedAt: "2026-09-23T10:20:00.000-04:00",
    lastUpdated: "2026-09-23",
    lastReviewedAt: "2026-09-23",
    opportunityScore: 95,
    topicCluster: "Xbox Restructure / Ninja Theory",
    canonicalTopic: "Ninja Theory",
    targetSearchIntent: "Ninja Theory proposed closure, Xbox restructure, Senua 2027, two sale deals fell through",
    updatePolicy:
      "Preserve this URL and update if Microsoft confirms a final decision, a buyer emerges, or Ninja Theory clarifies the status of Senua.",
    heroImage: "https://cms-assets.xboxservices.com/assets/04/85/0485e4ba-bb39-4fe3-9807-609dbeca11f2.jpg?n=246246_GLP-Page-Hero-1084_1920x1080_01.jpg",
    heroImageSource: "Official Xbox Senua page",
    heroImageSourceUrl: "https://www.xbox.com/en-US/games/senua",
    heroImageCredit: "Image: Xbox Game Studios / Ninja Theory",
    heroImageAlt: "Senua stands with weapons in official Senua key art from Xbox.",
    heroImageFocalX: "48%",
    heroImageFocalY: "42%",
    trailerUrl: "https://www.youtube.com/watch?v=91LAY9B6lUc",
    mediaType: "key-art",
    imageUrl: "https://cms-assets.xboxservices.com/assets/04/85/0485e4ba-bb39-4fe3-9807-609dbeca11f2.jpg?n=246246_GLP-Page-Hero-1084_1920x1080_01.jpg",
    imageCredit: "Image: Xbox Game Studios / Ninja Theory",
    tags: ["Ninja Theory", "Senua", "Hellblade", "Xbox", "Microsoft", "Industry"],
    relatedLinks: [
      { label: "Activision Is Taking Over the Next Halo Game", url: "article.html?id=gcx-newsroom-activision-next-halo-xbox-restructure" },
      { label: "Xbox Game Library", url: "xbox.html" },
    ],
    sourceLinks: [
      xboxResetSource,
      { label: "Official Senua game page", url: "https://www.xbox.com/en-US/games/senua" },
      { label: "Official Senua announcement", url: "https://www.senuagame.com/news/announcing-senua/" },
    ],
    media: [
      {
        id: "senua-official-xbox-key-art",
        mediaType: "image",
        placement: "after-dek",
        source: "Xbox Game Studios / Ninja Theory",
        sourceUrl: "https://www.xbox.com/en-US/games/senua",
        imageUrl: "https://cms-assets.xboxservices.com/assets/04/85/0485e4ba-bb39-4fe3-9807-609dbeca11f2.jpg?n=246246_GLP-Page-Hero-1084_1920x1080_01.jpg",
        caption: "Official Senua key art from Xbox's game page.",
        credit: "Image: Xbox Game Studios / Ninja Theory",
        altText: "Senua stands with weapons in official key art.",
        rightsStatus: "press-asset",
      },
      {
        id: "senua-official-feature-image",
        mediaType: "image",
        afterHeading: "Senua Was Announced for 2027",
        source: "Xbox Game Studios / Ninja Theory",
        sourceUrl: "https://www.xbox.com/en-US/games/senua",
        imageUrl: "https://cms-assets.xboxservices.com/assets/a3/d6/a3d64bd9-f74d-46e3-8019-6df0d73d3cc2.jpg?n=246246_Feature-Image-Priority-Full-Width-0_1248x702_01.jpg",
        caption: "Official Senua screenshot from Xbox's game page.",
        credit: "Image: Xbox Game Studios / Ninja Theory",
        altText: "Senua confronts a fantasy enemy in official Senua imagery.",
        rightsStatus: "press-asset",
      },
    ],
    body: [
      "Ninja Theory's future is suddenly in serious doubt.",
      "Microsoft says **two separate agreements to move Ninja Theory to new ownership fell through**, and Xbox has now begun consultation with employees on a **proposed closure**.",
      "The company says it is still exploring other possible paths forward.",
      "## Two Sale Agreements Failed",
      "Back in July, Microsoft said Ninja Theory had entered terms to join new ownership as part of Xbox's broader restructuring.",
      "That transition did not happen.",
      "In its September 22 update, Xbox said **two separate agreements fell through**.",
      "Microsoft has not publicly detailed who the potential buyers were or why the deals collapsed.",
      "## Consultation on Closure Has Started",
      "Xbox says it will now begin consultation with Ninja Theory employees on a proposed closure while continuing to explore alternatives.",
      "The wording matters.",
      "This is not the same as saying Ninja Theory has already closed.",
      "## Senua Was Announced for 2027",
      "The timing makes the situation especially notable because Ninja Theory revealed **Senua**, a new action-adventure set after Hellblade II, during the Xbox Games Showcase earlier this year.",
      "The project was announced for **2027**.",
      "Xbox has not said in this restructuring update what happens to Senua if Ninja Theory ultimately closes.",
      "## What We Know",
      "* two divestiture agreements fell through\n* Microsoft has begun consultation on a proposed closure\n* other options are still being explored\n* Senua was announced for 2027\n* Microsoft has not yet said what happens to that project if the studio closes",
      "## What We Don't Know",
      "* who the two potential buyers were\n* why the agreements failed\n* whether another buyer is still possible\n* whether the studio can remain intact\n* what happens to Senua\n* whether the Hellblade IP stays with Microsoft if closure occurs",
      "## Latest Update - September 23, 2026",
      "Microsoft confirmed the proposed closure process in its September 22 Xbox restructuring update.",
    ],
  }),
  story("gcx-newsroom-undead-labs-independent-state-of-decay-3-game-pass", {
    title: "Undead Labs Is Independent - but State of Decay 3 Is Still Coming Day One to Game Pass",
    seoTitle: "Undead Labs Leaves Xbox, State of Decay 3 Still Day One on Game Pass",
    excerpt:
      "Undead Labs says it has completed its separation from Xbox and is now employee-owned, while State of Decay 3 remains in active development for 2027.",
    metaDescription:
      "Undead Labs is independent after separating from Xbox, but State of Decay 3 remains targeted for 2027 and is still planned for Game Pass.",
    category: "Gaming",
    articleType: "Major News / Industry",
    publishedAt: "2026-09-23T10:10:00.000-04:00",
    lastUpdated: "2026-09-23",
    lastReviewedAt: "2026-09-23",
    opportunityScore: 93,
    topicCluster: "State of Decay / Xbox Restructure",
    canonicalTopic: "State of Decay 3",
    targetSearchIntent: "Undead Labs independent, State of Decay 3 Game Pass, Xbox restructure",
    updatePolicy:
      "Preserve this URL and update if Undead Labs names the new publisher, opens beta access, changes release timing, or Xbox clarifies Game Pass terms.",
    heroImage: "https://img.youtube.com/vi/eoLOzgHvKxQ/maxresdefault.jpg",
    heroImageSource: "Official Xbox YouTube trailer thumbnail",
    heroImageSourceUrl: "https://www.youtube.com/watch?v=eoLOzgHvKxQ",
    heroImageCredit: "Image: Undead Labs / Xbox",
    heroImageAlt: "Official State of Decay 3 gameplay trailer thumbnail.",
    heroImageFocalX: "50%",
    heroImageFocalY: "44%",
    trailerUrl: "https://www.youtube.com/watch?v=eoLOzgHvKxQ",
    mediaType: "trailer-thumbnail",
    imageUrl: "https://img.youtube.com/vi/eoLOzgHvKxQ/maxresdefault.jpg",
    imageCredit: "Image: Undead Labs / Xbox",
    tags: ["State of Decay 3", "Undead Labs", "Xbox", "Game Pass", "Microsoft", "Industry"],
    relatedLinks: [
      { label: "Activision Is Taking Over the Next Halo Game", url: "article.html?id=gcx-newsroom-activision-next-halo-xbox-restructure" },
      { label: "Xbox Game Library", url: "xbox.html" },
    ],
    sourceLinks: [
      { label: "Undead Labs official announcement", url: "https://www.stateofdecay.com/undead-labs-becomes-independent-studio/" },
      xboxResetSource,
      { label: "State of Decay 3 gameplay reveal", url: "https://www.stateofdecay.com/state-of-decay-3-official-gameplay-reveal/" },
    ],
    media: [
      {
        id: "state-of-decay-3-official-trailer-thumbnail",
        mediaType: "image",
        placement: "after-dek",
        source: "Undead Labs / Xbox",
        sourceUrl: "https://www.youtube.com/watch?v=eoLOzgHvKxQ",
        imageUrl: "https://img.youtube.com/vi/eoLOzgHvKxQ/maxresdefault.jpg",
        caption: "Official State of Decay 3 gameplay reveal thumbnail.",
        credit: "Image: Undead Labs / Xbox",
        altText: "Official State of Decay 3 gameplay trailer thumbnail.",
        rightsStatus: "press-asset",
      },
      {
        id: "undead-labs-official-source-note",
        mediaType: "rights-note",
        afterHeading: "State of Decay 3 Is Still Coming to Game Pass",
        source: "Undead Labs",
        sourceUrl: "https://www.stateofdecay.com/undead-labs-becomes-independent-studio/",
        caption:
          "Undead Labs says State of Decay 3 remains actively underway and targeted for 2027. Xbox Wire separately says it will release day one on Game Pass with a new publisher.",
        rightsStatus: "source-link-only",
      },
    ],
    body: [
      "Undead Labs is no longer an Xbox-owned studio.",
      "Microsoft confirmed that the **State of Decay developer has successfully transitioned to new ownership**, joining the growing list of studios leaving Xbox as part of the company's restructuring.",
      "But there is a twist:",
      "**State of Decay 3 is still planned to launch day one on Game Pass.**",
      "Xbox says the game will be released with a **new publisher**.",
      "## Undead Labs Leaves Xbox",
      "In July, Microsoft said Undead Labs had entered terms to move to new ownership.",
      "That transition is now complete.",
      "Undead Labs says it has completed its separation from Xbox and is now operating as an independent, employee-owned studio.",
      "## State of Decay 3 Is Still Coming to Game Pass",
      "The studio's departure does not mean Xbox is walking away from the next game.",
      "Microsoft says **State of Decay 3 will still release day one on Game Pass**.",
      "Undead Labs says the game remains actively underway and is targeted for **2027** on Xbox, Game Pass, PC, and PlayStation.",
      "## This Could Be a Preview of Xbox's New Model",
      "The deal reflects a broader shift happening inside Microsoft.",
      "Rather than owning every studio that makes important games for Xbox, the company appears increasingly willing to support independent teams through publishing, distribution, Game Pass, and platform partnerships.",
      "## What Changes",
      "* Undead Labs is no longer owned by Microsoft\n* the studio has transitioned to independent, employee-owned operation\n* a new publisher will handle State of Decay 3",
      "## What Stays",
      "* State of Decay 3 remains in development\n* it is still planned for day-one Game Pass\n* Xbox remains commercially connected to the release",
      "## Latest Update - September 23, 2026",
      "Xbox confirmed on September 22 that Undead Labs has completed its transition out of Microsoft ownership and that State of Decay 3 will still launch day one on Game Pass with a new publisher.",
    ],
  }),
];

const existing = readJson(newsroomPath);
const incomingIds = new Set(stories.map((item) => item.id));
const remaining = existing.filter((item) => !incomingIds.has(item.id));
writeJson(newsroomPath, [...stories, ...remaining]);

console.log(JSON.stringify({ ok: true, imported: stories.length, total: stories.length + remaining.length }, null, 2));

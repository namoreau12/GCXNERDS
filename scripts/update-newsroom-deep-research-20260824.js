const fs = require("fs");
const path = require("path");

const newsroomPath = path.join(__dirname, "..", "data", "newsroom.json");
const stories = JSON.parse(fs.readFileSync(newsroomPath, "utf8"));

function mustFind(id) {
  const story = stories.find((item) => item.id === id);
  if (!story) throw new Error(`Missing newsroom story: ${id}`);
  return story;
}

function mergeById(existing = [], next = []) {
  const keyFor = (item) => item.id || item.url || item.label;
  const byId = new Map(existing.map((item) => [keyFor(item), item]));
  for (const item of next) byId.set(keyFor(item), { ...byId.get(keyFor(item)), ...item });
  return Array.from(byId.values());
}

const pokemon = mustFind("gcx-newsroom-pokemon-winds-waves-turn-based-battles-champions");
Object.assign(pokemon, {
  title: "Is Pokemon Preparing to Change Traditional Turn-Based Battles?",
  seoTitle: "Is Pokemon Moving Away From Turn-Based Battles?",
  excerpt:
    "Game Freak has not confirmed that Pokemon Winds and Waves is abandoning turns. But Pokemon Champions may explain how the RPG series can experiment while classic competitive battles survive.",
  metaDescription:
    "Game Freak says Pokemon Champions preserves classic battles as the series explores new ideas. Here's what that could mean for Pokemon Winds and Waves.",
  lastUpdated: "2026-08-24",
  lastReviewedAt: "2026-08-24",
  editorialStatus: "ready-for-publish",
  claimStatus: "Official / Verified Reporting / GCX Analysis",
  qaScore: Math.max(Number(pokemon.qaScore) || 0, 95),
  opportunityScore: Math.max(Number(pokemon.opportunityScore) || 0, 97),
  updatePolicy:
    "Preserve this URL. Update when Game Freak or The Pokemon Company demonstrates Winds/Waves combat, explains its battle system, changes Champions/VGC integration, or confirms how new Pokemon move between future RPGs and Champions.",
});

pokemon.sourceLinks = mergeById(pokemon.sourceLinks, [
  {
    label: "Official Pokemon Winds and Pokemon Waves site",
    url: "https://windswaves.pokemon.com/en-us/",
  },
  {
    label: "Official Pokemon Winds and Pokemon Waves press announcement",
    url: "https://press.pokemon.com/en/Pokemon-Continues-30th-Celebrations-with-the-Unveiling-of-Pokemon-Wind",
  },
  {
    label: "Game Freak Pokemon Champions development episode",
    url: "https://www.youtube.com/watch?v=_L8vxG68-Bc",
  },
  {
    label: "Official Pokemon Champions site",
    url: "https://champions.pokemon.com/en-us/",
  },
  {
    label: "Official Pokemon Champions launch announcement",
    url: "https://press.pokemon.com/en/Pokemon-Champions-Available-Now",
  },
  {
    label: "Official Pokemon Legends: Z-A gameplay explanation",
    url: "https://legends.pokemon.com/en-us/gameplay",
  },
  {
    label: "Official Pokemon Legends: Arceus gameplay explanation",
    url: "https://legends.arceus.pokemon.com/en-us/gameplay",
  },
  {
    label: "Official Pokemon Scarlet and Violet battle guide",
    url: "https://scarletviolet.pokemon.com/en-us/trainers-guide/battling-pokemon/",
  },
  {
    label: "GamesRadar report on Game Freak battle-system comments",
    url: "https://www.gamesradar.com/games/pokemon/pokemon-winds-and-waves-might-not-have-turn-based-battles-as-game-freak-veteran-hints-the-combat-system-could-change-thanks-to-pokemon-champions/",
  },
  {
    label: "Kotaku report on Pokemon Champions and turn-based battle preservation",
    url: "https://kotaku.com/pokemon-champions-turn-based-real-time-battles-winds-waves-2000726753",
  },
]);

pokemon.media = mergeById(pokemon.media, [
  {
    id: "pokemon-battle-system-fork-analysis",
    mediaType: "image",
    placement: "after-dek",
    imageUrl: "assets/news/pokemon-battle-system-fork.svg",
    source: "GCX editorial analysis graphic",
    sourceUrl: "article.html?id=gcx-newsroom-pokemon-winds-waves-turn-based-battles-champions",
    caption:
      "The current evidence supports a battle-system fork: Pokemon Champions preserves classic competitive battles while future RPGs may have more room to experiment.",
    credit: "GCX",
    altText: "Editorial graphic showing Pokemon Champions preserving classic turn-based battles while future RPGs may experiment",
    rightsStatus: "owned",
  },
  {
    id: "pokemon-battle-direction-scenarios",
    mediaType: "rights-note",
    afterHeading: "Does This Mean Winds & Waves Will Be Real-Time?",
    source: "GCX editorial standards",
    sourceUrl: "docs/editorial-media-policy.md",
    caption:
      "GCX labels Winds & Waves combat as unannounced until an official Pokemon, Game Freak or Nintendo source demonstrates or describes the battle system.",
    rightsStatus: "source-link-only",
  },
]);

pokemon.body = [
  "# Is Pokemon Preparing to Change Traditional Turn-Based Battles?",
  "For nearly three decades, Pokemon battles have been built around one familiar ritual: choose a move, resolve the turn, read the opponent, repeat.",
  "That ritual is not officially going away. Game Freak has not confirmed that **Pokemon Winds** and **Pokemon Waves** are abandoning turn-based combat, and the official site for the 2027 Switch 2 RPGs does not yet identify a battle system.",
  "But the question has become much more serious because of **Pokemon Champions**.",
  "In a new Game Freak developer video, director Kazumasa Iwao frames Champions as a way to preserve the style of Pokemon battling longtime players know while Game Freak continues challenging itself with new ideas elsewhere. GamesRadar translated his comments as saying the long-standing battle rule could change \"little by little.\"",
  "The defensible read is not that turn-based Pokemon is dead. It is that Game Freak now has a cleaner way to protect traditional competitive play while allowing future RPGs to experiment.",
  "## The Short Version",
  {
    type: "table",
    headers: ["What GCX can say", "What GCX should not say yet"],
    rows: [
      ["Champions is built around traditional competitive Pokemon battles", "Winds & Waves has abandoned turn-based combat"],
      ["Game Freak has discussed battle rules changing gradually", "Legends: Z-A combat is confirmed for Generation 10"],
      ["Play! Pokemon competition is moving to Champions", "Classic Pokemon battles are being retired"],
      ["Future RPG experimentation looks more possible", "A hybrid or real-time system is guaranteed"],
    ],
  },
  "That distinction is the center of the story. The evidence supports a possible **battle-system fork**, not a confirmed replacement.",
  "## What Game Freak Actually Said",
  "The new hook is not simply that Game Freak might change Pokemon battles. The series has already experimented. What changed is that Game Freak is now explaining why it wanted a permanent home for the old rules.",
  "Iwao described longtime players as people who have built years of experience around a familiar Pokemon battle style. The studio does not want to simply tell those players to move on if the broader RPG series changes.",
  "Champions solves that problem by preserving the traditional battle framework in a dedicated game. That makes it more than a battle simulator. It may function as a preservation layer for classic Pokemon combat.",
  "English readers should treat the exact wording carefully: GCX is relying on reported translation and coverage for context, while the official Game Freak video remains the primary source.",
  "## The Battle System Has Already Been Changing",
  "The idea of Pokemon experimenting with combat would have sounded much more radical before the Switch era.",
  "**Pokemon Scarlet and Violet** still use the familiar turn-based baseline for standard wild and Trainer encounters.",
  "**Pokemon Legends: Arceus** loosened that structure. Battles could begin more directly in the field, and Agile and Strong Styles altered action speed and turn order.",
  "**Pokemon Legends: Z-A** crossed a clearer line. The official Pokemon site describes real-time battling, with Trainers and Pokemon moving during combat while move range, timing and area of effect become tactical variables.",
  "**Pokemon Champions** then moves in the opposite direction on purpose: it gives traditional competitive battling a persistent home.",
  "The pattern is not traditional turns suddenly becoming real-time combat. It is traditional turns, modified turn economy, spatial real-time experimentation, and then a dedicated place for classic competitive battles.",
  "## Why Champions Changes the Strategic Equation",
  "Historically, each new mainline RPG had to do several jobs at once: deliver the adventure, introduce new Pokemon, support collecting, carry new mechanics and serve as the current competitive platform.",
  "Champions separates those responsibilities.",
  "Play! Pokemon competitions are moving to Champions, and The Pokemon Company has described Champions around traditional turn-based Pokemon battles, familiar mechanics, Singles and Doubles support, and cross-platform competitive play.",
  "That means a future RPG may no longer need to be the only permanent home for the tournament ruleset. Designers can potentially ask what combat style fits a specific adventure instead of making every experiment carry the full weight of VGC.",
  "This is analysis, not a confirmed Game Freak plan. But it is a meaningful structural shift.",
  "## Does This Mean Winds & Waves Will Be Real-Time?",
  "**No. Not based on the evidence currently available.**",
  "Pokemon Winds and Pokemon Waves are the next new Pokemon RPG entries and are currently positioned for Nintendo Switch 2 in 2027. Their official materials emphasize a new world, islands, ocean environments and Pokemon ecosystems. They do not identify the combat format.",
  "That silence should not be converted into evidence.",
  {
    type: "table",
    headers: ["Possible direction", "Why it is plausible", "What is confirmed?"],
    rows: [
      ["Traditional turn-based combat", "It remains Pokemon RPGs' established language", "Nothing yet for Winds/Waves"],
      ["Modified turns", "Legends: Arceus already changed action order without abandoning commands", "Historical precedent only"],
      ["Real-time combat", "Legends: Z-A proves Game Freak has shipped real-time Pokemon RPG battles", "No Winds/Waves confirmation"],
      ["Hybrid system", "A large open world could support positioning while preserving command strategy", "Inference only"],
      ["Separate PvE and competitive formats", "Champions separates classic competitive play from adventure RPG design", "Infrastructure exists; future use unknown"],
    ],
  },
  "The strongest reading is that Game Freak is preparing for change to be possible, not that it has killed turn-based Pokemon.",
  "## Why This Could Be One of Pokemon's Biggest Design Shifts",
  "Pokemon battles are not just presentation. Types, Speed, switching, status effects, priority moves, held items, Abilities and prediction all grew around structured turn resolution.",
  "Real-time or hybrid battles change what speed, range and timing mean. Legends: Z-A already shows how positioning and execution speed can become part of Pokemon combat.",
  "For competitive players, Champions may be reassuring rather than threatening. It preserves the deep ruleset in a dedicated environment even if another RPG experiments with moment-to-moment control.",
  "For RPG players, the separation could let Game Freak make Pokemon feel more present in the world without forcing every legacy interaction into the same adventure engine.",
  "## Counterarguments and Uncertainties",
  "The biggest reason not to predict an imminent turn-based departure is simple: Game Freak has not announced one for Winds & Waves.",
  "The Legends line also does not automatically define the next paired RPGs. Z-A proves capability, not a permanent franchise rule.",
  "Champions also has independent reasons to exist even if future RPGs remain turn-based: it lowers the barrier to competitive battling and avoids rebuilding the competitive ecosystem around a new retail title every generation.",
  "The phrase \"little by little\" matters. It points just as easily toward gradual hybridization as it does toward replacement.",
  "## GCX Verdict",
  "**Game Freak appears to be preparing for a future in which traditional turn-based combat no longer has to be the battle system used by every major Pokemon RPG, while Pokemon Champions protects that classic system rather than replacing it.**",
  "That is a stronger and more honest story than declaring that Winds & Waves has already abandoned turns.",
  "## What GCX Is Watching Next",
  "The next real evidence will be gameplay, not mood footage.",
  "GCX will update this page when Pokemon Presents, Game Freak, The Pokemon Company or official VGC materials clarify how Winds & Waves battles work, how new Pokemon enter Champions, or whether future RPGs and Champions are meant to operate as separate battle ecosystems.",
  "# Latest Update - August 24, 2026",
  "GCX updated this article with the newsroom's deeper confirmed-vs-analysis framing, a clearer battle-system fork thesis, and an owned editorial graphic so the page has a stronger visual lead without relying on risky unlicensed screenshots.",
];

const consoleStory = mustFind("gcx-newsroom-console-sales-average-hardware-price-542");
Object.assign(consoleStory, {
  title: "Console Sales Are Sliding - Why the Average Gaming System Now Costs $542",
  seoTitle: "Why U.S. Console Sales Fell as Prices Hit $542",
  excerpt:
    "U.S. console unit sales fell sharply in July while the average hardware price climbed to $542. The bigger story is not console gaming dying - it is affordable hardware getting harder to make.",
  metaDescription:
    "U.S. console hardware units fell 39% in July while the average selling price rose to $542. Here's what Circana and the console makers say is happening.",
  lastUpdated: "2026-08-24",
  lastReviewedAt: "2026-08-24",
  editorialStatus: "ready-for-publish",
  claimStatus: "Official / Verified Reporting / GCX Analysis",
  qaScore: Math.max(Number(consoleStory.qaScore) || 0, 95),
  opportunityScore: Math.max(Number(consoleStory.opportunityScore) || 0, 96),
});

consoleStory.sourceLinks = mergeById(consoleStory.sourceLinks, [
  {
    label: "Tom's Hardware report on July 2026 U.S. console sales and $542 ASP",
    url: "https://www.tomshardware.com/video-games/console-gaming/us-console-sales-fall-39-percent-in-july-as-memory-costs-push-average-price-to-542",
  },
  {
    label: "Mat Piscatella / Circana July 2026 hardware data thread",
    url: "https://bsky.app/profile/matpiscatella.bsky.social/post/3mtjcqw3aes2n",
  },
  {
    label: "Circana video game industry data page",
    url: "https://www.circana.com/industries/video-games",
  },
  {
    label: "Mat Piscatella historical hardware ASP comparison",
    url: "https://bsky.app/profile/matpiscatella.bsky.social/post/3ma6vnwvjmk2h",
  },
  {
    label: "Nintendo Switch 2 price revision announcement",
    url: "https://www.nintendo.com/us/whatsnew/price-revision-for-nintendo-switch-2-system/",
  },
  {
    label: "Nintendo Switch 2 launch pricing announcement",
    url: "https://www.nintendo.com/us/whatsnew/nintendo-switch-2-launches-june-5-bringing-new-forms-of-game-communication-to-life/",
  },
  {
    label: "Xbox Wire updated Xbox console prices",
    url: "https://news.xbox.com/en-us/2026/06/25/xbox-console-price-update/",
  },
  {
    label: "Xbox Wire component-cost reset explanation",
    url: "https://news.xbox.com/en-us/2026/06/10/next-100-days-xbox-reset/",
  },
  {
    label: "PlayStation Blog PS5 price changes",
    url: "https://blog.playstation.com/2026/03/27/new-price-changes-for-ps5-ps5-pro-and-playstation-portal-remote-player/",
  },
  {
    label: "PlayStation Blog original PS5 launch pricing",
    url: "https://blog.playstation.com/2020/09/16/playstation-5-launches-in-november-starting-at-399-for-ps5-digital-edition-and-499-for-ps5-with-ultra-hd-blu-ray-disc-drive/",
  },
  {
    label: "Micron statement on AI-driven memory and storage demand",
    url: "https://investors.micron.com/news/press-release/2025/Micron-Announces-Exit-from-Crucial-Consumer-Business-12-03-2025/default.aspx",
  },
  {
    label: "Samsung 2026 first-quarter interim report",
    url: "https://images.samsung.com/is/content/samsung/assets/global/ir/docs/2026_1Q_Interim_Report.pdf",
  },
]);

consoleStory.media = mergeById(consoleStory.media, [
  {
    id: "console-component-pressure-flow",
    mediaType: "image",
    afterHeading: "Memory and Storage Are Now Part of the Console Story",
    imageUrl: "assets/news/console-component-pressure-flow.svg",
    source: "GCX editorial analysis graphic",
    sourceUrl: "article.html?id=gcx-newsroom-console-sales-average-hardware-price-542",
    caption:
      "GCX's hardware-economics model: AI/server demand can tighten memory and storage supply, which adds pressure to console bill-of-material costs and retail pricing.",
    credit: "GCX",
    altText: "Flow chart showing AI server demand leading to memory and storage pressure and higher console pricing",
    rightsStatus: "owned",
  },
]);

consoleStory.body = [
  "# Console Sales Are Sliding - Why the Average Gaming System Now Costs $542",
  "The console business has a new affordability problem.",
  "Circana reporting for July 2026 shows U.S. new video game hardware unit sales down **39% year over year**, while the average selling price of a new hardware unit rose **16% to $542**. Hardware dollar spending fell 29% to $282 million, the weakest July hardware-spending result since 2020.",
  "That sounds like a collapse story. It is more complicated than that.",
  "July 2025 was an unusually hard comparison because it came during the early Switch 2 launch window. Switch 2 is also still reportedly ahead of the original Switch on a time-aligned U.S. installed-base basis. So the right conclusion is not that console gaming is dying.",
  "The sharper story is this: **fewer U.S. systems are selling while the average price buyers pay is rising sharply.** That is a dangerous combination for a hardware market built on scale.",
  "## The July Snapshot",
  {
    type: "table",
    headers: ["July 2026 U.S. hardware measure", "Result", "Why it matters"],
    rows: [
      ["Hardware unit sales", "**-39% year over year**", "Demand fell sharply against a tough Switch 2 launch comparison"],
      ["Average selling price", "**$542**", "The average new system is no longer behaving like cheap late-cycle hardware"],
      ["ASP change", "**+16% year over year**", "Buyers are paying more even as fewer systems sell"],
      ["Hardware spending", "**$282 million**", "Down 29%, the weakest July hardware spend since 2020"],
    ],
  },
  "The unit decline is the headline. The ASP is the warning light.",
  "Historically, console hardware usually gets easier to sell as a generation matures because production improves, bundles get better, and price cuts eventually arrive. In 2026, that old pattern is under pressure.",
  "## What $542 Actually Means",
  "$542 is not the MSRP of \"the average console.\" It is a transaction-weighted average selling price for new video game hardware units purchased in the U.S. during July.",
  "That means the number can move because of bundles, premium models, product mix, promotions and manufacturer price changes. If cheaper hardware sells less frequently while premium systems carry more of the market, the average climbs.",
  "In 2026, though, the ASP story is not just mix. There are real list-price increases behind it.",
  "## The Price Hikes Are No Longer Isolated",
  "Sony, Microsoft and Nintendo have all moved U.S. console pricing upward in 2026 or scheduled increases that affect the market.",
  {
    type: "table",
    headers: ["Hardware", "Earlier U.S. price", "2026 U.S. pricing/action", "Change"],
    rows: [
      ["PS5 with disc drive", "$499.99 at 2020 launch", "$649.99 from April 2, 2026", "+$150"],
      ["PS5 Digital Edition", "$399.99 at 2020 launch", "$599.99 from April 2, 2026", "+$200"],
      ["PS5 Pro", "$749.99 after earlier adjustment", "$899.99 from April 2, 2026", "+$150"],
      ["Nintendo Switch 2", "$449.99 launch MSRP", "$499.99 beginning September 1, 2026", "+$50"],
      ["Xbox 512GB models", "varies by model", "+$100 from August 1, 2026", "capacity-based increase"],
      ["Xbox 1TB models", "varies by model", "+$150 from August 1, 2026", "capacity-based increase"],
    ],
  },
  "The Xbox row is intentionally listed by official change amount rather than forcing every Series S and Series X configuration into a single misleading baseline.",
  "The takeaway is still clear: the console market is not getting the traditional late-cycle affordability relief many buyers expect.",
  "## Why $542 Is the Number to Watch",
  "A $542 average does not mean every console on a shelf costs exactly $542. Average selling price can move because of bundles, premium models, product mix, retailer behavior and timing.",
  "But the direction matters. Circana also reported a $502 average hardware selling price for May 2026, up 14% versus May 2025. July pushed the snapshot higher again.",
  {
    type: "table",
    headers: ["U.S. hardware snapshot", "Average selling price", "Hardware spending", "Approx. units", "What it tells us"],
    rows: [
      ["Nov. 2019", "$235", "not listed here", "3.9M", "Pre-current-gen holiday benchmark"],
      ["Nov. 2025", "$439", "not listed here", "1.6M", "Higher ASP, lower unit volume than 2019"],
      ["May 2026", "$502", "$249M", "about 496K", "Spending up while ASP rose sharply"],
      ["July 2026", "$542", "$282M", "about 520K", "Units down 39%, ASP up 16%"],
    ],
  },
  "The table uses selected nominal snapshots, not an inflation-adjusted continuous index. May and July approximate unit counts are derived from published spending and ASP figures.",
  "## Memory and Storage Are Now Part of the Console Story",
  "Microsoft has been unusually direct about why its hardware prices are moving. The company says console storage and memory costs have increased dramatically and expects further pressure into 2027.",
  "That matters because modern consoles are not just plastic boxes and chips. Fast storage, memory capacity, cooling, controllers, licensing, tariffs, exchange rates and retailer economics all shape what a manufacturer can profitably put on shelves.",
  "The AI data-center boom has also changed the component market around memory and storage. Even when console demand softens, manufacturers may still be competing for parts in markets where higher-margin buyers have enormous appetite.",
  "## Why This Hurts More Than a Normal Price Increase",
  "A normal late-generation price increase is already painful. This one lands while buyers are also dealing with expensive games, subscriptions, accessories and upgrade uncertainty.",
  "That creates a squeeze: console makers need higher prices to protect margins, but higher prices can slow the unit volume that makes the platform attractive to publishers, retailers and accessory makers.",
  "For collectors and used-market buyers, the effect could be different. If new hardware stays expensive, used consoles may hold value longer. That is good for sellers, frustrating for late adopters and important for a marketplace like GCX to track responsibly.",
  "## What This Does Not Mean",
  "This is not proof that consoles are dying.",
  "Switch 2's 2025 launch created an unusually tough comparison. PlayStation dollar sales can rise even when units fall. Xbox hardware has a different strategic role as Microsoft leans harder into PC, cloud and Game Pass.",
  "The problem is more specific: **the old assumption that console hardware becomes cheaper and easier to sell as a generation matures is under unusual pressure.**",
  "## GCX Verdict",
  "The July numbers are less about one bad month and more about a market where affordability is becoming the defining hardware question.",
  "If console makers cannot restore the sense that new hardware is a mass-market purchase, the next wave of platform growth may depend as much on financing, used hardware, trade-in programs and bundles as it does on exclusive games.",
  "That is why GCX will keep tracking average selling price, unit volume, official MSRP changes and the used-console market together instead of treating each as a separate story.",
  "# Latest Update - August 24, 2026",
  "GCX updated this article with the newsroom's deeper explanation of what average selling price means, why July 2025 makes year-over-year comparisons tricky, and how memory/storage economics connect to console pricing.",
];

fs.writeFileSync(newsroomPath, `${JSON.stringify(stories, null, 2)}\n`);
console.log(JSON.stringify({
  updated: [pokemon.id, consoleStory.id],
  storyCount: stories.length,
  sourceCounts: {
    [pokemon.id]: pokemon.sourceLinks.length,
    [consoleStory.id]: consoleStory.sourceLinks.length,
  },
  mediaCounts: {
    [pokemon.id]: pokemon.media.length,
    [consoleStory.id]: consoleStory.media.length,
  },
}, null, 2));

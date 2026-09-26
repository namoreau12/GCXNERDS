const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "3ds-priority-boku-bombmonkey-reviewed-overviews-2026-08-25.csv"
);
const games = JSON.parse(fs.readFileSync(path.join(rootDir, "data", "games", "3ds.json"), "utf8"));
const gameById = new Map(games.map((game) => [game.id, game]));

const rows = [
  {
    platformSlug: "3ds",
    gameId: "3ds-boku-no-hero-academia-battle-for-all",
    title: "Boku no Hero Academia: Battle for All",
    sourceUrl: "https://www.dimps.co.jp/product/id-6",
    newOverview:
      "Boku no Hero Academia: Battle for All is Dimps' Nintendo 3DS arena-fighting adaptation of My Hero Academia. Players use character-specific Quirks, touch-screen Quirk Control, support sidekicks, and super attacks while working through story and challenge battles based around the early anime cast. GCX should present it as a Japan-only licensed hero-action fighter, with appeal tied to its roster, local wireless battles, unlockable customization, and franchise collecting value.",
  },
  {
    platformSlug: "3ds",
    gameId: "3ds-boku-wa-koukuu-kanseikan-airport-hero-3d-haneda-all-stars",
    title: "Boku wa Koukuu Kanseikan: Airport Hero 3D Haneda All Stars",
    sourceUrl: "https://www.suruga-ya.com/en/product/104000858",
    newOverview:
      "Boku wa Koukuu Kanseikan: Airport Hero 3D Haneda All Stars is a Japan-only air-traffic-control simulation and puzzle game from Sonic Powered. The Haneda All Stars edition focuses on coordinating traffic at Tokyo's busy Haneda Airport, issuing timely landing, taxi, takeoff, and routing commands so flights keep moving safely. It belongs in the library as a specialist simulation entry, not an action platformer, with collector interest tied to real-airport theming and the long-running Airport Hero series.",
  },
  {
    platformSlug: "3ds",
    gameId: "3ds-boku-wa-koukuu-kanseikan-airport-hero-3d-haneda-with-jal",
    title: "Boku wa Koukuu Kanseikan: Airport Hero 3D Haneda with JAL",
    sourceUrl: "https://www.amazon.com/Kouku-Kanseikan-Airport-Haneda-3DS-Nintendo/dp/B007KWRI4C",
    newOverview:
      "Boku wa Koukuu Kanseikan: Airport Hero 3D Haneda with JAL brings Sonic Powered's air-traffic-control puzzle formula to Tokyo Haneda with Japan Airlines branding. Players do not fly planes directly; the challenge is sequencing arrivals, departures, taxi routes, and runway use while preventing delays or unsafe conflicts. GCX should frame it as a methodical aviation-management game for 3DS simulation fans and collectors of Japan-only real-world airport releases.",
  },
  {
    platformSlug: "3ds",
    gameId: "3ds-boku-wa-koukuu-kanseikan-airport-hero-3d-kansai-all-stars",
    title: "Boku wa Koukuu Kanseikan: Airport Hero 3D Kansai All Stars",
    sourceUrl: "https://www.mobygames.com/game/160123/boku-wa-koku-kanseikan-airport-hero-3d-kanku-all-stars/",
    newOverview:
      "Boku wa Koukuu Kanseikan: Airport Hero 3D Kansai All Stars is an air-traffic-control simulation set at Kansai International Airport. The player directs aircraft through landings, takeoffs, taxiing, and flight-direction changes, turning the airport layout into a timing and routing puzzle. This entry should be described as a real-airport simulation for patient players who enjoy systems pressure, not a reflex platformer or general action game.",
  },
  {
    platformSlug: "3ds",
    gameId: "3ds-boku-wa-koukuu-kanseikan-airport-hero-3d-naha-premium",
    title: "Boku wa Koukuu Kanseikan: Airport Hero 3D Naha Premium",
    sourceUrl: "https://www.play-asia.com/en/boku-wa-koukuu-kanseikan-airport-hero-3d-naha-premium/13/706pjb",
    newOverview:
      "Boku wa Koukuu Kanseikan: Airport Hero 3D Naha Premium is a Japanese 3DS Airport Hero entry from Sonic Powered centered on Naha Airport. Like the rest of the series, it asks players to manage airplane movement through timed instructions rather than piloting the aircraft themselves. GCX should position it as a niche aviation-puzzle simulation where the value comes from airport-specific scenarios, command timing, and its Japan-only physical software profile.",
  },
  {
    platformSlug: "3ds",
    gameId: "3ds-boku-wa-koukuu-kanseikan-airport-hero-3d-narita-all-stars",
    title: "Boku wa Koukuu Kanseikan: Airport Hero 3D Narita All Stars",
    sourceUrl: "https://www.sonicpowered.co.jp/world/euah-rjaa/",
    newOverview:
      "Boku wa Koukuu Kanseikan: Airport Hero 3D Narita All Stars focuses on air-traffic control at Tokyo-Narita, one of Japan's major international airports. Sonic Powered's series turns airport operations into a staged puzzle: assign clear commands, keep aircraft separated, handle taxi and runway flow, and complete each scenario without letting delays or dangerous conflicts build. It is a focused simulation entry for aviation fans and 3DS collectors.",
  },
  {
    platformSlug: "3ds",
    gameId: "3ds-boku-wa-koukuu-kanseikan-airport-hero-3d-shin-chitose-with-jal",
    title: "Boku wa Koukuu Kanseikan: Airport Hero 3D Shin Chitose with JAL",
    sourceUrl: "https://en.wikipedia.org/wiki/Sonic_Powered",
    newOverview:
      "Boku wa Koukuu Kanseikan: Airport Hero 3D Shin Chitose with JAL is another Japan-only Sonic Powered air-traffic-control release, this time built around Hokkaido's Shin Chitose airport and JAL-branded operations. The play pattern is about reading traffic conditions, issuing commands on time, and keeping arrivals and departures safe under scenario pressure. GCX should label it as a specialist airport-management simulation with strong series-collector appeal.",
  },
  {
    platformSlug: "3ds",
    gameId: "3ds-bokura-no-gakkou-sensou-tsuukai-adventure",
    title: "Bokura no Gakkou Sensou: Tsuukai Adventure",
    sourceUrl: "https://www.honestgamers.com/52600/3ds/bokura-no-gakkou-sensou-tsuukai-adventure/game.html",
    newOverview:
      "Bokura no Gakkou Sensou: Tsuukai Adventure is a Japan-only D3 Publisher 3DS title with limited English-language coverage. Available catalog data identifies it as an action release rather than the generic adventure template currently used in the library. GCX should keep the description conservative: a regional 3DS character/action title for collectors of Japanese software, with interest driven more by obscurity and D3's catalog than by broad international recognition.",
  },
  {
    platformSlug: "3ds",
    gameId: "3ds-bokura-no-nanokakan-sensou-yuujou-adventure",
    title: "Bokura no Nanokakan Sensou: Yuujou Adventure",
    sourceUrl: "https://www.crunchyroll.com/news/tag/bokura%20no%20nanokakan%20sensou",
    newOverview:
      "Bokura no Nanokakan Sensou: Yuujou Adventure is a Japan-only 3DS release tied to the Seven Days War youth-adventure property. Because detailed English gameplay coverage is scarce, GCX should avoid overclaiming and describe it as a regional story/adventure title centered on friendship, school-age rebellion, and the broader Bokura no Nanokakan Sensou premise. Its main library value is for Japanese 3DS collectors and fans tracking media-tie-in games.",
  },
  {
    platformSlug: "3ds",
    gameId: "3ds-bomb-monkey",
    title: "Bomb Monkey",
    sourceUrl: "https://www.nintendoworldreport.com/review/30870/bomb-monkey-nintendo-3ds",
    newOverview:
      "Bomb Monkey is Renegade Kid's 3DS eShop action-puzzle game built around dropping blocks and bombs onto a rising playfield. Players move the monkey left and right, set up chains, clear space before the board climbs too high, and experiment across several modes that remix the same central mechanic. Its standout wrinkle is local two-player play on one 3DS held vertically, making it a compact score-chaser with a clever handheld-specific hook.",
  },
];

function currentOverviewFor(gameId) {
  const game = gameById.get(gameId);
  if (!game) throw new Error(`Missing 3DS game record for ${gameId}`);
  return game.description || game.gcxOverview || game.overview || "";
}

function csvCell(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

const header = ["platformSlug", "gameId", "title", "currentOverview", "sourceUrl", "rewriteNotes", "newOverview", "reviewStatus", "reviewer"];
const csv = [
  header.join(","),
  ...rows.map((row) =>
    [
      row.platformSlug,
      row.gameId,
      row.title,
      currentOverviewFor(row.gameId),
      row.sourceUrl,
      "Priority 3DS weak-template replacement with source-backed GCX editorial overview.",
      row.newOverview,
      "approved",
      "GCX Editorial",
    ]
      .map(csvCell)
      .join(",")
  ),
].join("\n");

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${csv}\n`, "utf8");
console.log(JSON.stringify({ outputPath: path.relative(rootDir, outputPath), rowCount: rows.length }, null, 2));

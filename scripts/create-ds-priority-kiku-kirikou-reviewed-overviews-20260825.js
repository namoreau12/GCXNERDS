const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const platformSlug = "ds";
const dataPath = path.join(rootDir, "data", "games", `${platformSlug}.json`);
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ds-priority-kiku-kirikou-reviewed-overviews-2026-08-25.csv"
);

function csvEscape(value) {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

function currentOverviewFor(game) {
  return game.description || game.gcxOverview || game.overview || "";
}

const reviewed = {
  "ds-kiku-kaku-kotoba-o-fuyasu-hajimete-no-eigo-training": {
    sourceUrl: "https://www.play-asia.com/fr/kiku-kaku-kotoba-o-fuyasu-hajimete-no-eigo-training/13/701xlq",
    rewriteNotes: "Source cross-check: Play-Asia/metadata records identify Benesse, Nintendo DS compatibility, Japanese release, and Eigo Training branding.",
    newOverview:
      "Kiku! Kaku! Kotoba o Fuyasu! Hajimete no Eigo Training is a Benesse DS language-training release built around early English practice rather than conventional game progression. The title's listening, writing, and vocabulary framing makes it closer to Nintendo DS study software than a score-chasing puzzle game. For collectors, the useful angle is its Benesse education pedigree and Japan-only import niche inside the DS library."
  },
  "ds-kimi-ni-todoke-sodateru-omoi": {
    sourceUrl: "https://en.wikipedia.org/wiki/Kimi_ni_Todoke",
    rewriteNotes: "Source cross-check: Kimi ni Todoke article identifies Bandai Namco DS game release in Japan on October 16, 2009 and the manga/anime premise around Sawako and Kazehaya.",
    newOverview:
      "Kimi ni Todoke: Sodateru Omoi adapts the gentle school-romance series into a DS character adventure about Sawako Kuronuma slowly building trust and emotional confidence. The appeal is in conversation flow, relationship moments, and seeing the manga's shy, misunderstood heroine through interactive scenes rather than action systems. It is best presented as a fan-focused import tied to the first wave of Kimi ni Todoke's anime-era popularity."
  },
  "ds-kimi-ni-todoke-tsutaeru-kimochi": {
    sourceUrl: "https://en.wikipedia.org/wiki/Kimi_ni_Todoke",
    rewriteNotes: "Source cross-check: Kimi ni Todoke article identifies the second Bandai Namco DS game, Tsutaeru Kimochi, released in Japan on April 7, 2011.",
    newOverview:
      "Kimi ni Todoke: Tsutaeru Kimochi is the second DS game based on the romance series, following Sawako's world after the first adaptation had already established its audience. It keeps the focus on feelings, timing, and character communication, making it more of a visual-novel-style fan piece than a broad adventure game. For GCX, the key distinction is that it is the later companion release, useful to separate from Sodateru Omoi in a complete DS collection."
  },
  "ds-kimokawae": {
    sourceUrl: "https://www.vgchartz.com/game/32614/kimokawae/",
    rewriteNotes: "Source cross-check: database/product records identify Kimokawae! as a 5pb. Nintendo DS adventure released in Japan in 2009.",
    newOverview:
      "Kimokawae! is an obscure Japan-only 5pb. DS adventure release whose collector value comes from its small-profile publisher lane as much as its gameplay. Rather than treating it as a generic visual novel, GCX should flag it as a late-2000s import adventure with limited English-language coverage, where buyers are likely comparing title variants, packaging, and region details. The safest public description is that it is a story-led 5pb. DS title for import specialists."
  },
  "ds-kindaichi-shounen-no-jikenbou-akuma-no-satsujin-koukai": {
    sourceUrl: "https://kotaku.com/games/kindaichi-shounen-no-jikenbo-akuma-no-satsujin-koukai",
    rewriteNotes: "Source cross-check: Kotaku game record and LaunchBox metadata identify Tomcat System/Creative Core, Nintendo DS, September 17, 2009, adventure genre, and Kindaichi Case Files franchise tie.",
    newOverview:
      "Kindaichi Shounen no Jikenbou: Akuma no Satsujin Koukai is a DS mystery adventure tied to The Kindaichi Case Files, built around investigation rather than combat. Players should expect a story-led detective structure where the appeal is following clues, suspects, and case logic from the long-running manga/anime franchise. For collectors, it belongs with Japan-only licensed DS adventures and stands out because Tomcat System handled the game while Creative Core published it."
  },
  "ds-kira-kira-pop-princess": {
    sourceUrl: "https://www.cubed3.com/games/reviews/nintendo-ds/kira-kira-pop-princess",
    rewriteNotes: "Source cross-check: review/product records describe simple rhythm play, buying clothes, dance/fashion framing, and DS touch controls.",
    newOverview:
      "Kira Kira Pop Princess is a DS rhythm-and-fashion game where the loop is simple but specific: play touchscreen rhythm routines, earn progress, and spend it on clothes and style changes. It targets younger players with bright dance presentation rather than deep music-game scoring or complex idol management. In the library, it should be described as a light fashion-rhythm release from Dimple/505 rather than a generic rhythm title."
  },
  "ds-kirarin-revolution-atsumete-change-kurikira-code": {
    sourceUrl: "https://en.wikipedia.org/wiki/Kirarin_Revolution",
    rewriteNotes: "Source cross-check: Kirarin Revolution article identifies multiple Konami DS games during the show's run, with the franchise premise centered on Kirari becoming an idol.",
    newOverview:
      "Kirarin * Revolution: Atsumete Change! Kurikira * Code is one of Konami's DS adaptations of the Kirarin Revolution idol franchise. The game fits the series' fashion-and-performance identity, using Kirari's idol world as the frame for collecting, coordinating, and presentation-focused play rather than traditional platforming or combat. For GCX, it should sit with the other Kirarin DS releases as part of a connected import set from Konami."
  },
  "ds-kirarin-revolution-kira-kira-idol-audition": {
    sourceUrl: "https://www.play-asia.com/en/kirarin-revolution-kira-kira-idol-audition/13/701c6b",
    rewriteNotes: "Source cross-check: Play-Asia describes Kirari Tsukishima's idol quest and Nintendo DS/Konami release context.",
    newOverview:
      "Kirarin * Revolution: Kira Kira Idol Audition turns the manga/anime premise into a DS idol-training adventure about Kirari Tsukishima trying to become the ultimate idol. The draw is character appeal, auditions, music-show energy, and light performance progression, not a deep simulation. Because it is the early DS Kirarin title, it is a natural anchor for collectors trying to understand the Konami run."
  },
  "ds-kirarin-revolution-mezase-idol-queen": {
    sourceUrl: "https://www.nintendoworldreport.com/game/13428/kirarin--revolution-mezase-idol-queen-nintendo-ds",
    rewriteNotes: "Source cross-check: Nintendo World Report lists July 12, 2007 Japan release, Konami publishing, all-ages rating; Kirarin article frames the idol premise.",
    newOverview:
      "Kirarin * Revolution: Mezase! Idol Queen continues Konami's DS idol-game treatment of Kirari's rise through the entertainment world. It is best understood as a character-driven idol adventure where jobs, outfits, and presentation choices matter because they express the series' idol-queen fantasy. For collectors, it is a 2007 Japan-only Konami entry that helps bridge Kira Kira Idol Audition and the later Stage 3-era games."
  },
  "ds-kirarin-revolution-minna-de-odorou-furi-furi-debut": {
    sourceUrl: "https://backloggd.com/games/kirarin-revolution-minna-de-odorou-furi-furi-debut/",
    rewriteNotes: "Source cross-check: Backloggd/product records identify Konami development/publishing, Nintendo DS, July 24, 2008 Japan release, and fifth Kirarin Revolution game.",
    newOverview:
      "Kirarin * Revolution: Minna de Odorou Furi Furi Debut! shifts the DS idol formula toward dance and performance, matching the franchise's music-show energy. As a later Konami Kirarin release, it matters because it arrived after the series had built several DS entries and was leaning into rhythm, movement, and idol presentation. GCX should describe it as a dance-focused Kirarin import rather than merging it with the earlier audition games."
  },
  "ds-kirarin-revolution-naasan-to-issho": {
    sourceUrl: "https://en.wikipedia.org/wiki/List_of_Nintendo_DS_games_(J%E2%80%93P)",
    rewriteNotes: "Source cross-check: Nintendo DS J-P list records Konami as developer/publisher and Japan-only DS release; Kirarin franchise source identifies Na-san as a key mascot character.",
    newOverview:
      "Kirarin * Revolution: Naasan to Issho is a Konami DS spin on the Kirarin Revolution line that puts Na-san, Kirari's cat mascot, closer to the center of the experience. That makes it a useful contrast with the audition and dance entries, which focus more directly on Kirari's idol career. For collectors, the hook is franchise specificity: this is the Na-san-focused DS title inside Konami's six-game Kirarin run."
  },
  "ds-kirarin-revolution-tsukutte-misechao-kime-kira-stage": {
    sourceUrl: "https://en.wikipedia.org/wiki/List_of_Nintendo_DS_games_(J%E2%80%93P)",
    rewriteNotes: "Source cross-check: Nintendo DS J-P list records Konami development/publishing and Japan DS release; Kirarin franchise source frames the idol performance setting.",
    newOverview:
      "Kirarin * Revolution: Tsukutte Misechao! Kime * Kira Stage leans into the stage-making and presentation side of the Kirarin Revolution DS catalog. Rather than simply repeating the audition premise, it points players toward creating or arranging a performance space around Kirari's idol identity. In GCX, it should be grouped with the Konami Kirarin games but described as the stage-creation themed entry."
  },
  "ds-kirei-zukin-seikatsu": {
    sourceUrl: "https://gamegear.net/archive/games/nds/kirei-zukin-seikatsu-japan",
    rewriteNotes: "Source cross-check: archive/product records identify a San-X character DS game about tidying, cleaning, and finding instruments through touchscreen minigames.",
    newOverview:
      "Kirei Zukin Seikatsu is a San-X character DS game built around gentle cleaning and tidying minigames rather than the rhythm-game template previously attached to it. The premise centers on helping the hooded character tidy spaces and gather instruments for an orchestra-style performance, giving it a cozy children's minigame identity. For collectors, it belongs with Japan-only character software and San-X mascot releases."
  },
  "ds-kirei-zukin-seikatsu-2": {
    sourceUrl: "https://www.play-asia.com/en/kirei-zukin-seikatsu-2/13/7045si",
    rewriteNotes: "Source cross-check: Play-Asia identifies Kirei Zukin Seikatsu 2 as a Simulation game by Infinity and Columbia Music Entertainment, released in Japan in 2011; Kotaku summary describes touchscreen tidying minigames.",
    newOverview:
      "Kirei Zukin Seikatsu 2 continues the San-X tidying-minigame idea on DS, with Infinity developing and Columbia Music Entertainment publishing the Japan-only sequel. The game is about touchscreen chores, cleaning, and cute character routines rather than music timing or action challenge. GCX should distinguish it from the first entry as the 2011 sequel for collectors tracking San-X DS software."
  },
  "ds-kirikou-and-the-wild-beasts": {
    sourceUrl: "https://gamesdb.launchbox-app.com/games/details/102052-kirikou-and-the-wild-beasts",
    rewriteNotes: "Source cross-check: LaunchBox/simple wiki records describe a DS platform game inspired by the Michel Ocelot film, aimed at younger players and centered on Kirikou facing dangers around his village.",
    newOverview:
      "Kirikou and the Wild Beasts is a DS platform game adapted from Michel Ocelot's animated film, aimed at younger players and built around Kirikou protecting his village from danger. The appeal is simple licensed-platforming structure, recognizable film material, and child-friendly pacing rather than complex combat. For GCX, it should be treated as a European licensed children's game, not a generic adventure entry."
  }
};

function main() {
  const games = JSON.parse(fs.readFileSync(dataPath, "utf8"));
  const rows = Object.entries(reviewed).map(([gameId, review]) => {
    const game = games.find((item) => item.id === gameId);
    if (!game) throw new Error(`Missing game ${gameId}`);
    return {
      platformSlug,
      gameId,
      title: game.title || game.name || "",
      currentOverview: currentOverviewFor(game),
      sourceUrl: review.sourceUrl,
      rewriteNotes: review.rewriteNotes,
      newOverview: review.newOverview,
      reviewStatus: "reviewed",
      reviewer: "GCX Editorial"
    };
  });

  const headers = [
    "platformSlug",
    "gameId",
    "title",
    "currentOverview",
    "sourceUrl",
    "rewriteNotes",
    "newOverview",
    "reviewStatus",
    "reviewer"
  ];

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(
    outputPath,
    `${headers.join(",")}\n${rows.map((row) => headers.map((header) => csvEscape(row[header])).join(",")).join("\n")}\n`,
    "utf8"
  );

  console.log(JSON.stringify({ outputPath, rowCount: rows.length }, null, 2));
}

main();

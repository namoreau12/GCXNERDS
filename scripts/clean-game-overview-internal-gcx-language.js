const fs = require("node:fs");
const path = require("node:path");
const { isGameDatasetFile, writeJsonAtomic } = require("./game-dataset-utils");

const rootDir = path.join(__dirname, "..");
const gamesDir = path.join(rootDir, "data", "games");
const outputPath = path.join(rootDir, "data", "launch-readiness", "game-overview-internal-language-cleanup.json");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildGameSearchText(game, overview) {
  return normalizeText(
    [
      game.title,
      game.name,
      game.developer,
      game.publisher,
      ...(Array.isArray(game.developers) ? game.developers : []),
      ...(Array.isArray(game.publishers) ? game.publishers : []),
      game.firstReleased,
      ...(Array.isArray(game.releasedRegions) ? game.releasedRegions : []),
      ...(Array.isArray(game.releaseYears) ? game.releaseYears : []),
      game.platform,
      ...(Array.isArray(game.platforms) ? game.platforms : []),
      ...(Array.isArray(game.tags) ? game.tags : []),
      overview,
    ]
      .filter(Boolean)
      .join(" ")
  );
}

function cleanSentence(sentence) {
  let next = sentence;
  const replacements = [
    {
      pattern: /\b(?:so\s+)?GCX should (?:frame|present|describe|label|identify|position|flag|treat|mark|classify) it as\s+/i,
      replacement: "It is ",
    },
    {
      pattern: /\b(?:so\s+)?GCX should explain it as\s+/i,
      replacement: "It is ",
    },
    {
      pattern: /\b(?:so\s+)?GCX should catalog it as\s+/i,
      replacement: "It is ",
    },
    {
      pattern: /\b(?:so\s+)?GCX should describe it conservatively as\s+/i,
      replacement: "It is conservatively described as ",
    },
    {
      pattern: /\b(?:so\s+)?GCX should avoid overclaiming and describe it as\s+/i,
      replacement: "It is best described as ",
    },
    {
      pattern: /\b(?:so\s+)?GCX should distinguish it as\s+/i,
      replacement: "It is best distinguished as ",
    },
    {
      pattern: /\b(?:so\s+)?GCX should classify it with\s+/i,
      replacement: "It belongs with ",
    },
    {
      pattern: /\b(?:so\s+)?GCX should group it with\s+/i,
      replacement: "It belongs with ",
    },
    {
      pattern: /\b(?:so\s+)?GCX should separate it from\s+/i,
      replacement: "It should be separated from ",
    },
    {
      pattern: /\b(?:so\s+)?GCX should connect it to\s+/i,
      replacement: "It connects to ",
    },
    {
      pattern: /\b(?:so\s+)?GCX should call it\s+/i,
      replacement: "It is ",
    },
    {
      pattern: /\b(?:so\s+)?GCX should note that\s+/i,
      replacement: "Notably, ",
    },
    {
      pattern: /\b(?:so\s+)?GCX should note\s+/i,
      replacement: "Notably, ",
    },
    {
      pattern: /\b(?:so\s+)?GCX should make clear that\s+/i,
      replacement: "",
    },
    {
      pattern: /\b(?:so\s+)?GCX should not overstate the premise:\s*/i,
      replacement: "The reliable premise is modest: ",
    },
    {
      pattern: /\b(?:so\s+)?GCX should keep the (?:description|overview) conservative:\s*/i,
      replacement: "The reliable description is conservative: ",
    },
    {
      pattern: /\b(?:so\s+)?GCX should keep this record because\s+/i,
      replacement: "This record matters because ",
    },
    {
      pattern: /\b(?:so\s+)?GCX should clearly identify it as\s+/i,
      replacement: "It is clearly ",
    },
    {
      pattern: /\b(?:so\s+)?GCX should clearly distinguish\s+/i,
      replacement: "Collectors should clearly distinguish ",
    },
    {
      pattern: /\b(?:so\s+)?GCX should emphasize that\s+/i,
      replacement: "The key point is that ",
    },
    {
      pattern: /\b(?:so\s+)?GCX should emphasize\s+/i,
      replacement: "The key point is ",
    },
    {
      pattern: /\b(?:so\s+)?GCX should highlight that\s+/i,
      replacement: "The key point is that ",
    },
    {
      pattern: /\b(?:so\s+)?GCX should highlight\s+/i,
      replacement: "The key point is ",
    },
  ];

  for (const { pattern, replacement } of replacements) {
    next = next.replace(pattern, replacement);
  }

  return next
    .replace(/\bGCX's\b/g, "the site's")
    .replace(/,\s+(It is|It belongs|It should|It connects|It is best|Notably,|The key point|Collectors should)/g, ". $1")
    .replace(/\s+/g, " ")
    .replace(/\s+([.,;:!?])/g, "$1")
    .trim();
}

function polishCleanupArtifacts(value) {
  const conjugateMetaVerb = (verb) => {
    const lower = String(verb || "").toLowerCase();
    const irregular = {
      be: "is",
      classify: "classifies",
      stay: "stays",
      do: "does",
      go: "goes",
    };
    if (irregular[lower]) return irregular[lower];
    if (lower.endsWith("y") && !/[aeiou]y$/.test(lower)) return `${lower.slice(0, -1)}ies`;
    if (/(s|x|z|ch|sh)$/.test(lower)) return `${lower}es`;
    return `${lower}s`;
  };

  return String(value || "")
    .replace(/\bcurrently works best on GCX as\b/gi, "currently works best as")
    .replace(/\bworks best on GCX as\b/gi, "works best as")
    .replace(/\buseful on GCX because\b/gi, "useful for collectors because")
    .replace(/\buseful on GCX as\b/gi, "useful as")
    .replace(/\b(?:on|within|inside|in) GCX,?\s+it should be understood as\b/gi, "It is best understood as")
    .replace(/\b(?:on|within|inside|in) GCX,?\s+it should be treated as\b/gi, "It is best treated as")
    .replace(/\b(?:on|within|inside|in) GCX,?\s+it should be described as\b/gi, "It is best described as")
    .replace(/\b(?:on|within|inside|in) GCX,?\s+it should sit\b/gi, "It sits")
    .replace(/\b(?:on|within|inside|in) GCX,?\s+each volume should be identified\b/gi, "Each volume should be identified")
    .replace(/\b(?:on|within|inside|in) GCX,?\s+/gi, "")
    .replace(/\bFor GCX readers,?\s+/gi, "For collectors, ")
    .replace(/\bFor GCX viewers,?\s+/gi, "For collectors, ")
    .replace(/\bFor GCX library users,?\s+/gi, "For collectors, ")
    .replace(/\bFor GCX users,?\s+/gi, "For collectors, ")
    .replace(/\bFor GCX browsing,?\s+/gi, "When browsing, ")
    .replace(/\bFor GCX,?\s+it matters because\b/gi, "It matters because")
    .replace(/\bFor GCX,?\s+the key point is\b/gi, "The key point is")
    .replace(/\bFor GCX,?\s+the key value is\b/gi, "The key value is")
    .replace(/\bFor GCX,?\s+the useful distinction is\b/gi, "The useful distinction is")
    .replace(/\bFor GCX,?\s+the useful collector context is\b/gi, "The useful collector context is")
    .replace(/\bFor GCX,?\s+the clearest positioning is\b/gi, "The clearest positioning is")
    .replace(/\bfor GCX:\s*/gi, ": ")
    .replace(/\bFor GCX,?\s+/gi, "")
    .replace(/\bIt is especially relevant to GCX because\b/gi, "It is especially relevant because")
    .replace(/\bIt is useful for GCX because\b/gi, "It is useful because")
    .replace(/\bdirect crossover value for GCX's video-game and trading-card audience\b/gi, "direct crossover value for collectors interested in video games and trading cards")
    .replace(/\bIts main GCX value is\b/gi, "Its main collector value is")
    .replace(/\bfor GCX's library\b/gi, "for the library")
    .replace(/\bGCX's library\b/gi, "the library")
    .replace(/\bGCX's audience\b/gi, "collectors")
    .replace(/\bGCX's video-game and trading-card audience\b/gi, "collectors interested in video games and trading cards")
    .replace(/\bits value in the GCX (?:index|library|catalog|catalogue) is\b/gi, "its value is")
    .replace(/\bIts value in the GCX (?:index|library|catalog|catalogue) is\b/g, "Its value is")
    .replace(/\bmost useful in the GCX (?:index|library|catalog|catalogue) as\b/gi, "most useful as")
    .replace(/\bthe useful GCX (context|framing|angle)\b/gi, "the useful $1")
    .replace(/\bthe clean GCX value\b/gi, "the clean collector value")
    .replace(/\bthe best GCX description\b/gi, "the best description")
    .replace(/\bthe safest GCX framing\b/gi, "the safest framing")
    .replace(/\bthe safest useful GCX framing\b/gi, "the safest useful framing")
    .replace(/\bGCX value\b/gi, "collector value")
    .replace(/\bGCX listings\b/gi, "listings")
    .replace(/\bGCX listing\b/gi, "listing")
    .replace(/\bGCX index\b/gi, "index")
    .replace(/\bGCX library\b/gi, "library")
    .replace(/\bGCX catalog\b/gi, "catalog")
    .replace(/\bGCX catalogue\b/gi, "catalogue")
    .replace(/\bold GCX (?:blurb|copy|template|text|metadata)\b/gi, "old metadata")
    .replace(/\bold generic GCX (?:blurb|copy|template|text|metadata)\b/gi, "old generic metadata")
    .replace(/\bcurrent GCX (?:blurb|copy|template|text|metadata)\b/gi, "current metadata")
    .replace(/\bexisting GCX (?:blurb|copy|template|text|metadata)\b/gi, "existing metadata")
    .replace(/\bIt matters to GCX users because\b/gi, "It matters because")
    .replace(/\bIt matters to GCX because\b/gi, "It matters because")
    .replace(/\bIt should matter to GCX users because\b/gi, "It matters because")
    .replace(/\bIt is highly relevant to GCX because\b/gi, "It is highly relevant because")
    .replace(/\bfits GCX as\b/gi, "fits as")
    .replace(/\ba natural GCX fit\b/gi, "a natural fit")
    .replace(/\bGCX can present it as\b/gi, "It works as")
    .replace(/\bIt helps GCX represent\b/gi, "It helps the catalog represent")
    .replace(/\bFor most GCX users,?\s+/gi, "For most collectors, ")
    .replace(/\bFor players browsing GCX,?\s+/gi, "For players browsing the library, ")
    .replace(/\bIts useful GCX (context|framing|angle)\b/gi, "Its useful $1")
    .replace(/\bstronger GCX treatment\b/gi, "stronger collector treatment")
    .replace(/\bshort GCX title\b/gi, "short database title")
    .replace(/\bThe Switch release matters to GCX because\b/gi, "The Switch release matters because")
    .replace(/\bGCX(?:'s|’s)?\b/g, "the catalog")
    .replace(/\bgcx(?:'s|’s)?\b/g, "the catalog")
    .replace(/\bto GCX readers\b/gi, "to readers")
    .replace(/\bGCX readers\b/gi, "readers")
    .replace(/\bGCX viewers\b/gi, "viewers")
    .replace(/\bGCX visitors\b/gi, "visitors")
    .replace(/\bGCX collectors\b/gi, "collectors")
    .replace(/\bIts GCX entry should make\b/gi, "Its entry makes")
    .replace(/\bIts GCX listing should make\b/gi, "Its listing makes")
    .replace(/\bThe best current GCX overview is\b/gi, "The best current overview is")
    .replace(/\ba worthwhile GCX entry\b/gi, "a worthwhile database entry")
    .replace(/\ba useful GCX entry\b/gi, "a useful database entry")
    .replace(/\bthe GCX database\b/gi, "the database")
    .replace(/\bin the GCX database\b/gi, "in the database")
    .replace(/\bfor the GCX database\b/gi, "for the database")
    .replace(/\bin GCX\b/gi, "in the database")
    .replace(/\bGCX's (entry|listing|record|page|overview|database)\b/gi, "the site's $1")
    .replace(/\bGCX’s (entry|listing|record|page|overview|database)\b/gi, "the site's $1")
    .replace(/\bGCX's\b/g, "the site's")
    .replace(/,\s+(It is|It belongs|It should|It connects|It is best|Notably,|The key point|Collectors should)\b/g, ". $1")
    .replace(/,\s+The reliable description is conservative:/g, ". The reliable description is conservative:")
    .replace(/,\s+The reliable premise is modest:/g, ". The reliable premise is modest:")
    .replace(/The reliable premise is modest:\s+the reliable collector facts are that/gi, "The reliable collector facts are that")
    .replace(/Public English-language detail is limited,\s+The reliable description is conservative:/gi, "Public English-language detail is limited, so the reliable description is conservative:")
    .replace(/With limited English-language coverage\.\s+It is conservatively described as/gi, "With limited English-language coverage, it is conservatively described as")
    .replace(/Because detailed English gameplay coverage is scarce\.\s+It is best described as/gi, "Because detailed English gameplay coverage is scarce, it is best described as")
    .replace(/Because source detail is thin[,.]\s+It is best presented conservatively as ([^.]+?) and avoid implying/gi, "Because source detail is thin, it is best presented conservatively as $1, without implying")
    .replace(/This record matters because ([^.]+?) but label it clearly as/gi, "This record matters because $1 but it is best labeled clearly as")
    .replace(/It belongs with ([^.]+?) and note the/gi, "It belongs with $1, with")
    .replace(/It connects to ([^.]+?) and note that/gi, "It connects to $1; notably,")
    .replace(/It connects directly to ([^.]+?) and note that/gi, "It connects directly to $1; notably,")
    .replace(/It is ([^.]+?) and note that/gi, "It is $1; notably,")
    .replace(/The useful context is that ([^.]+?) and note that/gi, "The useful context is that $1, with")
    .replace(/It belongs in ([^.]+?), not treat it as/gi, "It belongs in $1 and should not be treated as")
    .replace(/It is a niche narrative import and avoid implying/gi, "It is a niche narrative import, without implying")
    .replace(/It should be clearly separated from ([^.]+?) and avoid sports-game framing/gi, "It should be clearly separated from $1 rather than framed as a sports game")
    .replace(/Notably,\s+the New 3DS-only compatibility and describe it as/gi, "Notably, this is New 3DS-only and works as")
    .replace(/Notably,\s+([^.;]+?) and describe it as/gi, "Notably, $1 and it is best described as")
    .replace(/Collectors should clearly distinguish ([^.]+?) and explain that its value comes from/gi, "Collectors should clearly distinguish $1; its value comes from")
    .replace(/,\s+so\s+(It|The listing|The record|Collectors)\b/g, ". $1")
    .replace(/,\s+(It|The listing|The record|Collectors)\b/g, ". $1")
    .replace(/\bGCX should (?:frame|present|describe|label|identify|position|flag|treat|mark|classify) it as\s+/gi, "It is ")
    .replace(/\bGCX should explain it as\s+/gi, "It is ")
    .replace(/\bGCX should catalog it as\s+/gi, "It is ")
    .replace(/\bGCX should describe it conservatively as\s+/gi, "It is conservatively described as ")
    .replace(/\bGCX should avoid overclaiming and describe it as\s+/gi, "It is best described as ")
    .replace(/\bGCX should distinguish it as\s+/gi, "It is best distinguished as ")
    .replace(/\bGCX should classify it with\s+/gi, "It belongs with ")
    .replace(/\bGCX should group it with\s+/gi, "It belongs with ")
    .replace(/\bGCX should separate it from\s+/gi, "It should be separated from ")
    .replace(/\bGCX should connect it to\s+/gi, "It connects to ")
    .replace(/\bGCX should call it\s+/gi, "It is ")
    .replace(/\bGCX should note that\s+/gi, "Notably, ")
    .replace(/\bGCX should note\s+/gi, "Notably, ")
    .replace(/\bGCX should make clear that\s+/gi, "")
    .replace(/\bGCX should not overstate the premise:\s*/gi, "The reliable premise is modest: ")
    .replace(/\bGCX should keep the (?:description|overview) conservative:\s*/gi, "The reliable description is conservative: ")
    .replace(/\bGCX should keep this record because\s+/gi, "This record matters because ")
    .replace(/\bGCX should clearly identify it as\s+/gi, "It is clearly ")
    .replace(/\bGCX should clearly distinguish\s+/gi, "Collectors should clearly distinguish ")
    .replace(/\bGCX should emphasize that\s+/gi, "The key point is that ")
    .replace(/\bGCX should emphasize\s+/gi, "The key point is ")
    .replace(/\bGCX should highlight that\s+/gi, "The key point is that ")
    .replace(/\bGCX should highlight\s+/gi, "The key point is ")
    .replace(/\bGCX should present it conservatively as\s+/gi, "It is best presented conservatively as ")
    .replace(/\bGCX should present it carefully:\s*/gi, "It is best presented carefully: ")
    .replace(/\bGCX should present ([^.;]+?) as\s+/gi, "$1 is best presented as ")
    .replace(/\bGCX should frame this version as\s+/gi, "This version is best framed as ")
    .replace(/\bGCX should frame it cautiously as\s+/gi, "It is best framed cautiously as ")
    .replace(/\bGCX should frame it around\s+/gi, "It is best framed around ")
    .replace(/\bGCX should frame it through\s+/gi, "It is best framed through ")
    .replace(/\bGCX should frame it carefully:\s*/gi, "It is best framed carefully: ")
    .replace(/\bGCX should frame it as\s+/gi, "It is best framed as ")
    .replace(/\bGCX should file it with\s+/gi, "It belongs with ")
    .replace(/\bGCX should file it as\s+/gi, "It is best filed as ")
    .replace(/\bGCX should list it as\s+/gi, "It is best listed as ")
    .replace(/\bGCX should place it with\s+/gi, "It belongs with ")
    .replace(/\bGCX should position it near\s+/gi, "It sits near ")
    .replace(/\bGCX should position it around\s+/gi, "It is best understood around ")
    .replace(/\bGCX should position it for\s+/gi, "It is positioned for ")
    .replace(/\bGCX should pitch it as\s+/gi, "It works as ")
    .replace(/\bGCX should categorize it as\s+/gi, "It is best categorized as ")
    .replace(/\bGCX should label this as\s+/gi, "This is best labeled as ")
    .replace(/\bGCX should label it clearly as\s+/gi, "It is best labeled clearly as ")
    .replace(/\bGCX should call this\s+/gi, "This is ")
    .replace(/\bGCX should call out\s+/gi, "Collectors should note ")
    .replace(/\bGCX should make that ([^.]+?) clear/gi, "That $1 is the key distinction")
    .replace(/\bGCX should make the ([^.]+?) clear/gi, "The $1 should be clear")
    .replace(/\bGCX should make ([^.]+?) easy to compare/gi, "$1 are important comparison points")
    .replace(/\bGCX should make ([^.]+?) visible/gi, "$1 is an important visible distinction")
    .replace(/\bGCX should make ([^.]+?) obvious/gi, "$1 is the key reader-facing distinction")
    .replace(/\bGCX should explain that\s+/gi, "The useful context is that ")
    .replace(/\bGCX should explain\s+/gi, "The useful context is ")
    .replace(/\bGCX should identify it plainly as\s+/gi, "It is plainly ")
    .replace(/\bGCX should identify it clearly as\s+/gi, "It is clearly ")
    .replace(/\bGCX should identify it alongside\s+/gi, "It belongs alongside ")
    .replace(/\bGCX should distinguish this later ([^.]+?) from\s+/gi, "Collectors should distinguish this later $1 from ")
    .replace(/\bGCX should distinguish it from\s+/gi, "Collectors should distinguish it from ")
    .replace(/\bGCX should keep ([^.]+?) clearly separated from\s+/gi, "$1 should stay clearly separated from ")
    .replace(/\bGCX should clearly separate it from\s+/gi, "It should be clearly separated from ")
    .replace(/\bGCX should connect it directly to\s+/gi, "It connects directly to ")
    .replace(/\bGCX should foreground\s+/gi, "The overview foregrounds ")
    .replace(/\bGCX should focus on\s+/gi, "The focus is ")
    .replace(/\bGCX should surface it as\s+/gi, "It stands out as ")
    .replace(/\bGCX should surface\s+/gi, "The listing should surface ")
    .replace(/\bGCX should replace the old ([^.]+?) with\s+/gi, "The old $1 is better replaced with ")
    .replace(/\bGCX should correct the current ([^.]+?)\./gi, "The current $1 needs correction.")
    .replace(/\bGCX should correct the generic ([^.]+?) and present it as\s+/gi, "The generic $1 is better replaced by ")
    .replace(/\bGCX should avoid inventing mechanics and keep the record conservative:/gi, "The record is best kept conservative:")
    .replace(/\bGCX should avoid invented ([^.]+?) and emphasize\s+/gi, "Instead of invented $1, the verified identity is ")
    .replace(/\bGCX should avoid overselling it and instead make\s+/gi, "The listing should keep ")
    .replace(/\bGCX should avoid overexplaining it\./gi, "The listing should stay concise.")
    .replace(/\bGCX should avoid pretending ([^.]+?)\./gi, "The listing should avoid pretending $1.")
    .replace(/\bGCX should not describe it as\s+/gi, "It should not be described as ")
    .replace(/\bGCX should use it to help collectors distinguish\s+/gi, "It helps collectors distinguish ")
    .replace(/\bGCX should set expectations around\s+/gi, "Expectations should center on ")
    .replace(/\bGCX should be plain about its scope:/gi, "The scope is plain:")
    .replace(/\bGCX should be conservative here:/gi, "The conservative read is:")
    .replace(/\bGCX should keep the description grounded:/gi, "The grounded description is:")
    .replace(/\bGCX should keep the description grounded in\s+/gi, "The description is grounded in ")
    .replace(/\bGCX should keep the description modest but specific:/gi, "The modest but specific description is:")
    .replace(/\bGCX should keep the overview grounded in\s+/gi, "The overview is grounded in ")
    .replace(/\bGCX should keep the overview honest:/gi, "The honest overview is:")
    .replace(/\bGCX should keep the focus on\s+/gi, "The focus should stay on ")
    .replace(/\bGCX should keep it with\s+/gi, "It belongs with ")
    .replace(/\bGCX should keep it in\s+/gi, "It belongs in ")
    .replace(/\bGCX should keep ([^.]+?) distinct from\s+/gi, "$1 should stay distinct from ")
    .replace(/\bGCX should treat ([^.]+?) as\s+/gi, "$1 is best treated as ")
    .replace(/\bGCX should\b/gi, "The listing should")
    .replace(/\b(The listing|The overview|The record|This overview) should ([a-z]+)\b/gi, (match, subject, verb) => `${subject} ${conjugateMetaVerb(verb)}`)
    .replace(/\bIts value For collectors, is as\b/g, "Its value for collectors is as")
    .replace(/\bIts value For collectors, is\b/g, "Its value for collectors is")
    .replace(/\bIts appeal For collectors, is\b/g, "Its appeal for collectors is")
    .replace(/\bIt is ([^.]+?)\. it should be separated from\b/g, "It is $1. It should be separated from")
    .replace(/\bIt is ([^.]+?)\. it should be treated as\b/g, "It is $1. It should be treated as")
    .replace(/\bIt is ([^.]+?)\. it should be described as\b/g, "It is $1. It should be described as")
    .replace(/(^|[.!?]\s+)it should\b/g, (match, prefix) => `${prefix}It should`)
    .replace(/(^|[.!?]\s+)in the database\b/g, (match, prefix) => `${prefix}In the database`)
    .replace(/\bIn the database terms\b/g, "In database terms")
    .replace(/\bThe overview calls out its ([^.]+?) so users understand why it ([^.]+?)\./gi, "Its $1 helps explain why it $2.")
    .replace(/\bThe overview calls out its ([^.]+?)\./gi, "Its $1 stands out.")
    .replace(/\bThe overview calls out the ([^.]+?) because ([^.]+?)\./gi, "The $1 matters because $2.")
    .replace(/\bThe overview calls out the ([^.]+?)\./gi, "The $1 stands out.")
    .replace(/\bThe overview highlights its ([^.]+?)\./gi, "Its $1 stands out.")
    .replace(/\bThe overview highlights the ([^.]+?)\./gi, "The $1 stands out.")
    .replace(/\bThe overview flags it as ([^.]+?)\./gi, "It is $1.")
    .replace(/\bThe overview flags the ([^.]+?) because ([^.]+?)\./gi, "The $1 matters because $2.")
    .replace(/\bThe overview flags the ([^.]+?)\./gi, "The $1 stands out.")
    .replace(/\bThe page should still be revisited when stronger editorial sources are available, but this profile gives collectors a cleaner, title-specific starting point than an empty or duplicated overview\./gi, "This profile gives collectors a title-specific starting point while deeper editorial sourcing is still being built.")
    .replace(/\bThis page should still be revisited when stronger editorial sources are available, but this profile gives collectors a cleaner, title-specific starting point than an empty or duplicated overview\./gi, "This profile gives collectors a title-specific starting point while deeper editorial sourcing is still being built.")
    .replace(/\bThe page should make clear that users are looking at ([^.]+?)\./gi, "This is $1.")
    .replace(/\bThe page should label it as ([^.]+?)\./gi, "It is best labeled as $1.")
    .replace(/\bThe page should label ([^.]+?) as ([^.]+?)\./gi, "$1 is best labeled as $2.")
    .replace(/\bThe page should ([^.]+?)\./gi, "$1.")
    .replace(/\bThis page should ([^.]+?)\./gi, "$1.")
    .replace(/\bThe overview is grounded in ([^.]+?), making clear that ([^.]+?)\./gi, "The $1 makes clear that $2.")
    .replace(/\bthe overview stays focused on ([^.]+?) rather than ([^.]+?)\./gi, "the safest framing stays focused on $1 rather than $2.")
    .replace(/\bThe overview stays collector-focused:\s*/gi, "The collector-focused read is: ")
    .replace(/\bThe overview is treated cautiously, emphasizing ([^.]+?) rather than ([^.]+?)\./gi, "The safest framing emphasizes $1 rather than $2.")
    .replace(/\bThe overview frames it through ([^.]+?) rather than ([^.]+?)\./gi, "It is best understood through $1 rather than $2.")
    .replace(/\bThe overview frames it through ([^.]+?)\./gi, "It is best understood through $1.")
    .replace(/\bThe overview frames it around ([^.]+?) rather than ([^.]+?)\./gi, "It is best framed around $1 rather than $2.")
    .replace(/\bThe overview frames it around ([^.]+?)\./gi, "It is best framed around $1.")
    .replace(/\bThe overview frames it cautiously as ([^.]+?)\./gi, "It is best framed cautiously as $1.")
    .replace(/\bThe overview frames it carefully: /gi, "It is best framed carefully: ")
    .replace(/\bThe overview frames it as ([^.]+?)\./gi, "It is best framed as $1.")
    .replace(/\bThe overview frames this version as ([^.]+?)\./gi, "This version is best framed as $1.")
    .replace(/\bThe overview frames this as ([^.]+?)\./gi, "This is best framed as $1.")
    .replace(/\bThe overview frames the ([^.]+?) as ([^.]+?)\./gi, "The $1 is best framed as $2.")
    .replace(/\bThe overview presents it cautiously as ([^.]+?)\./gi, "It is best presented cautiously as $1.")
    .replace(/\bThe overview presents it cautiously, emphasizing ([^.]+?)\./gi, "It is best presented cautiously, with $1 emphasized.")
    .replace(/\bThe overview presents it carefully: /gi, "It is best presented carefully: ")
    .replace(/\bThe overview presents it conservatively as ([^.]+?)\./gi, "It is best presented conservatively as $1.")
    .replace(/\bThe overview presents it as ([^.]+?)\./gi, "It is best presented as $1.")
    .replace(/\bThe overview presents this version as ([^.]+?)\./gi, "This version is best presented as $1.")
    .replace(/\bThe overview presents ([A-Z][A-Za-z0-9'&: -]+?) as ([^.]+?)\./g, "$1 is best presented as $2.")
    .replace(/\bThe overview positions it around ([^.]+?)\./gi, "It is best understood around $1.")
    .replace(/\bThe overview positions it near ([^.]+?)\./gi, "It sits near $1.")
    .replace(/\bThe overview positions it for ([^.]+?)\./gi, "It is positioned for $1.")
    .replace(/\bThe overview calls it out as ([^.]+?)\./gi, "It stands out as $1.")
    .replace(/\bThe overview calls it a ([^.]+?)\./gi, "It is a $1.")
    .replace(/\bThe overview calls it an ([^.]+?)\./gi, "It is an $1.")
    .replace(/\bThe overview calls it ([^.]+?), not ([^.]+?)\./gi, "It is $1, not $2.")
    .replace(/\bThe overview calls this a ([^.]+?)\./gi, "This is a $1.")
    .replace(/\bThe overview calls this an ([^.]+?)\./gi, "This is an $1.")
    .replace(/\bThe overview highlights it as ([^.]+?)\./gi, "It stands out as $1.")
    .replace(/\bThe overview highlights it for ([^.]+?) because ([^.]+?)\./gi, "It matters for $1 because $2.")
    .replace(/\bThe overview highlights that ([^.]+?) clearly: /gi, "That $1 is important: ")
    .replace(/\bThe overview highlights ([A-Z][A-Za-z0-9'&: -]+?) as ([^.]+?) because ([^.]+?)\./g, "$1 stands out as $2 because $3.")
    .replace(/\bThe overview highlights ([^.]+?)\./gi, "$1 stands out.")
    .replace(/\bThe overview makes that ([^.]+?) clear/gi, "That $1 is clear")
    .replace(/\bThe overview makes that ([^.]+?) visible/gi, "That $1 is visible")
    .replace(/\bThe overview makes that identity obvious\./gi, "That identity is clear.")
    .replace(/\bThe overview makes clear this is ([^.]+?)\./gi, "This is clearly $1.")
    .replace(/\bThe overview makes clear that ([^.]+?)\./gi, "$1.")
    .replace(/\bThe overview makes that clear so ([^.]+?)\./gi, "That distinction helps $1.")
    .replace(/\bThe overview describes it through ([^.]+?)\./gi, "It is best understood through $1.")
    .replace(/\bThe overview describes ([^.]+?)\./gi, "It describes $1.")
    .replace(/\bThe overview frames it as ([^.]+?)\./gi, "It is best framed as $1.")
    .replace(/\bThe overview presents it as ([^.]+?)\./gi, "It is best presented as $1.")
    .replace(/\bThe overview positions it as ([^.]+?)\./gi, "It is best positioned as $1.")
    .replace(/\bThe overview treats it as ([^.]+?)\./gi, "It works best as $1.")
    .replace(/\bThe overview keeps ([^.]+?)\./gi, "$1.")
    .replace(/\bThe overview makes clear that ([^.]+?)\./gi, "$1.")
    .replace(/\bThe overview identifies it as ([^.]+?)\./gi, "It is $1.")
    .replace(/\bThe overview identifies it clearly as ([^.]+?)\./gi, "It is clearly $1.")
    .replace(/\bThe overview identifies it plainly as ([^.]+?)\./gi, "It is plainly $1.")
    .replace(/\bThe overview identifies it alongside ([^.]+?)\./gi, "It belongs alongside $1.")
    .replace(/\bThe overview identifies the ([^.]+?) because ([^.]+?)\./gi, "The $1 matters because $2.")
    .replace(/\bThe overview notes that ([^.]+?)\./gi, "Notably, $1.")
    .replace(/\bThe overview notes the ([^.]+?) and describe it as ([^.]+?)\./gi, "The $1 is important, and it is best described as $2.")
    .replace(/\bThe overview notes its ([^.]+?)\./gi, "Its $1 stands out.")
    .replace(/\bThe overview notes the ([^.]+?)\./gi, "The $1 is important.")
    .replace(/\bThe overview identifies the ([^.]+?) clearly\./gi, "The $1 is clear.")
    .replace(/\bThe overview foregrounds the ([^.]+?) because ([^.]+?)\./gi, "The $1 matters because $2.")
    .replace(/\bThe overview foregrounds its ([^.]+?) because ([^.]+?)\./gi, "Its $1 matters because $2.")
    .replace(/\bThe overview foregrounds that ([^.]+?) because ([^.]+?)\./gi, "That $1 matters because $2.")
    .replace(/\bThe overview foregrounds the ([^.]+?)\./gi, "The $1 stands out.")
    .replace(/\bThe overview foregrounds its ([^.]+?)\./gi, "Its $1 stands out.")
    .replace(/\bThe overview calls out that ([^.]+?) because ([^.]+?)\./gi, "That $1 matters because $2.")
    .replace(/\bThe overview calls out ([^.]+?) because ([^.]+?)\./gi, "$1 matters because $2.")
    .replace(/\bThe overview calls out platform, region, and complete packaging because ([^.]+?)\./gi, "Platform, region, and complete packaging matter because $1.")
    .replace(/\bThe overview calls it the ([^.]+?) and keep ([^.]+?)\./gi, "It is the $1 and keeps $2.")
    .replace(/\bThe overview treats the ([^.]+?) as ([^.]+?)\./gi, "The $1 works as $2.")
    .replace(/\bThe overview presents it carefully as ([^.]+?)\./gi, "It is best presented carefully as $1.")
    .replace(/\bThe overview presents the ([^.]+?) as ([^.]+?)\./gi, "The $1 is best presented as $2.")
    .replace(/\bThe overview presents the ([^.]+?) clearly because ([^.]+?)\./gi, "The $1 is clear because $2.")
    .replace(/\bThe overview presents the verified catalog identity and ([^.]+?) without ([^.]+?)\./gi, "The verified catalog identity and $1 are presented without $2.")
    .replace(/\bThe overview positions the ([^.]+?) as ([^.]+?)\./gi, "The $1 is best positioned as $2.")
    .replace(/\bThe overview positions the ([^.]+?) for ([^.]+?)\./gi, "The $1 is aimed at $2.")
    .replace(/\bThe overview positions it with ([^.]+?), making it clear that ([^.]+?)\./gi, "It belongs with $1, making it clear that $2.")
    .replace(/\bThe overview frames it for ([^.]+?)\./gi, "It is aimed at $1.")
    .replace(/\bThe overview frames this as ([^.]+?)\./gi, "This is best framed as $1.")
    .replace(/\bThe overview flags it for ([^.]+?)\./gi, "It matters for $1.")
    .replace(/\bThe overview flags its ([^.]+?) because ([^.]+?)\./gi, "Its $1 matters because $2.")
    .replace(/\bThe overview identifies it clearly by ([^.]+?) so ([^.]+?)\./gi, "Its $1 helps $2.")
    .replace(/\bThe overview identifies it clearly by ([^.]+?) because ([^.]+?)\./gi, "Its $1 matters because $2.")
    .replace(/\bThe overview identifies it clearly because ([^.]+?)\./gi, "$1.")
    .replace(/\bThe overview identifies it clearly\./gi, "Its identity is clear.")
    .replace(/\bhow The overview presents it\b/g, "how it is presented")
    .replace(/\bIt is ([^.,;:!?]+?) and distinguish it from\b/g, "It is $1 and distinguishes it from")
    .replace(/\band treat the game as\b/g, "and treats the game as")
    .replace(/(^|[.!?]\s+)it\b/g, (match, prefix) => `${prefix}It`)
    .replace(/(^|[.!?]\s+)its\b/g, (match, prefix) => `${prefix}Its`)
    .replace(/(^|[.!?]\s+)users,?\s+the\b/g, (match, prefix) => `${prefix}For collectors, the`)
    .replace(/(^|[.!?]\s+)library users,?\s+the\b/g, (match, prefix) => `${prefix}For library users, the`)
    .replace(/(^|[.!?]\s+)browsing,?\s+the\b/g, (match, prefix) => `${prefix}When browsing, the`)
    .replace(/(^|[.!?]\s+)the (key|useful|clearest|important)\b/g, (match, prefix, word) => `${prefix}The ${word}`)
    .replace(/\bIn the library it should\b/g, "It should")
    .replace(/\bFor the library, it should\b/g, "It should")
    .replace(/\bFor the library, the\b/g, "For collectors, the")
    .replace(/\bIn the library, the\b/g, "For collectors, the")
    .replace(/\bold generic the catalog (?:blurb|copy|template|text|metadata)\b/gi, "old generic metadata")
    .replace(/\s+/g, " ")
    .replace(/\s+([.,;:!?])/g, "$1")
    .trim();
}

function splitSentences(text) {
  const matches = String(text || "").match(/[^.!?]+[.!?]+(?:["')\]]+)?|[^.!?]+$/g);
  return matches ? matches.map((sentence) => sentence.trim()).filter(Boolean) : [];
}

function cleanOverview(value) {
  const original = String(value || "");
  if (!/\bGCX should\b/i.test(original)) {
    const polished = polishCleanupArtifacts(original);
    return { cleaned: polished, changed: polished !== original, unresolved: /\bGCX should\b/i.test(polished) };
  }

  const sentences = splitSentences(original);
  const cleanedSentences = sentences.map((sentence) => (/\bGCX should\b/i.test(sentence) ? cleanSentence(sentence) : sentence));
  const cleaned = polishCleanupArtifacts(cleanedSentences.join(" ").replace(/\s+/g, " ").trim());
  return {
    cleaned,
    changed: cleaned !== original,
    unresolved: /\bGCX should\b/i.test(cleaned),
  };
}

function overviewFor(game) {
  return game.description || game.gcxOverview || game.overview || "";
}

function setOverview(game, value) {
  if (game.description !== undefined || (!game.gcxOverview && !game.overview)) game.description = value;
  else if (game.gcxOverview !== undefined) game.gcxOverview = value;
  else game.overview = value;
}

function main() {
  const files = fs.readdirSync(gamesDir).filter(isGameDatasetFile).sort();
  const changedFiles = [];
  const changedRows = [];
  const unresolvedRows = [];
  const countsByPlatform = {};

  for (const fileName of files) {
    const filePath = path.join(gamesDir, fileName);
    const slug = fileName.replace(/\.json$/, "");
    const games = readJson(filePath);
    if (!Array.isArray(games)) continue;

    let changedInFile = 0;
    games.forEach((game) => {
      const before = overviewFor(game);
      const result = cleanOverview(before);
      if (!result.changed) return;
      setOverview(game, result.cleaned);
      game.searchText = buildGameSearchText(game, result.cleaned);
      changedInFile += 1;
      changedRows.push({
        platform: slug,
        id: game.id || "",
        title: game.title || game.name || "",
        before,
        after: result.cleaned,
      });
      if (result.unresolved) {
        unresolvedRows.push({
          platform: slug,
          id: game.id || "",
          title: game.title || game.name || "",
          after: result.cleaned,
        });
      }
    });

    if (changedInFile) {
      writeJsonAtomic(fs, filePath, games);
      changedFiles.push(fileName);
      countsByPlatform[slug] = changedInFile;
    }
  }

  const report = {
    ok: unresolvedRows.length === 0,
    generatedAt: new Date().toISOString(),
    changedFileCount: changedFiles.length,
    changedFiles,
    changedRowCount: changedRows.length,
    countsByPlatform,
    unresolvedCount: unresolvedRows.length,
    unresolvedRows: unresolvedRows.slice(0, 50),
    sampleChanges: changedRows.slice(0, 30),
  };

  writeJsonAtomic(fs, outputPath, report);
  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) process.exitCode = 1;
}

main();

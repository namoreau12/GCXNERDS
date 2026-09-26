const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const importsDir = path.join(rootDir, "data", "games", "reviewed-overview-imports");
const outputPath = path.join(rootDir, "data", "launch-readiness", "reviewed-overview-import-internal-language-repair.json");

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  const clean = String(text || "").replace(/^\uFEFF/, "");

  for (let index = 0; index < clean.length; index += 1) {
    const char = clean[index];
    const next = clean[index + 1];
    if (quoted) {
      if (char === '"' && next === '"') {
        cell += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
      continue;
    }
    if (char === '"') quoted = true;
    else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n") {
      row.push(cell.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  if (cell || row.length) {
    row.push(cell.replace(/\r$/, ""));
    rows.push(row);
  }
  return rows.filter((csvRow) => csvRow.some((value) => String(value).trim()));
}

function csvCell(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function writeCsv(filePath, rows) {
  const tempPath = `${filePath}.tmp`;
  fs.writeFileSync(tempPath, `${rows.map((row) => row.map(csvCell).join(",")).join("\n")}\n`, "utf8");
  fs.renameSync(tempPath, filePath);
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.tmp`;
  fs.writeFileSync(tempPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  fs.renameSync(tempPath, filePath);
}

function cleanReaderFacingLanguage(value) {
  return String(value || "")
    .replace(/\bcurrently works best on GCX as\b/gi, "currently works best as")
    .replace(/\bworks best on GCX as\b/gi, "works best as")
    .replace(/\buseful on GCX because\b/gi, "useful for collectors because")
    .replace(/\buseful on GCX as\b/gi, "useful as")
    .replace(/\bon GCX,?\s+it should be understood as\b/gi, "It is best understood as")
    .replace(/\bon GCX,?\s+it should be treated as\b/gi, "It is best treated as")
    .replace(/\bon GCX,?\s+it should be described as\b/gi, "It is best described as")
    .replace(/\bon GCX,?\s+it should sit\b/gi, "It sits")
    .replace(/\bon GCX,?\s+each volume should be identified\b/gi, "Each volume should be identified")
    .replace(/\bon GCX,?\s+/gi, "")
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
    .replace(/\bGCX should frame it as\b/gi, "It is best framed as")
    .replace(/\bGCX should frame\b/gi, "The overview frames")
    .replace(/\bGCX should describe it as\b/gi, "It is best described as")
    .replace(/\bGCX should describe\b/gi, "The overview describes")
    .replace(/\bGCX should position it as\b/gi, "It is best positioned as")
    .replace(/\bGCX should position\b/gi, "The overview positions")
    .replace(/\bGCX should present it as\b/gi, "It is best presented as")
    .replace(/\bGCX should present\b/gi, "The overview presents")
    .replace(/\bGCX should treat it as\b/gi, "It works best as")
    .replace(/\bGCX should treat\b/gi, "The overview treats")
    .replace(/\bGCX should label it as\b/gi, "It fits as")
    .replace(/\bGCX should label\b/gi, "The overview labels")
    .replace(/\bGCX should make that\b/gi, "The overview makes that")
    .replace(/\bGCX should make clear\b/gi, "The overview makes clear")
    .replace(/\bGCX should identify\b/gi, "The overview identifies")
    .replace(/\bGCX should note\b/gi, "The overview notes")
    .replace(/\bGCX should connect it to\b/gi, "It connects to")
    .replace(/\bGCX should avoid overselling it and instead make\b/gi, "The overview keeps the scope modest and makes")
    .replace(/\bGCX should avoid overselling it\b/gi, "The overview keeps the scope modest")
    .replace(/\bGCX should\b/gi, "The overview should")
    .replace(/\bThe listing should\b/gi, "The listing")
    .replace(/\bThis overview should\b/gi, "This overview")
    .replace(/\bThe overview should\b/gi, "The overview")
    .replace(/\bThe record should\b/gi, "The record")
    .replace(/\b(?:Codex|ChatGPT) should\b/gi, "The overview should")
    .replace(/\bThe overview call out\b/gi, "The overview calls out")
    .replace(/\bThe overview call\b/gi, "The overview calls")
    .replace(/\bThe overview keep\b/gi, "The overview keeps")
    .replace(/\bThe overview highlight\b/gi, "The overview highlights")
    .replace(/\bThe overview distinguish\b/gi, "The overview distinguishes")
    .replace(/\bThe overview classify\b/gi, "The overview classifies")
    .replace(/\bThe overview flag\b/gi, "The overview flags")
    .replace(/\bIts value For collectors, is as\b/g, "Its value for collectors is as")
    .replace(/\bIts value For collectors, is\b/g, "Its value for collectors is")
    .replace(/\bIts appeal For collectors, is\b/g, "Its appeal for collectors is")
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
    .trim();
}

function hasInternalLanguage(value) {
  return /\b(?:GCX should|The listing should|This overview should|The overview should|The record should|Codex should|ChatGPT should|on GCX|within GCX|inside GCX|in GCX|For GCX|GCX readers|GCX viewers|GCX visitors|GCX(?:'s|’s)?|The overview (?:calls|flags|highlights|describes|frames|presents|positions|treats|keeps|makes|identifies|notes|foregrounds))\b/i.test(String(value || ""));
}

function repairFile(filePath) {
  const rows = parseCsv(fs.readFileSync(filePath, "utf8"));
  const headers = rows[0] || [];
  const newOverviewIndex = headers.indexOf("newOverview");
  const rewriteNotesIndex = headers.indexOf("rewriteNotes");
  if (newOverviewIndex === -1 && rewriteNotesIndex === -1) {
    return { changedRows: 0, remainingInternalRows: 0 };
  }

  let changedRows = 0;
  const sampleChanges = [];
  for (let index = 1; index < rows.length; index += 1) {
    let changed = false;
    [newOverviewIndex, rewriteNotesIndex].forEach((cellIndex) => {
      if (cellIndex === -1) return;
      const before = rows[index][cellIndex] || "";
      const after = cleanReaderFacingLanguage(before);
      if (after !== before) {
        rows[index][cellIndex] = after;
        changed = true;
      }
    });
    if (changed) {
      changedRows += 1;
      if (sampleChanges.length < 5) {
        sampleChanges.push({
          rowNumber: index + 1,
          gameId: rows[index][headers.indexOf("gameId")] || "",
          title: rows[index][headers.indexOf("title")] || "",
        });
      }
    }
  }

  if (changedRows) writeCsv(filePath, rows);

  const remainingInternalRows = rows
    .slice(1)
    .filter((row) => hasInternalLanguage(row[newOverviewIndex]) || hasInternalLanguage(row[rewriteNotesIndex]))
    .length;
  return { changedRows, remainingInternalRows, sampleChanges };
}

function main() {
  const files = fs.readdirSync(importsDir).filter((fileName) => fileName.endsWith(".csv")).sort();
  const changedFiles = [];
  let changedRows = 0;
  let remainingInternalRows = 0;

  files.forEach((fileName) => {
    const filePath = path.join(importsDir, fileName);
    const result = repairFile(filePath);
    if (result.changedRows) {
      changedRows += result.changedRows;
      changedFiles.push({ fileName, ...result });
    }
    remainingInternalRows += result.remainingInternalRows;
  });

  const report = {
    ok: remainingInternalRows === 0,
    generatedAt: new Date().toISOString(),
    checkedFiles: files.length,
    changedFileCount: changedFiles.length,
    changedRows,
    remainingInternalRows,
    changedFiles,
  };
  writeJson(outputPath, report);
  console.log(JSON.stringify({
    ok: report.ok,
    checkedFiles: report.checkedFiles,
    changedFileCount: report.changedFileCount,
    changedRows: report.changedRows,
    remainingInternalRows: report.remainingInternalRows,
    sampleFiles: changedFiles.slice(0, 10),
  }, null, 2));
  if (!report.ok) process.exitCode = 1;
}

main();

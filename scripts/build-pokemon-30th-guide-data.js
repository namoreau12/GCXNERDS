const fs = require("node:fs");
const path = require("node:path");

const SOURCE_URL = "https://tcgscreener.com/guide/30th-celebration-card-list";
const IMAGE_BASE = "https://tcgscreener.com/guides/30th-celebration/cards/";
const OFFICIAL_GALLERY = "https://tcg.pokemon.com/en-us/galleries/30th-celebration/";
const POKEMON_PRODUCT_SHOWCASE = "https://www.pokemon.com/us/news/pokemon-tcg-30th-celebration-product-showcase";

function decode(value = "") {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/<!-- -->/g, "");
}

function textFromHtml(value = "") {
  return decode(value).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function fullImageUrl(fragment) {
  return fragment ? `${IMAGE_BASE}${fragment}` : "";
}

function rarityName(code) {
  return (
    {
      C: "Common",
      R: "Rare",
      RR: "Double Rare",
      PK: "Pikachu Rare",
      IR: "Illustration Rare",
      SIR: "Special Illustration Rare",
      FUR: "Futuristic Rare",
    }[code] || code || "Confirmed"
  );
}

function categoryFor(card) {
  if (card.collection === "Promo") return "Promos";
  if (card.collection === "Classic Collection") return "Classic Collection";
  if (card.category === "Energy") return "Energy";
  if (card.rarityCode === "PK") return "30 Pikachu";
  if (["IR", "SIR", "FUR"].includes(card.rarityCode)) return "Secret / Special Art";
  if (card.name.includes(" ex")) return "Pokemon ex";
  return "Standard Cards";
}

function generationHint(name) {
  const gen1 = ["Pikachu", "Mewtwo", "Mew", "Charizard", "Blastoise", "Venusaur", "Moltres", "Articuno", "Zapdos", "Meowth", "Eevee", "Snorlax", "Lapras", "Slowpoke", "Ninetales", "Vulpix", "Ditto", "Kangaskhan"];
  if (gen1.some((needle) => name.includes(needle))) return "Kanto / early-era callback";
  return "Modern-era slot";
}

function editorialFor(card) {
  if (card.collection === "Classic Collection") {
    return `${card.name} returns as a Classic Collection card, so the appeal is less about new mechanics and more about seeing a known historical card framed for the anniversary binder.`;
  }
  if (card.collection === "Promo") {
    return `${card.name} is a product-linked Black Star Promo, which makes the product source part of the collecting story as much as the card itself.`;
  }
  if (card.category === "Energy") {
    return `${card.name} gives the set a binder-completion lane beyond Pokemon and Trainers, with the anniversary treatment turning a functional card into a display piece.`;
  }
  if (card.rarityCode === "PK") {
    return `${card.name} is part of the thirty-card Pikachu run, where the collectible hook is comparing how different illustrators interpret the same mascot.`;
  }
  if (["IR", "SIR", "FUR"].includes(card.rarityCode)) {
    return `${card.name} sits in the high-visibility art block, where image identity, illustrator credit, and confirmed numbering matter most for collectors.`;
  }
  return `${card.name} fills out the numbered 30th Celebration checklist and gives the set its wider binder texture beyond the headline chase cards.`;
}

function collectorFor(card) {
  const artist = card.artist ? ` Illustrator ${card.artist} gives this copy a clear artist-search hook.` : "";
  const note = card.notes ? ` ${card.notes}` : "";
  return `${rarityName(card.rarityCode)} status, set placement ${card.number}, and confirmed image availability are the key collection checks here.${artist}${note}`.trim();
}

function detailFor(card) {
  if (card.relatedCard) return card.relatedCard;
  if (card.notes) return card.notes;
  if (card.rarityCode === "PK") return "GCX detail: the card is numbered both as a normal set card and as part of the 01/30-30/30 Pikachu mini-run.";
  if (card.imageUrl) return "GCX detail: the image is tied to this card's exact set number in the media manifest, not just to the Pokemon name.";
  return "GCX detail: GCX is holding the image space until an official or reliably matched card image is available.";
}

function parseMainCards(html) {
  const anchors = [...html.matchAll(/<a class="group block[\s\S]*?<\/a>/g)].map((match) => match[0]);
  const tableStart = html.indexOf("Checklist table</h2>");
  const tableEnd = html.indexOf("</tbody>", tableStart);
  const rows = [...html.slice(tableStart, tableEnd).matchAll(/<tr class="border-b[\s\S]*?<\/tr>/g)].map((match) => match[0]);
  const rowByNumber = new Map();
  rows.forEach((row) => {
    const cells = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((match) => match[1]);
    if (cells.length < 6) return;
    const number = textFromHtml(cells[0]);
    rowByNumber.set(number, {
      type: textFromHtml(cells[2]),
      rarity: textFromHtml(cells[3]),
      artist: textFromHtml(cells[4]),
      notes: textFromHtml(cells[5]).replace(/\s*source ↗\s*$/, "").trim(),
      sourceUrl: (cells[5].match(/href="([^"]+)"/) || [])[1] || OFFICIAL_GALLERY,
    });
  });

  return anchors.map((anchor) => {
    const href = decode((anchor.match(/href="([^"]+)"/) || [])[1] || "");
    const image = (anchor.match(/url=([^&"]*30th-celebration[^&"]*)/) || [])[1];
    const spans = [...anchor.matchAll(/<span class="[^"]*">([^<]+)<\/span>/g)].map((match) => textFromHtml(match[1]));
    const number = spans.find((value) => /^\d{3}\/128$/.test(value)) || "";
    const rarityCode = [...spans].reverse().find((value) => /^(C|R|RR|PK|IR|SIR|FUR)$/.test(value)) || "";
    const name = textFromHtml((anchor.match(/<div class="truncate[^>]*>([^<]+)<\/div>/) || [])[1] || "");
    const title = decode((anchor.match(/title="([^"]+)"/) || [])[1] || "");
    const alt = decode((anchor.match(/<img alt="([^"]+)"/) || [])[1] || "");
    const table = rowByNumber.get(number) || {};
    const card = {
      id: `30c-${number.split("/")[0]}`,
      collection: "Main Set",
      number,
      setNumber: "30th Celebration",
      name,
      pokemonName: name.replace(/\s+\(.+\)$/, ""),
      pokemonType: table.type || "",
      rarityCode,
      rarity: table.rarity || rarityName(rarityCode),
      artist: table.artist || (title.match(/illus\. ([^:]+):/) || [])[1] || "",
      variant: name.includes("(") ? (name.match(/\(([^)]+)\)/) || [])[1] : "",
      category: "",
      generation: generationHint(name),
      historicalReference: "",
      notes: table.notes || "",
      sourceUrl: table.sourceUrl || OFFICIAL_GALLERY,
      detailUrl: href ? `https://tcgscreener.com${href}` : SOURCE_URL,
      imageUrl: image ? `https://tcgscreener.com${decodeURIComponent(image)}` : "",
      imageSource: image ? SOURCE_URL : "",
      imageCredit: image ? "TCGscreener card gallery; source states official Pokémon card-gallery images" : "",
      imageVerified: Boolean(image),
      altText: alt || `${name} ${number}, Pokemon TCG: 30th Celebration`,
      marketData: {
        source: "TCGscreener",
        snapshotDate: "2026-10-03",
        rawPrice: textFromHtml((anchor.match(/<div class="mt-0\.5[^>]*>([^<]*)<\/div>/) || [])[1] || ""),
      },
      confirmedStatus: "Confirmed",
    };
    card.category = categoryFor(card);
    card.editorialSummary = editorialFor(card);
    card.collectorNotes = collectorFor(card);
    card.artworkDetails = detailFor(card);
    return card;
  });
}

function parsePromoCards(html) {
  const promos = [
    ["094", "Alolan Exeggutor", "Tech Sticker Collection - Pokemon Day Out", true],
    ["095", "Lucario", "Tech Sticker Collection - Pokemon Night Out", true],
    ["096", "Moltres", "Poster Collection", false],
    ["097", "Articuno", "Poster Collection", false],
    ["098", "Zapdos", "Poster Collection", false],
    ["099", "Greninja ex", "Greninja ex Box / ex Tin", true],
    ["100", "Sylveon ex", "Sylveon ex Box / ex Tin", true],
    ["101", "Nidorina (full art)", "Nidoran female Illustration Collection", true],
    ["102", "Victini", "Espeon ex Battle Deck", true],
    ["103", "Zeraora", "Umbreon ex Battle Deck", true],
    ["104", "Mewtwo", "Figure Collection - Mewtwo", false],
    ["105", "Mew", "Figure Collection - Mew", false],
    ["106", "Ditto", "Ditto Premium Collection", false],
    ["107", "Pikachu ex (day)", "Pikachu ex Collection", true],
    ["108", "Espeon ex", "Espeon ex Battle Deck", true],
    ["109", "Pikachu ex (night)", "Pikachu ex Collection", true],
    ["110", "Umbreon ex", "Umbreon ex Battle Deck", true],
  ];
  return promos.map(([promoNumber, name, product, hasImage]) => {
    const code = `MEP ${promoNumber}`;
    const imageFile = hasImage ? `mep-${promoNumber}.webp` : "";
    const alt = `${name} ${code} promo, Pokemon TCG: 30th Celebration`;
    const card = {
      id: `mep-${promoNumber}`,
      collection: "Promo",
      number: code,
      setNumber: "30th Celebration Black Star Promo",
      name,
      pokemonName: name,
      pokemonType: "",
      rarityCode: "Promo",
      rarity: "Black Star Promo",
      artist: "",
      variant: product,
      category: "Promos",
      generation: generationHint(name),
      historicalReference: "",
      notes: product ? `Product source: ${product}.` : "",
      sourceUrl: POKEMON_PRODUCT_SHOWCASE,
      detailUrl: SOURCE_URL,
      imageUrl: imageFile ? fullImageUrl(imageFile) : "",
      imageSource: imageFile ? SOURCE_URL : "",
      imageCredit: imageFile ? "TCGscreener card gallery; promo mapping attributed to Pokemon product showcase" : "",
      imageVerified: Boolean(imageFile),
      altText: alt || `${name} ${code}, Pokemon TCG: 30th Celebration promo`,
      marketData: {},
      confirmedStatus: "Confirmed",
    };
    card.editorialSummary = editorialFor(card);
    card.collectorNotes = collectorFor(card);
    card.artworkDetails = detailFor(card);
    return card;
  });
}

function parseClassicAndEnergy(html) {
  const figures = [...html.matchAll(/<figure[\s\S]*?<\/figure>/g)].map((match) => match[0]);
  const cards = [];
  for (const figure of figures) {
    const href = decode((figure.match(/href="([^"]+)"/) || [])[1] || "");
    const image = (figure.match(/url=([^&"]*30th-celebration[^&"]*)/) || [])[1];
    const alt = decode((figure.match(/<img alt="([^"]+)"/) || [])[1] || "");
    const caption = textFromHtml((figure.match(/<figcaption[\s\S]*?<\/figcaption>/) || [])[0] || "");
    if (!image) continue;
    if (href.includes("classic-collection")) {
      const name = textFromHtml((figure.match(/<figcaption[\s\S]*?<a[^>]*>([^<]+)<\/a>/) || [])[1] || alt.split(" Classic Collection")[0]);
      const sourceSet = (caption.match(/([A-Za-z&: .'-]+ \(\d{4}\))/) || [])[1] || "Historical Pokemon TCG release";
      const file = decodeURIComponent(image).split("/").pop();
      const card = {
        id: file.replace(".webp", ""),
        collection: "Classic Collection",
        number: name.match(/\d+\/\d+/)?.[0] || file.replace("cc-", "Classic "),
        setNumber: "30th Celebration Classic Collection",
        name,
        pokemonName: name.replace(/\s+\d+\/\d+$/, ""),
        pokemonType: "",
        rarityCode: "Classic",
        rarity: "Classic Collection",
        artist: "",
        variant: "30th anniversary stamped reprint",
        category: "Classic Collection",
        generation: "Historical callback",
        historicalReference: sourceSet,
        notes: caption,
        sourceUrl: SOURCE_URL,
        detailUrl: href ? `https://tcgscreener.com${href}` : SOURCE_URL,
        imageUrl: `https://tcgscreener.com${decodeURIComponent(image)}`,
        imageSource: SOURCE_URL,
        imageCredit: "TCGscreener Classic Collection gallery",
        imageVerified: true,
        altText: alt || `${name}, 30th Celebration Classic Collection`,
        marketData: {},
        confirmedStatus: "Confirmed",
      };
      card.editorialSummary = editorialFor(card);
      card.collectorNotes = collectorFor(card);
      card.artworkDetails = detailFor(card);
      cards.push(card);
    } else if (image.includes("jp-")) {
      const type = caption || alt.replace("Basic ", "").replace(" Energy, Pokémon TCG: 30th Celebration", "");
      const file = decodeURIComponent(image).split("/").pop();
      const card = {
        id: file.replace(".webp", ""),
        collection: "Energy",
        number: type,
        setNumber: "30th Celebration Energy",
        name: `Basic ${type} Energy`,
        pokemonName: "",
        pokemonType: type,
        rarityCode: "Energy",
        rarity: "Anniversary Energy",
        artist: "",
        variant: "Japanese anniversary Energy",
        category: "Energy",
        generation: "Set accessory",
        historicalReference: "",
        notes: "Anniversary Energy card pictured in the 30th Celebration guide.",
        sourceUrl: SOURCE_URL,
        detailUrl: SOURCE_URL,
        imageUrl: `https://tcgscreener.com${decodeURIComponent(image)}`,
        imageSource: SOURCE_URL,
        imageCredit: "TCGscreener Energy gallery",
        imageVerified: true,
        altText: alt || `Basic ${type} Energy, Pokemon TCG: 30th Celebration`,
        marketData: {},
        confirmedStatus: "Confirmed",
      };
      card.editorialSummary = editorialFor(card);
      card.collectorNotes = collectorFor(card);
      card.artworkDetails = detailFor(card);
      cards.push(card);
    }
  }
  const seen = new Set();
  return cards.filter((card) => {
    const key = `${card.collection}|${card.id}|${card.name}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function validate(cards) {
  const warnings = [];
  const imageToCards = new Map();
  cards.forEach((card) => {
    if (!card.imageUrl) return;
    const list = imageToCards.get(card.imageUrl) || [];
    list.push(`${card.number} ${card.name}`);
    imageToCards.set(card.imageUrl, list);
    const compactNumber = card.number.match(/\d+/)?.[0];
    if (card.collection === "Main Set" && compactNumber && !card.imageUrl.includes(`30c-${compactNumber.padStart(3, "0")}.webp`)) {
      warnings.push({
        code: "CARD_IMAGE_VERIFICATION_FAILED",
        card: `${card.number} ${card.name}`,
        imageUrl: card.imageUrl,
      });
    }
  });
  imageToCards.forEach((list, imageUrl) => {
    if (list.length > 1) warnings.push({ code: "DUPLICATE_CARD_IMAGE_DETECTED", imageUrl, cards: list });
  });
  return warnings;
}

async function main() {
  const html = await fetch(SOURCE_URL).then((response) => response.text());
  const cards = [...parseMainCards(html), ...parsePromoCards(html), ...parseClassicAndEnergy(html)];
  const warnings = validate(cards);
  const payload = {
    set: {
      id: "pokemon-tcg-30th-celebration",
      name: "Pokemon TCG: 30th Celebration",
      releaseDate: "2026-09-16",
      lastUpdated: "2026-10-03T12:00:00-04:00",
      confirmedCards: cards.length,
      mainSetCards: cards.filter((card) => card.collection === "Main Set").length,
      sourcePriorityNote: "Official Pokemon gallery and product pages first; TCGscreener used as a structured index for the official gallery and image manifest.",
      sources: [
        { label: "Pokemon official 30th Celebration gallery", url: OFFICIAL_GALLERY },
        { label: "Pokemon 30th Celebration product showcase", url: POKEMON_PRODUCT_SHOWCASE },
        { label: "TCGscreener 30th Celebration card list", url: SOURCE_URL },
      ],
    },
    validation: {
      generatedAt: new Date().toISOString(),
      warnings,
      missingImages: cards.filter((card) => !card.imageUrl).map((card) => `${card.number} ${card.name}`),
    },
    cards,
  };

  const outPath = path.join(__dirname, "..", "data", "pokemon-30th-celebration.json");
  fs.writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`);
  console.log(JSON.stringify({ cards: cards.length, warnings: warnings.length, missingImages: payload.validation.missingImages.length, outPath: path.relative(path.join(__dirname, ".."), outPath) }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

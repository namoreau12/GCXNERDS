const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const NEWSROOM_PATH = path.join(ROOT, "data", "newsroom.json");
const REPORT_PATH = path.join(ROOT, "data", "launch-readiness", "newsroom-media-audit.json");

const DISPLAYABLE_IMAGE_RIGHTS = new Set([
  "approved",
  "api-permitted",
  "fair-use-review",
  "licensed",
  "owned",
  "permission-granted",
  "press-asset",
]);

const APPROVED_VIDEO_RIGHTS = new Set(["official-embed", "approved"]);
const OFFICIAL_VIDEO_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "youtu.be",
  "www.youtu.be",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
]);

const OFFICIAL_MEDIA_KEYWORDS = [
  "official",
  "publisher",
  "developer",
  "press",
  "media kit",
  "square enix",
  "capcom",
  "xbox",
  "the coalition",
  "playstation",
  "sony",
  "nintendo",
  "pokemon",
  "the pokemon company",
  "fromsoftware",
  "cd projekt",
  "rebel wolves",
  "bandai namco",
  "rockstar",
];

const PROHIBITED_GAME_HERO_PATTERNS = [
  /abstract/i,
  /ai[-\s]?created/i,
  /baked[-\s]?headline/i,
  /fake[-\s]?(logo|title|visual)/i,
  /geometric/i,
  /generated[-\s]?(art|image|visual)/i,
  /original gcx editorial image/i,
  /placeholder[-\s]?(illustration|graphic|visual)/i,
  /symbolic[-\s]?art/i,
];

const REAL_GAME_STORY_HINTS = [
  /blood of dawnwalker/i,
  /duskbloods/i,
  /final fantasy/i,
  /gears of war/i,
  /gta\s*(vi|6)/i,
  /horizon/i,
  /mega man/i,
  /phantom blade/i,
  /pokemon/i,
  /witcher/i,
];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function slug(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function isUrl(value) {
  try {
    return Boolean(new URL(value));
  } catch {
    return false;
  }
}

function hostName(value) {
  try {
    return new URL(value).hostname.toLowerCase();
  } catch {
    return "";
  }
}

function isLikelyLongform(story) {
  return (story.body || []).length >= 18 || String(story.articleType || "").toLowerCase().includes("guide");
}

function heroImageUrl(story) {
  return story.heroImage || story.imageUrl || "";
}

function isGamingStory(story) {
  return slug(story.category || story.type).includes("gaming");
}

function isRealGameStory(story) {
  if (!isGamingStory(story)) return false;
  const haystack = [story.title, story.seoTitle, story.excerpt, story.canonicalTopic, ...(story.tags || [])]
    .filter(Boolean)
    .join(" ");
  return REAL_GAME_STORY_HINTS.some((pattern) => pattern.test(haystack));
}

function isOwnedAnalysisGraphic(story) {
  const type = heroMediaType(story);
  const provenance = [
    story.heroImageSource,
    story.heroImageCredit,
    story.imageCredit,
    story.articleType,
    story.editorialStatus,
    story.type,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  if (!["analysis-graphic", "graphic", "chart", "diagram", "infographic"].includes(type)) return false;
  if (!/\bgcx\b/.test(provenance) || !/\banalysis\b/.test(provenance)) return false;
  if (isRealGameStory(story)) return false;
  return /market-analysis|analysis/.test(provenance);
}

function heroMediaType(story) {
  const explicit = slug(story.mediaType || story.leadMediaType || story.imageType || "");
  const imageUrl = heroImageUrl(story);
  if (explicit) return explicit;
  if (/\.svg(?:\?|$)/i.test(imageUrl)) return "graphic";
  return "screenshot";
}

function hasOfficialHeroMedia(story) {
  const imageUrl = heroImageUrl(story);
  const type = heroMediaType(story);
  const provenance = [
    story.heroImageSource,
    story.heroImageCredit,
    story.heroImageSourceUrl,
    story.imageSourceUrl,
    story.imageCredit,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  if (!imageUrl || /\.svg(?:\?|$)/i.test(imageUrl)) return false;
  if (["graphic", "chart", "diagram", "infographic"].includes(type)) return false;
  if (/\b(fallback|pending|required|review)\b/.test(provenance)) return false;
  return OFFICIAL_MEDIA_KEYWORDS.some((keyword) => provenance.includes(keyword));
}

function checkHeroMedia(story, issues) {
  const imageUrl = heroImageUrl(story);
  const type = heroMediaType(story);
  const heroDescription = [
    imageUrl,
    story.heroImageSource,
    story.heroImageCredit,
    story.heroImageAlt,
    story.imageCredit,
    story.title,
  ]
    .filter(Boolean)
    .join(" ");
  for (const field of ["heroImage", "heroImageSource", "heroImageCredit", "heroImageAlt", "heroImageFocalX", "heroImageFocalY", "trailerUrl", "mediaType"]) {
    if (!(field in story)) {
      issues.push({ storyId: story.id, severity: "warning", code: `missing_story_${field}` });
    }
  }
  if (!imageUrl) {
    issues.push({ storyId: story.id, severity: "error", code: "missing_hero_image" });
  }
  if (isGamingStory(story) && /\.svg(?:\?|$)/i.test(imageUrl)) {
    issues.push({ storyId: story.id, severity: "error", code: "gaming_hero_uses_svg_graphic", imageUrl });
  }
  if (isGamingStory(story) && PROHIBITED_GAME_HERO_PATTERNS.some((pattern) => pattern.test(heroDescription))) {
    issues.push({ storyId: story.id, severity: "error", code: "prohibited_generated_game_hero", imageUrl });
  }
  if (isRealGameStory(story) && ["graphic", "chart", "diagram", "infographic"].includes(type)) {
    issues.push({ storyId: story.id, severity: "error", code: "real_game_story_uses_graphic_hero", imageUrl, mediaType: type });
  }
  if (isGamingStory(story) && !hasOfficialHeroMedia(story) && !isOwnedAnalysisGraphic(story)) {
    issues.push({ storyId: story.id, severity: "warning", code: "official_media_required", imageUrl });
  }
}

function checkImageLike(storyId, item, issues, prefix) {
  const rights = slug(item.rightsStatus);
  const imageUrl = item.imageUrl || "";
  if (!imageUrl) {
    issues.push({ storyId, severity: "warning", code: "missing_image_url", itemId: item.id || prefix });
    return;
  }
  if (!DISPLAYABLE_IMAGE_RIGHTS.has(rights)) {
    issues.push({ storyId, severity: "warning", code: "image_not_displayable", itemId: item.id || prefix, rightsStatus: item.rightsStatus || "" });
  }
  for (const field of ["altText", "caption", "credit", "sourceUrl"]) {
    if (!item[field]) {
      issues.push({ storyId, severity: "warning", code: `missing_${field}`, itemId: item.id || prefix });
    }
  }
}

function checkMedia(story, issues) {
  checkHeroMedia(story, issues);
  const media = Array.isArray(story.media) ? story.media : [];
  if (isLikelyLongform(story) && media.length === 0 && story.articleMode !== "pokemon-pikachu-checklist") {
    issues.push({ storyId: story.id, severity: "warning", code: "longform_without_media" });
  }

  media.forEach((item, index) => {
    const type = slug(item.mediaType || item.type);
    const itemId = item.id || `media-${index}`;
    if (!type) {
      issues.push({ storyId: story.id, severity: "warning", code: "missing_media_type", itemId });
      return;
    }

    if (["image", "screenshot"].includes(type)) {
      checkImageLike(story.id, item, issues, itemId);
    }

    if (type === "gallery") {
      const items = Array.isArray(item.items) ? item.items : [];
      if (!items.length) {
        issues.push({ storyId: story.id, severity: "warning", code: "empty_gallery", itemId });
      }
      items.forEach((galleryItem, galleryIndex) => {
        checkImageLike(story.id, { ...item, ...galleryItem }, issues, `${itemId}-${galleryIndex}`);
      });
    }

    if (["trailer", "video"].includes(type)) {
      const embedUrl = item.embedUrl || item.sourceUrl || "";
      const rights = slug(item.rightsStatus);
      if (!embedUrl || !isUrl(embedUrl)) {
        issues.push({ storyId: story.id, severity: "warning", code: "invalid_video_embed", itemId });
      } else if (!OFFICIAL_VIDEO_HOSTS.has(hostName(embedUrl))) {
        issues.push({ storyId: story.id, severity: "warning", code: "non_youtube_video_host", itemId, host: hostName(embedUrl) });
      }
      if (!APPROVED_VIDEO_RIGHTS.has(rights)) {
        issues.push({ storyId: story.id, severity: "warning", code: "video_rights_not_official", itemId, rightsStatus: item.rightsStatus || "" });
      }
    }
  });
}

function main() {
  const stories = readJson(NEWSROOM_PATH);
  const issues = [];
  stories.forEach((story) => checkMedia(story, issues));

  const report = {
    generatedAt: new Date().toISOString(),
    ok: issues.every((issue) => issue.severity !== "error"),
    storyCount: stories.length,
    issueCount: issues.length,
    errorCount: issues.filter((issue) => issue.severity === "error").length,
    warningCount: issues.filter((issue) => issue.severity !== "error").length,
    issues,
  };

  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2) + "\n", "utf8");
  console.log(JSON.stringify(report, null, 2));
  process.exitCode = report.ok ? 0 : 1;
}

main();

const fs = require("fs");
const path = require("path");
const {
  normalizeSocialPostDraft,
  normalizeStreamingItemDraft,
  socialDuplicateKey,
} = require("./social-streaming-pipeline-utils");

const rootDir = path.resolve(__dirname, "..");
const communityPath = path.join(rootDir, "data", "community.json");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function main() {
  const data = readJson(communityPath);
  const beforePosts = (data.posts || []).length;
  const beforeStreaming = (data.streamingSpotlight || []).length;

  data.posts = (data.posts || []).map((post) => {
    const normalized = normalizeSocialPostDraft({
      ...post,
      duplicateKey: "",
    });
    return {
      ...post,
      ...normalized,
      duplicateKey: socialDuplicateKey({ ...post, ...normalized }),
    };
  });

  data.streamingSpotlight = (data.streamingSpotlight || []).map((item) => ({
    ...item,
    ...normalizeStreamingItemDraft(item),
  }));

  writeJson(communityPath, data);
  console.log(JSON.stringify({
    ok: true,
    posts: beforePosts,
    streamingSpotlight: beforeStreaming,
  }, null, 2));
}

main();

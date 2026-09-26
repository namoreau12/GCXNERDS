const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const communityPath = path.join(rootDir, "data", "community.json");

const videoPriorityByPostId = {
  "post-social-watch-next-halo-campaign-evolved-official-trailer": 45,
};

function main() {
  const data = JSON.parse(fs.readFileSync(communityPath, "utf8"));
  let updated = 0;
  (data.posts || []).forEach((post) => {
    const priority = videoPriorityByPostId[post.id];
    if (!priority) return;
    post.editorialPriority = Math.max(Number(post.editorialPriority || 0), priority);
    post.updatedAt = new Date().toISOString();
    updated += 1;
  });
  fs.writeFileSync(communityPath, `${JSON.stringify(data, null, 2)}\n`);
  console.log(JSON.stringify({ ok: true, updated }, null, 2));
}

main();

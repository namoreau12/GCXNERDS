const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const communityPath = path.join(rootDir, "data", "community.json");

const pollOptionsByPostId = {
  "post-social-do-higher-console-prices-change-how-you-collect": [
    { id: "like", reaction: "like", label: "Wait longer before upgrading" },
    { id: "hype", reaction: "hype", label: "Go deeper into retro" },
    { id: "want", reaction: "want", label: "Buy fewer systems" },
    { id: "watch", reaction: "watch", label: "Still buy at launch" },
  ],
  "post-social-which-pokemon-generation-had-the-best-starters": [
    { id: "like", reaction: "like", label: "Gen 1" },
    { id: "hype", reaction: "hype", label: "Gen 3" },
    { id: "want", reaction: "want", label: "Gen 4" },
    { id: "watch", reaction: "watch", label: "Gen 9" },
  ],
  "post-social-what-console-library-should-gcx-clean-up-next": [
    { id: "like", reaction: "like", label: "Images first" },
    { id: "hype", reaction: "hype", label: "Better overviews" },
    { id: "want", reaction: "want", label: "Stricter official lists" },
    { id: "watch", reaction: "watch", label: "Price/collector context" },
  ],
};

const featuredPollPriorityByPostId = {
  "post-social-do-higher-console-prices-change-how-you-collect": 80,
  "post-social-what-console-library-should-gcx-clean-up-next": 60,
};

function main() {
  const data = JSON.parse(fs.readFileSync(communityPath, "utf8"));
  let updated = 0;
  (data.posts || []).forEach((post) => {
    const pollOptions = pollOptionsByPostId[post.id];
    if (!pollOptions) return;
    post.pollOptions = pollOptions;
    post.pollType = "reaction_poll";
    post.pollPrompt = post.title;
    if (featuredPollPriorityByPostId[post.id]) {
      post.editorialPriority = Math.max(Number(post.editorialPriority || 0), featuredPollPriorityByPostId[post.id]);
    }
    post.updatedAt = new Date().toISOString();
    updated += 1;
  });
  fs.writeFileSync(communityPath, `${JSON.stringify(data, null, 2)}\n`);
  console.log(JSON.stringify({ ok: true, updated }, null, 2));
}

main();

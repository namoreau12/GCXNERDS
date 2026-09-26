const postDetail = document.querySelector("#post-detail");
const sessionStorageKey = "gcx-session-token-v1";
const viewerStorageKey = "gcx-community-viewer-v1";
const reactionStorageKey = "gcx-community-reactions-v1";
const likedStorageKey = "gcx-community-likes-v1";

let activePost = null;
let comments = [];
let relatedPosts = [];
let viewerId = localStorage.getItem(viewerStorageKey) || "profile-gcx-member";

const reactionOptions = [
  { id: "like", label: "Like" },
  { id: "hype", label: "Hype" },
  { id: "want", label: "Want" },
  { id: "trade", label: "Trade" },
  { id: "watch", label: "Watch" },
];

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Just now";
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(date);
}

function selectedPostId() {
  return new URLSearchParams(window.location.search).get("id") || "";
}

function readStoredSet(key) {
  try {
    return new Set(JSON.parse(localStorage.getItem(key) || "[]"));
  } catch (error) {
    return new Set();
  }
}

function writeStoredSet(key, values) {
  try {
    localStorage.setItem(key, JSON.stringify(Array.from(values)));
  } catch (error) {
    // Server-side state still updates if browser storage is unavailable.
  }
}

function sessionToken() {
  return localStorage.getItem(sessionStorageKey) || "";
}

function authHeaders(extra = {}) {
  return {
    ...extra,
    ...(sessionToken() ? { "X-GCX-Session": sessionToken() } : {}),
  };
}

function reactionKey(postId, reactionId) {
  return `${postId}:${reactionId}`;
}

function detailUrl() {
  const url = new URL("community-post.html", window.location.href);
  url.searchParams.set("id", activePost.id);
  return url.toString();
}

function renderLinkPreview(preview) {
  if (!preview?.url) return "";
  const image = preview.imageUrl ? `<img src="${escapeHtml(preview.imageUrl)}" alt="${escapeHtml(preview.title)} preview" loading="lazy" />` : "";
  return `
    <a class="link-preview-card" href="${escapeHtml(preview.url)}" target="${preview.url.startsWith("http") ? "_blank" : "_self"}" rel="noreferrer">
      ${image}
      <span>${escapeHtml(preview.sourceLabel || "Shared link")}</span>
      <strong>${escapeHtml(preview.title || "Shared link")}</strong>
      <p>${escapeHtml(preview.description || preview.url)}</p>
    </a>
  `;
}

function renderReactionBar(post) {
  const reactions = post.reactions || { like: post.likes || 0 };
  const reacted = readStoredSet(reactionStorageKey);
  const liked = readStoredSet(likedStorageKey);
  return `
    <div class="reaction-bar" aria-label="Post reactions">
      ${reactionOptions
        .map((reaction) => {
          const key = reactionKey(post.id, reaction.id);
          const active = reacted.has(key) || (reaction.id === "like" && liked.has(post.id));
          return `
            <button class="reaction-button ${active ? "is-active" : ""}" type="button" data-react-post="${escapeHtml(post.id)}" data-reaction="${escapeHtml(reaction.id)}" ${active ? "disabled" : ""}>
              <span>${escapeHtml(reaction.label)}</span>
              <strong>${Number(reactions[reaction.id] || 0).toLocaleString()}</strong>
            </button>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderComments() {
  return comments.length
    ? comments
        .map(
          (comment) => `
            <article class="comment-card">
              <strong>${escapeHtml(comment.author)}</strong>
              <span>${escapeHtml(comment.handle || "")} - ${escapeHtml(formatDate(comment.createdAt))}</span>
              <p>${escapeHtml(comment.body)}</p>
            </article>
          `
        )
        .join("")
    : `<div class="index-message">No comments yet.</div>`;
}

function renderRelatedPosts() {
  return relatedPosts.length
    ? relatedPosts
        .map(
          (post) => `
            <a class="traffic-hook" href="community-post.html?id=${encodeURIComponent(post.id)}">
              <strong>${escapeHtml(post.title)}</strong>
              <span>${escapeHtml(post.category || "Community")} - ${Number(post.comments || 0).toLocaleString()} comments</span>
            </a>
          `
        )
        .join("")
    : `<div class="index-message">Related posts will appear here.</div>`;
}

function renderCommentComposer() {
  if (!sessionToken()) {
    const next = `community-post.html?id=${encodeURIComponent(activePost?.id || selectedPostId())}`;
    return `
      <div class="auth-required-box">
        <strong>Log in to comment</strong>
        <p>GCX comments use member accounts so conversations stay tied to real community profiles.</p>
        <a class="button" href="auth.html?next=${encodeURIComponent(next)}">Sign in or create account</a>
      </div>
    `;
  }

  return `
    <form id="post-comment-form" class="comment-form">
      <input name="body" type="text" placeholder="Write a comment" required />
      <button class="button" type="submit">Comment</button>
    </form>
  `;
}

function renderPost() {
  const post = activePost;
  const author = post.authorProfile || {};
  const avatar = author.avatarUrl
    ? `<img src="${escapeHtml(author.avatarUrl)}" alt="${escapeHtml(author.displayName)} avatar" loading="lazy" />`
    : `<span>${escapeHtml((post.author || "?").slice(0, 1))}</span>`;
  const image = post.imageUrl ? `<a href="${escapeHtml(post.imageUrl)}" target="_blank" rel="noreferrer"><img src="${escapeHtml(post.imageUrl)}" alt="${escapeHtml(post.title)}" loading="lazy" /></a>` : "";
  const group = post.group ? `<a class="feed-group-badge" href="community.html?group=${encodeURIComponent(post.group.id)}">${escapeHtml(post.group.name)}</a>` : "";
  const linkPreview = renderLinkPreview(post.linkPreview);
  const reshared = post.resharedPost
    ? `
      <a class="reshared-post-card" href="community-post.html?id=${encodeURIComponent(post.resharedPost.id)}">
        <span>Originally shared by ${escapeHtml(post.resharedPost.author || "GCX Member")}</span>
        <strong>${escapeHtml(post.resharedPost.title)}</strong>
        <p>${escapeHtml(post.resharedPost.body)}</p>
      </a>
    `
    : "";

  document.title = `${post.title} | GCX Community`;
  postDetail.innerHTML = `
    <article class="community-panel post-detail-card">
      <div class="feed-card-head">
        <a class="feed-avatar" href="profile.html?id=${encodeURIComponent(author.id || post.profileId || "")}">${avatar}</a>
        <div>
          <strong>${escapeHtml(post.author || author.displayName || "GCX Member")}</strong>
          <span>${escapeHtml(post.handle || author.handle || "")} - ${escapeHtml(formatDate(post.createdAt))}</span>
        </div>
        <span class="feed-category">${escapeHtml(post.category || "Community")}</span>
      </div>
      ${group}
      ${image}
      <h1>${escapeHtml(post.title)}</h1>
      <p>${escapeHtml(post.body)}</p>
      ${reshared}
      ${linkPreview}
      <div class="feed-tags">${(post.tags || []).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>
      ${renderReactionBar(post)}
      <div class="feed-actions">
        ${post.linkUrl ? `<a class="button secondary" href="${escapeHtml(post.linkUrl)}" target="${post.linkUrl.startsWith("http") ? "_blank" : "_self"}" rel="noreferrer">Open shared link</a>` : ""}
        <button class="text-button" type="button" data-save-post="${escapeHtml(post.id)}" data-saved="${post.isSaved ? "true" : "false"}">
          ${post.isSaved ? "Saved" : "Save"} - ${Number(post.savedCount || 0).toLocaleString()}
        </button>
        <button class="text-button" type="button" data-copy-post-link>Copy post link</button>
        <a class="feed-link" href="community.html">Back to feed</a>
        <span>${Number(post.comments || 0).toLocaleString()} comments</span>
      </div>
      <section class="comment-drawer post-comments">
        <div class="section-heading">
          <p class="kicker">Conversation</p>
          <h2>Comments</h2>
        </div>
        <div class="comment-list">${renderComments()}</div>
        ${renderCommentComposer()}
      </section>
    </article>
    <aside class="community-panel post-detail-sidebar">
      <div class="section-heading">
        <p class="kicker">Keep Going</p>
        <h2>Related Posts</h2>
      </div>
      <div class="traffic-hooks">${renderRelatedPosts()}</div>
      <a class="button secondary" href="community-saved.html">Saved posts</a>
      <a class="button secondary" href="community-activity.html">Community activity</a>
    </aside>
  `;
}

async function loadPost() {
  const postId = selectedPostId();
  if (!postId) {
    postDetail.innerHTML = `<div class="index-message">No post selected.</div>`;
    return;
  }
  const response = await fetch(`/api/community/posts/${encodeURIComponent(postId)}?viewerId=${encodeURIComponent(viewerId)}`);
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Post could not be loaded.");
  activePost = result.data;
  comments = result.comments || [];
  relatedPosts = result.relatedPosts || [];
  renderPost();
}

postDetail?.addEventListener("click", async (event) => {
  const reactionButton = event.target.closest("[data-react-post]");
  const saveButton = event.target.closest("[data-save-post]");
  const copyButton = event.target.closest("[data-copy-post-link]");

  if (copyButton && activePost) {
    try {
      await navigator.clipboard.writeText(detailUrl());
      copyButton.textContent = "Copied";
    } catch (error) {
      copyButton.textContent = "Copy failed";
    }
    return;
  }

  if (reactionButton) {
    const postId = reactionButton.dataset.reactPost;
    const reaction = reactionButton.dataset.reaction || "like";
    const reacted = readStoredSet(reactionStorageKey);
    const key = reactionKey(postId, reaction);
    if (reacted.has(key)) return;
    reactionButton.disabled = true;
    try {
      const response = await fetch(`/api/community/feed/react?viewerId=${encodeURIComponent(viewerId)}`, {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ postId, reaction }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Reaction could not be saved.");
      activePost = { ...activePost, ...result.data };
      reacted.add(key);
      writeStoredSet(reactionStorageKey, reacted);
      if (reaction === "like") {
        const liked = readStoredSet(likedStorageKey);
        liked.add(postId);
        writeStoredSet(likedStorageKey, liked);
      }
      renderPost();
    } catch (error) {
      reactionButton.disabled = false;
    }
    return;
  }

  if (saveButton) {
    const postId = saveButton.dataset.savePost;
    const isSaved = saveButton.dataset.saved === "true";
    saveButton.disabled = true;
    try {
      const response = await fetch(`/api/community/feed/${isSaved ? "unsave" : "save"}?viewerId=${encodeURIComponent(viewerId)}`, {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ postId }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Saved post could not be updated.");
      activePost = { ...activePost, ...result.data };
      renderPost();
    } catch (error) {
      saveButton.disabled = false;
    }
  }
});

postDetail?.addEventListener("submit", async (event) => {
  const form = event.target.closest("#post-comment-form");
  if (!form || !activePost) return;
  event.preventDefault();
  const formData = new FormData(form);
  const button = form.querySelector("button");
  button.disabled = true;
  button.textContent = "Saving...";
  try {
    const response = await fetch("/api/community/comments", {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({
        postId: activePost.id,
        body: formData.get("body"),
      }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Comment could not be saved.");
    comments.push(result.data);
    activePost.comments = Number(activePost.comments || 0) + 1;
    form.reset();
    renderPost();
  } catch (error) {
    button.textContent = error.message?.includes("Log in") ? "Log in required" : "Try again";
  } finally {
    button.disabled = false;
    if (button.textContent === "Saving...") button.textContent = "Comment";
  }
});

loadPost().catch((error) => {
  postDetail.innerHTML = `<div class="index-message">${escapeHtml(error.message)}</div>`;
});

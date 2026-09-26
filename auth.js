const sessionStorageKey = "gcx-session-token-v1";
const refreshStorageKey = "gcx-refresh-token-v1";
const viewerStorageKey = "gcx-community-viewer-v1";
const sessionSavedAtStorageKey = "gcx-session-saved-at-v1";
const maxStoredSessionAgeMs = 1000 * 60 * 60 * 24 * 14;
const signupForm = document.querySelector("#signup-form");
const loginForm = document.querySelector("#login-form");
const forgotForm = document.querySelector("#forgot-form");
const resetPasswordForm = document.querySelector("#reset-password-form");
const signupStatus = document.querySelector("#signup-status");
const loginStatus = document.querySelector("#login-status");
const forgotStatus = document.querySelector("#forgot-status");
const resetPasswordStatus = document.querySelector("#reset-password-status");
const socialStatus = document.querySelector("#social-status");
const authNotice = document.querySelector("#auth-notice");
const authSession = document.querySelector("#auth-session");
const logoutButton = document.querySelector("#logout-button");
const queryParams = new URLSearchParams(window.location.search);
const nextPath = queryParams.get("next") || "";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function token() {
  if (storedSessionIsStale()) clearSession();
  return localStorage.getItem(sessionStorageKey) || "";
}

function refreshToken() {
  if (storedSessionIsStale()) clearSession();
  return localStorage.getItem(refreshStorageKey) || "";
}

function storedSessionIsStale(now = Date.now()) {
  const hasStoredToken = Boolean(localStorage.getItem(sessionStorageKey) || localStorage.getItem(refreshStorageKey));
  if (!hasStoredToken) return false;
  const savedAt = Number(localStorage.getItem(sessionSavedAtStorageKey) || 0);
  return !savedAt || now - savedAt > maxStoredSessionAgeMs;
}

function saveSession(result) {
  if (result.token) localStorage.setItem(sessionStorageKey, result.token);
  if (result.refreshToken) localStorage.setItem(refreshStorageKey, result.refreshToken);
  if (result.data?.profile?.id) localStorage.setItem(viewerStorageKey, result.data.profile.id);
  localStorage.setItem(sessionSavedAtStorageKey, String(Date.now()));
}

function clearSession() {
  localStorage.removeItem(sessionStorageKey);
  localStorage.removeItem(refreshStorageKey);
  localStorage.removeItem(viewerStorageKey);
  localStorage.removeItem(sessionSavedAtStorageKey);
}

function showAuthNotice(message, type = "info") {
  if (!authNotice) return;
  authNotice.textContent = message;
  authNotice.dataset.type = type;
  authNotice.hidden = false;
}

function saveSessionFromUrl() {
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const queryParams = new URLSearchParams(window.location.search);
  const accessToken = hashParams.get("access_token") || queryParams.get("access_token");
  const refresh = hashParams.get("refresh_token") || queryParams.get("refresh_token");
  const type = hashParams.get("type") || queryParams.get("type");
  const error = hashParams.get("error_description") || hashParams.get("error") || queryParams.get("error_description") || queryParams.get("error");

  if (error) {
    showAuthNotice(decodeURIComponent(error.replace(/\+/g, " ")), "error");
    window.history.replaceState({}, document.title, window.location.pathname);
    return false;
  }

  if (queryParams.get("confirmed") === "1") {
    showAuthNotice("Email confirmed. You can log in now.", "success");
    window.history.replaceState({}, document.title, window.location.pathname);
    return false;
  }

  if (!accessToken) return false;
  localStorage.setItem(sessionStorageKey, accessToken);
  if (refresh) localStorage.setItem(refreshStorageKey, refresh);
  localStorage.setItem(sessionSavedAtStorageKey, String(Date.now()));
  const isRecovery = queryParams.get("recovery") === "1" || type === "recovery";
  if (isRecovery && resetPasswordForm) resetPasswordForm.hidden = false;
  showAuthNotice(isRecovery ? "Password reset confirmed. Choose a new password below." : "Email confirmed. You are signed in.", "success");
  window.history.replaceState({}, document.title, window.location.pathname);
  return true;
}

function renderSession(payload) {
  if (!payload?.authenticated) {
    authSession.innerHTML = `<p class="muted-text">No one is logged in on this browser.</p>`;
    logoutButton.hidden = true;
    return;
  }
  const profile = payload.data.profile;
  authSession.innerHTML = `
    <div class="auth-profile-row">
      <img src="${escapeHtml(profile.avatarUrl)}" alt="${escapeHtml(profile.displayName)} avatar" />
      <div>
        <strong>${escapeHtml(profile.displayName)}</strong>
        <span>${escapeHtml(profile.handle)} - ${escapeHtml(payload.data.email)}</span>
      </div>
    </div>
  `;
  logoutButton.hidden = false;
}

async function loadSession() {
  if (!token()) {
    if (refreshToken()) clearSession();
    renderSession({ authenticated: false });
    return;
  }
  const response = await fetch("/api/auth/session", {
    headers: token() ? { "X-GCX-Session": token() } : {},
    cache: "no-store",
  });
  const result = await response.json();
  if (!result.authenticated && result.refreshAvailable && refreshToken()) {
    const refreshed = await refreshSession();
    if (refreshed) return loadSession();
  } else if (!result.authenticated && !result.refreshAvailable) {
    clearSession();
  }
  renderSession(result);
}

async function refreshSession() {
  try {
    const response = await fetch("/api/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: refreshToken() }),
    });
    const result = await response.json();
    if (!response.ok || !result.token) throw new Error(result.error || "Refresh failed.");
    saveSession(result);
    return true;
  } catch (error) {
    clearSession();
    return false;
  }
}

async function submitAuthForm(form, endpoint, statusNode) {
  statusNode.textContent = "Saving...";
  const data = Object.fromEntries(new FormData(form).entries());
  if (endpoint === "signup" && data.password !== data.confirmPassword) {
    statusNode.textContent = "Passwords do not match.";
    form.querySelector('input[name="confirmPassword"]')?.focus();
    return;
  }
  delete data.confirmPassword;
  try {
    const response = await fetch(`/api/auth/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Account request failed.");
    saveSession(result);
    statusNode.textContent = result.pendingConfirmation ? result.message || "Check your email to confirm your account." : endpoint === "signup" ? "Account created." : "Logged in.";
    form.reset();
    await loadSession();
    if (nextPath && !result.pendingConfirmation) window.location.href = nextPath;
  } catch (error) {
    statusNode.textContent = error.message;
  }
}

signupForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  submitAuthForm(signupForm, "signup", signupStatus);
});

loginForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  submitAuthForm(loginForm, "login", loginStatus);
});

forgotForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  forgotStatus.textContent = "Sending reset email...";
  const data = Object.fromEntries(new FormData(forgotForm).entries());
  try {
    const response = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Reset email could not be sent.");
    forgotStatus.textContent = result.message || "If that email has an account, a reset link is on the way.";
    forgotForm.reset();
  } catch (error) {
    forgotStatus.textContent = error.message;
  }
});

resetPasswordForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  resetPasswordStatus.textContent = "Updating password...";
  const data = Object.fromEntries(new FormData(resetPasswordForm).entries());
  if (data.password !== data.confirmPassword) {
    resetPasswordStatus.textContent = "Passwords do not match.";
    resetPasswordForm.querySelector('input[name="confirmPassword"]')?.focus();
    return;
  }

  try {
    const response = await fetch("/api/auth/update-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-GCX-Session": token(),
      },
      body: JSON.stringify({ password: data.password }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Password could not be updated.");
    resetPasswordStatus.textContent = result.message || "Password updated. You can keep using this account.";
    resetPasswordForm.reset();
    await loadSession();
  } catch (error) {
    resetPasswordStatus.textContent = error.message;
  }
});

document.querySelectorAll(".password-toggle").forEach((button) => {
  button.addEventListener("click", () => {
    const input = button.closest(".password-field")?.querySelector("input");
    if (!input) return;
    const isHidden = input.type === "password";
    input.type = isHidden ? "text" : "password";
    button.textContent = isHidden ? "Hide" : "Show";
    button.setAttribute("aria-label", isHidden ? "Hide password" : "Show password");
    button.title = isHidden ? "Hide password" : "Show password";
  });
});

document.querySelectorAll(".social-auth-button").forEach((button) => {
  button.addEventListener("click", () => {
    const provider = button.dataset.provider || "Social";
    socialStatus.textContent = `${provider} login is ready for the page design. We still need to enable that provider in Supabase before it can accept sign-ins.`;
  });
});

logoutButton?.addEventListener("click", async () => {
  await fetch("/api/auth/logout", {
    method: "POST",
    headers: token() ? { "X-GCX-Session": token() } : {},
  }).catch(() => {});
  clearSession();
  await loadSession();
});

saveSessionFromUrl();

loadSession().catch(() => {
  authSession.innerHTML = `<p class="muted-text">Session could not be loaded.</p>`;
});

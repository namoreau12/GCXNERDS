const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const communityDataPath = path.join(rootDir, "data", "community.json");
const base = process.env.GCX_AUDIT_BASE_URL || `http://localhost:${process.env.PORT || "3000"}`;

async function request(pathName, options = {}) {
  const response = await fetch(`${base}${pathName}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return {
    path: pathName,
    method: options.method || "GET",
    status: response.status,
    source: response.headers.get("x-gcx-data-source") || "",
    body,
  };
}

async function postJson(pathName, body, headers = {}) {
  return request(pathName, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

function assertStatus(result, expected, label) {
  if (result.status !== expected) {
    throw new Error(`${label} expected HTTP ${expected}, got ${result.status}`);
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function restoreCommunityData(snapshot) {
  if (snapshot === null) return;
  const tempPath = `${communityDataPath}.auth-audit-tmp`;
  fs.writeFileSync(tempPath, snapshot);
  fs.renameSync(tempPath, communityDataPath);
}

async function main() {
  const snapshot = fs.existsSync(communityDataPath) ? fs.readFileSync(communityDataPath, "utf8") : null;
  const stamp = Date.now();
  const email = `sessionsafety+${stamp}@example.com`;
  const password = `LaunchCheck${stamp}!`;
  const checks = [];

  try {
    const status = await request("/api/status");
    assertStatus(status, 200, "Status endpoint");
    const supabaseAuthEnabled = Boolean(status.body?.supabaseAuthEnabled);
    checks.push({ name: "status", status: status.status, supabaseAuthEnabled });

    const anonymousSession = await request("/api/auth/session");
    assertStatus(anonymousSession, 200, "Anonymous session check");
    assert(anonymousSession.body?.authenticated === false, "Anonymous session should not be authenticated.");
    checks.push({ name: "anonymous session", status: anonymousSession.status });

    const anonymousStaff = await request("/api/auth/staff-status");
    assertStatus(anonymousStaff, 200, "Anonymous staff status");
    assert(anonymousStaff.body?.staff === false, "Anonymous staff status should be false.");
    checks.push({ name: "anonymous staff status", status: anonymousStaff.status });

    const protectedChecks = [
      await request("/api/community/moderation"),
      await request("/api/community/sponsor-leads"),
      await request("/api/community/messages"),
      await request("/api/community/notifications"),
      await request("/api/community/saved-posts"),
      await postJson("/api/community/profiles", {
        displayName: "Anonymous Profile Spoof",
      }),
      await postJson("/api/community/groups/join", {
        profileId: "profile-gcx-member",
        groupId: "pokemon-collectors",
      }),
      await postJson("/api/community/groups/leave", {
        profileId: "profile-gcx-member",
        groupId: "pokemon-collectors",
      }),
      await postJson("/api/community/events", {
        title: "Anonymous Event",
        startsAt: new Date(Date.now() + 86400000).toISOString(),
        hostProfileId: "profile-gcx-member",
      }),
      await postJson("/api/community/events/rsvp", {
        eventId: "event-missing",
        profileId: "profile-gcx-member",
        status: "going",
      }),
      await postJson("/api/community/messages", {
        senderId: "profile-gcx-member",
        recipientId: "profile-gcx-member-2",
        body: "Anonymous spoof message",
      }),
      await postJson("/api/community/messages/read", {
        threadId: "thread-missing",
      }),
      await postJson("/api/community/notifications/read", {
        notificationId: "notification-missing",
      }),
      await postJson("/api/community/notifications/dismiss", {
        notificationId: "notification-missing",
      }),
      await postJson("/api/community/promotions", {
        sponsorName: "Session Safety Check",
        title: "Protected sponsor placement",
        destinationUrl: "https://gcxnerds.com",
      }),
      await postJson("/api/community/moderation/status", {
        targetType: "post",
        targetId: "missing",
        status: "published",
      }),
    ];

    protectedChecks.forEach((result) => {
      assert(result.status === 401, `${result.method} ${result.path} should reject anonymous access with 401, got ${result.status}.`);
      checks.push({ name: `${result.method} ${result.path}`, status: result.status });
    });

    const invalidSignup = await postJson("/api/auth/signup", {
      email: "not-an-email",
      password: "short",
      displayName: "",
    });
    assertStatus(invalidSignup, 400, "Invalid signup");
    checks.push({ name: "invalid signup", status: invalidSignup.status });

    const badLogin = await postJson("/api/auth/login", {
      email,
      password: "wrong-password",
    });
    assertStatus(badLogin, 401, "Bad login");
    checks.push({ name: "bad login", status: badLogin.status });

    if (!supabaseAuthEnabled) {
      const signup = await postJson("/api/auth/signup", {
        email,
        password,
        confirmPassword: password,
        displayName: "Session Safety Check",
        handle: `session-safety-check-${stamp}`,
      });
      assertStatus(signup, 201, "Local signup");
      assert(signup.body?.token, "Local signup should return a session token.");
      checks.push({ name: "local signup", status: signup.status, source: signup.source });

      const token = signup.body.token;
      const signedInSession = await request("/api/auth/session", {
        headers: { "X-GCX-Session": token },
      });
      assertStatus(signedInSession, 200, "Signed-in session");
      assert(signedInSession.body?.authenticated === true, "Signed-in session should authenticate.");
      checks.push({ name: "signed-in session", status: signedInSession.status });

      const memberStaff = await request("/api/auth/staff-status", {
        headers: { "X-GCX-Session": token },
      });
      assertStatus(memberStaff, 200, "Member staff status");
      assert(memberStaff.body?.staff === false, "New member should not be staff.");
      checks.push({ name: "member staff status", status: memberStaff.status });

      const forbiddenAdmin = await request("/api/community/moderation", {
        headers: { "X-GCX-Session": token },
      });
      assertStatus(forbiddenAdmin, 403, "Member moderation access");
      checks.push({ name: "member moderation rejected", status: forbiddenAdmin.status });

      const logout = await postJson("/api/auth/logout", {}, { "X-GCX-Session": token });
      assertStatus(logout, 200, "Logout");
      checks.push({ name: "logout", status: logout.status });

      const afterLogout = await request("/api/auth/session", {
        headers: { "X-GCX-Session": token },
      });
      assertStatus(afterLogout, 200, "Post-logout session check");
      assert(afterLogout.body?.authenticated === false, "Session should be invalid after logout.");
      checks.push({ name: "post-logout session", status: afterLogout.status });
    } else {
      checks.push({ name: "local signup flow", status: "skipped", detail: "Supabase Auth enabled on target server." });
    }

    console.log(
      JSON.stringify(
        {
          base,
          ok: true,
          checks,
          restoredAfterAudit: true,
        },
        null,
        2
      )
    );
  } finally {
    restoreCommunityData(snapshot);
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});

import "./style.css";
import "./admin.css";

const root = document.getElementById("admin-root");

const SCHEMAS = {
  facebook: {
    label: "Facebook Pages",
    accentClass: "fb",
    fields: [
      { key: "name", label: "Page name", type: "text" },
      { key: "handle", label: "Handle", type: "text", placeholder: "@handle" },
      { key: "url", label: "Page URL", type: "url" },
      { key: "followers", label: "Followers", type: "number" },
      { key: "reach", label: "Reach", type: "number" },
      { key: "likes", label: "Likes", type: "number" },
      { key: "posts", label: "Posts", type: "number" },
      { key: "engagementRate", label: "Engagement %", type: "number", step: "0.1" },
    ],
  },
  instagram: {
    label: "Instagram Accounts",
    accentClass: "ig",
    fields: [
      { key: "name", label: "Account name", type: "text" },
      { key: "handle", label: "Handle", type: "text", placeholder: "@handle" },
      { key: "url", label: "Profile URL", type: "url" },
      { key: "followers", label: "Followers", type: "number" },
      { key: "reach", label: "Reach", type: "number" },
      { key: "likes", label: "Likes", type: "number" },
      { key: "posts", label: "Posts", type: "number" },
      { key: "engagementRate", label: "Engagement %", type: "number", step: "0.1" },
    ],
  },
  ads: {
    label: "Meta Ads Accounts",
    accentClass: "ads",
    fields: [
      { key: "name", label: "Account name", type: "text" },
      { key: "accountId", label: "Ad Account ID", type: "text", placeholder: "act_000000000" },
      { key: "url", label: "Ads Manager URL", type: "url" },
      { key: "currency", label: "Currency", type: "text", placeholder: "USD" },
      { key: "spend", label: "Spend", type: "number" },
      { key: "impressions", label: "Impressions", type: "number" },
      { key: "clicks", label: "Clicks", type: "number" },
      { key: "ctr", label: "CTR %", type: "number", step: "0.1" },
      { key: "results", label: "Results", type: "number" },
      { key: "costPerResult", label: "Cost / Result", type: "number", step: "0.01" },
    ],
  },
};

let state = { facebook: [], instagram: [], ads: [] };
let dirty = false;

function randomId() {
  return "new-" + Math.random().toString(36).slice(2, 10);
}

function blankAccount(platform) {
  const acc = { id: randomId() };
  SCHEMAS[platform].fields.forEach((f) => {
    acc[f.key] = f.type === "number" ? 0 : "";
  });
  return acc;
}

function renderLogin(error) {
  root.innerHTML = `
    <div class="admin-shell admin-shell--center">
      <form id="login-form" class="admin-card login-card">
        <h1>softhash admin</h1>
        <p class="admin-sub">Enter the admin password to manage account &amp; ads data.</p>
        ${error ? `<p class="admin-error">${error}</p>` : ""}
        <input type="password" name="password" placeholder="Password" autocomplete="current-password" required />
        <button type="submit" class="admin-btn admin-btn--primary">Log in</button>
        <a class="admin-back" href="/">&larr; Back to site</a>
      </form>
    </div>
  `;

  document.getElementById("login-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const password = new FormData(e.target).get("password");
    const btn = e.target.querySelector("button");
    btn.disabled = true;
    btn.textContent = "Checking…";

    try {
      const res = await fetch("/api/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        renderLogin(data.error || "Login failed.");
        return;
      }
      await boot();
    } catch {
      renderLogin("Network error — try again.");
    }
  });
}

function fieldValue(acc, field) {
  const v = acc[field.key];
  return v === undefined || v === null ? "" : v;
}

function renderAccountCard(platform, acc) {
  const schema = SCHEMAS[platform];
  const fieldsHtml = schema.fields
    .map(
      (f) => `
      <label class="admin-field">
        <span>${f.label}</span>
        <input
          type="${f.type}"
          data-platform="${platform}"
          data-id="${acc.id}"
          data-key="${f.key}"
          value="${String(fieldValue(acc, f)).replace(/"/g, "&quot;")}"
          placeholder="${f.placeholder || ""}"
          ${f.step ? `step="${f.step}"` : ""}
        />
      </label>`
    )
    .join("");

  return `
    <div class="admin-account-card ${schema.accentClass}" data-platform="${platform}" data-id="${acc.id}">
      <div class="admin-account-fields">${fieldsHtml}</div>
      <button type="button" class="admin-btn admin-btn--danger admin-delete" data-platform="${platform}" data-id="${acc.id}">
        Remove
      </button>
    </div>
  `;
}

function renderPlatformSection(platform) {
  const schema = SCHEMAS[platform];
  const items = state[platform] || [];
  return `
    <section class="admin-section">
      <div class="admin-section-head">
        <h2>${schema.label}</h2>
        <button type="button" class="admin-btn admin-add" data-platform="${platform}">+ Add account</button>
      </div>
      <div class="admin-account-grid" data-grid="${platform}">
        ${items.map((acc) => renderAccountCard(platform, acc)).join("") || `<p class="admin-empty">No accounts yet — click "Add account".</p>`}
      </div>
    </section>
  `;
}

function renderDashboard(message) {
  root.innerHTML = `
    <div class="admin-shell">
      <header class="admin-top">
        <div>
          <h1>softhash admin</h1>
          <p class="admin-sub">Edit live stats. Changes go out as soon as you save.</p>
        </div>
        <div class="admin-top-actions">
          <a class="admin-back" href="/" target="_blank">View site ↗</a>
          <button type="button" id="logout-btn" class="admin-btn">Log out</button>
        </div>
      </header>

      ${message ? `<p class="admin-banner">${message}</p>` : ""}

      <div id="sections">
        ${renderPlatformSection("facebook")}
        ${renderPlatformSection("instagram")}
        ${renderPlatformSection("ads")}
      </div>

      <div class="admin-save-bar">
        <span id="dirty-indicator" class="${dirty ? "dirty" : ""}">${dirty ? "Unsaved changes" : "All changes saved"}</span>
        <button type="button" id="save-btn" class="admin-btn admin-btn--primary">Save changes</button>
      </div>
    </div>
  `;

  wireDashboardEvents();
}

function wireDashboardEvents() {
  root.querySelectorAll(".admin-account-fields input").forEach((input) => {
    input.addEventListener("input", (e) => {
      const { platform, id, key } = e.target.dataset;
      const acc = state[platform].find((a) => a.id === id);
      if (!acc) return;
      const field = SCHEMAS[platform].fields.find((f) => f.key === key);
      acc[key] = field.type === "number" ? Number(e.target.value) : e.target.value;
      markDirty();
    });
  });

  root.querySelectorAll(".admin-delete").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const { platform, id } = e.target.dataset;
      state[platform] = state[platform].filter((a) => a.id !== id);
      markDirty();
      renderDashboard();
    });
  });

  root.querySelectorAll(".admin-add").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const { platform } = e.target.dataset;
      state[platform] = [...(state[platform] || []), blankAccount(platform)];
      markDirty();
      renderDashboard();
    });
  });

  document.getElementById("logout-btn").addEventListener("click", async () => {
    await fetch("/api/admin-logout", { method: "POST" });
    renderLogin();
  });

  document.getElementById("save-btn").addEventListener("click", saveChanges);
}

function markDirty() {
  dirty = true;
  const indicator = document.getElementById("dirty-indicator");
  if (indicator) {
    indicator.textContent = "Unsaved changes";
    indicator.classList.add("dirty");
  }
}

async function saveChanges() {
  const btn = document.getElementById("save-btn");
  btn.disabled = true;
  btn.textContent = "Saving…";

  try {
    const res = await fetch("/api/accounts", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(state),
    });

    if (res.status === 401) {
      renderLogin("Your session expired — log in again.");
      return;
    }

    if (!res.ok) {
      throw new Error("Save failed");
    }

    state = await res.json();
    dirty = false;
    renderDashboard("Saved. The live site now reflects these numbers.");
  } catch {
    btn.disabled = false;
    btn.textContent = "Save changes";
    const indicator = document.getElementById("dirty-indicator");
    if (indicator) indicator.textContent = "Save failed — try again";
  }
}

async function boot() {
  const sessionRes = await fetch("/api/admin-session");
  const session = await sessionRes.json();

  if (!session.authenticated) {
    renderLogin();
    return;
  }

  const dataRes = await fetch("/api/accounts");
  state = await dataRes.json();
  dirty = false;
  renderDashboard();
}

boot();

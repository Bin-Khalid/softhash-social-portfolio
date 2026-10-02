import { getData, saveData } from "../lib/store.js";
import { isAuthenticated } from "../lib/auth.js";

const PLATFORMS = ["facebook", "instagram", "linkedin", "ads"];

function randomId() {
  return Math.random().toString(36).slice(2, 10);
}

function sanitizeAccount(raw, platform) {
  const base = {
    id: typeof raw.id === "string" && raw.id ? raw.id : randomId(),
    name: String(raw.name || "").trim(),
    url: String(raw.url || "").trim(),
  };

  if (platform === "ads") {
    return {
      ...base,
      accountId: String(raw.accountId || "").trim(),
      currency: String(raw.currency || "USD").trim(),
      spend: Number(raw.spend) || 0,
      impressions: Number(raw.impressions) || 0,
      clicks: Number(raw.clicks) || 0,
      ctr: Number(raw.ctr) || 0,
      results: Number(raw.results) || 0,
      costPerResult: Number(raw.costPerResult) || 0,
    };
  }

  return {
    ...base,
    handle: String(raw.handle || "").trim(),
    followers: Number(raw.followers) || 0,
    posts: Number(raw.posts) || 0,
    likes: Number(raw.likes) || 0,
    engagementRate: Number(raw.engagementRate) || 0,
    reach: Number(raw.reach) || 0,
  };
}

function sanitizePayload(body) {
  const out = {};
  for (const platform of PLATFORMS) {
    const list = Array.isArray(body[platform]) ? body[platform] : [];
    out[platform] = list
      .filter((a) => a && typeof a === "object")
      .map((a) => sanitizeAccount(a, platform));
  }
  return out;
}

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const data = await getData();
      return res.status(200).json(data);
    } catch (err) {
      console.error("Failed to load accounts:", err);
      return res.status(500).json({ error: "Failed to load data." });
    }
  }

  if (req.method === "PUT") {
    if (!isAuthenticated(req)) {
      return res.status(401).json({ error: "Not authenticated." });
    }

    const body = req.body || {};
    if (!PLATFORMS.some((p) => Array.isArray(body[p]))) {
      return res.status(400).json({ error: "Invalid payload." });
    }

    try {
      const clean = sanitizePayload(body);
      await saveData(clean);
      return res.status(200).json(clean);
    } catch (err) {
      console.error("Failed to save accounts:", err);
      return res.status(500).json({ error: "Failed to save data." });
    }
  }

  res.setHeader("Allow", "GET, PUT");
  return res.status(405).json({ error: "Method not allowed" });
}

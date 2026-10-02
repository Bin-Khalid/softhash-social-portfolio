// Local-only stand-in for Vercel's serverless function runtime, so
// `npm run dev` can exercise /api/*.js without needing the Vercel CLI
// or a deployed project. Not used in production — Vercel runs the
// files in api/ directly.
import http from "node:http";
import { URL } from "node:url";
import "dotenv/config";

const PORT = process.env.LOCAL_API_PORT || 3001;

const routes = {
  "/api/accounts": () => import("../api/accounts.js"),
  "/api/admin-login": () => import("../api/admin-login.js"),
  "/api/admin-logout": () => import("../api/admin-logout.js"),
  "/api/admin-session": () => import("../api/admin-session.js"),
};

function readBody(req) {
  return new Promise((resolve) => {
    let raw = "";
    req.on("data", (chunk) => (raw += chunk));
    req.on("end", () => resolve(raw));
  });
}

function makeResShim(res) {
  const headers = {};
  return {
    statusCode: 200,
    status(code) {
      this.statusCode = code;
      return this;
    },
    setHeader(key, value) {
      headers[key] = value;
    },
    json(obj) {
      res.writeHead(this.statusCode, {
        "Content-Type": "application/json",
        ...headers,
      });
      res.end(JSON.stringify(obj));
    },
    end(data) {
      res.writeHead(this.statusCode, headers);
      res.end(data);
    },
  };
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const loader = routes[url.pathname];

  if (!loader) {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found" }));
    return;
  }

  const raw = await readBody(req);
  try {
    req.body = raw ? JSON.parse(raw) : {};
  } catch {
    req.body = {};
  }
  req.query = Object.fromEntries(url.searchParams);

  const resShim = makeResShim(res);

  try {
    const mod = await loader();
    await mod.default(req, resShim);
  } catch (err) {
    console.error(`[local-api] ${url.pathname} failed:`, err);
    resShim.status(500).json({ error: "Internal error" });
  }
});

server.listen(PORT, () => {
  console.log(`Local API shim ready on http://localhost:${PORT}`);
});

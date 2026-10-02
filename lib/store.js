import Redis from "ioredis";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { defaultData } from "./defaultData.js";

const KEY = "softhash:accounts";
const REDIS_URL = process.env.REDIS_URL;

// Reused across warm serverless invocations in the same container —
// don't open a new TCP connection on every request.
let client = null;

function getRedis() {
  if (!REDIS_URL) return null;
  if (!client) {
    client = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 2,
      connectTimeout: 5000,
      lazyConnect: false,
    });
    client.on("error", (err) => {
      console.error("Redis connection error:", err.message);
    });
  }
  return client;
}

// Local-only fallback so `npm run dev` works before a Redis store is
// connected. Never used in production once REDIS_URL is set.
const LOCAL_FILE = path.join(process.cwd(), ".data", "accounts.local.json");

async function readLocalFile() {
  try {
    const raw = await readFile(LOCAL_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function writeLocalFile(data) {
  await mkdir(path.dirname(LOCAL_FILE), { recursive: true });
  await writeFile(LOCAL_FILE, JSON.stringify(data, null, 2), "utf-8");
}

export function isUsingRealStore() {
  return Boolean(REDIS_URL);
}

export async function getData() {
  const redis = getRedis();
  if (redis) {
    const raw = await redis.get(KEY);
    if (raw) return JSON.parse(raw);
    await redis.set(KEY, JSON.stringify(defaultData));
    return defaultData;
  }

  const local = await readLocalFile();
  if (local) return local;
  await writeLocalFile(defaultData);
  return defaultData;
}

export async function saveData(data) {
  const redis = getRedis();
  if (redis) {
    await redis.set(KEY, JSON.stringify(data));
    return;
  }
  await writeLocalFile(data);
}

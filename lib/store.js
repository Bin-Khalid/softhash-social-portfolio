import { Redis } from "@upstash/redis";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { defaultData } from "./defaultData.js";

const KEY = "softhash:accounts";

// Vercel's Redis/KV marketplace integrations inject one of these pairs
// depending on which product was connected.
const REST_URL =
  process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const REST_TOKEN =
  process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = REST_URL && REST_TOKEN
  ? new Redis({ url: REST_URL, token: REST_TOKEN })
  : null;

// Local-only fallback so `vercel dev` / `vite dev` work before a Redis
// store is connected. Never used in production once env vars are set.
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
  return Boolean(redis);
}

export async function getData() {
  if (redis) {
    const data = await redis.get(KEY);
    if (data) return data;
    await redis.set(KEY, defaultData);
    return defaultData;
  }

  const local = await readLocalFile();
  if (local) return local;
  await writeLocalFile(defaultData);
  return defaultData;
}

export async function saveData(data) {
  if (redis) {
    await redis.set(KEY, data);
    return;
  }
  await writeLocalFile(data);
}

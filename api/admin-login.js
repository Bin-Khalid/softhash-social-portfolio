import { checkPassword, createSessionCookie } from "../lib/auth.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { password } = req.body || {};

  if (!checkPassword(password)) {
    return res.status(401).json({ error: "Incorrect password." });
  }

  try {
    res.setHeader("Set-Cookie", createSessionCookie());
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Login failed:", err);
    return res.status(500).json({ error: "Server misconfiguration." });
  }
}

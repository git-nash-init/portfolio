import type { VercelRequest, VercelResponse } from "@vercel/node";
import { proxyGithub } from "./_github.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const url = new URL(req.url || "/", "http://x");
  const path = url.searchParams.get("path") || "";
  if (!path) {
    res.status(400).json({ error: "missing_path" });
    return;
  }

  const passthrough = new URLSearchParams();
  url.searchParams.forEach((v, k) => { if (k !== "path") passthrough.append(k, v); });
  const qs = passthrough.toString();

  try {
    const out = await proxyGithub(`${path}${qs ? "?" + qs : ""}`, req.headers["accept"] as string | undefined, process.env.GITHUB_TOKEN || "");
    res.status(out.status);
    res.setHeader("content-type", out.contentType);
    res.setHeader("cache-control", "public, s-maxage=300, stale-while-revalidate=600");
    res.send(out.body);
  } catch (err) {
    res.status(502).json({ error: "proxy_failed", detail: String(err) });
  }
}

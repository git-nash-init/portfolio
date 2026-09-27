// Keep in sync with GH_USER in src/lib/github.ts (not imported: Vercel functions resolve imports at runtime).
const GH_USER = "git-nash-init";

export type ProxyResult = { status: number; contentType: string; body: Buffer };

const OWNER = GH_USER.toLowerCase();

function json(status: number, data: unknown): ProxyResult {
  return { status, contentType: "application/json", body: Buffer.from(JSON.stringify(data)) };
}

// The token may carry `repo` scope (needed for private counts), so only the exact
// endpoints the site uses are reachable — never private repo names or contents.
export async function proxyGithub(pathWithQuery: string, accept: string | undefined, token: string): Promise<ProxyResult> {
  const [rawPath, query = ""] = pathWithQuery.replace(/^\/+/, "").split("?");
  const parts = rawPath.split("/").filter(Boolean).map((p) => decodeURIComponent(p));
  const lower = parts.map((p) => p.toLowerCase());

  const headers: Record<string, string> = {
    Accept: accept || "application/vnd.github+json",
    "User-Agent": "avinash-portfolio-proxy",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const gh = (p: string, h = headers) => fetch(`https://api.github.com/${p}`, { headers: h });

  const passthrough = async (res: Response): Promise<ProxyResult> => ({
    status: res.status,
    contentType: res.headers.get("content-type") || "application/json",
    body: Buffer.from(await res.arrayBuffer()),
  });

  // users/{owner} and users/{owner}/repos — public data only (that endpoint never lists private repos).
  if (lower[0] === "users" && lower[1] === OWNER && parts.length === 2) {
    return passthrough(await gh(`users/${GH_USER}`));
  }
  if (lower[0] === "users" && lower[1] === OWNER && lower[2] === "repos" && parts.length === 3) {
    return passthrough(await gh(`users/${GH_USER}/repos${query ? `?${query}` : ""}`));
  }

  // user — authenticated profile, reduced to the private repo count.
  if (lower[0] === "user" && parts.length === 1) {
    if (!token) return json(200, { login: null, total_private_repos: null });
    const res = await gh("user", { ...headers, Accept: "application/vnd.github+json" });
    if (!res.ok) return json(res.status, { error: "upstream_error" });
    const me = await res.json();
    return json(200, { login: me.login, total_private_repos: me.total_private_repos ?? null });
  }

  // repos/{owner}/{name}/readme — only for public repos.
  if (lower[0] === "repos" && lower[1] === OWNER && parts.length === 4 && lower[3] === "readme") {
    const name = encodeURIComponent(parts[2]);
    const meta = await gh(`repos/${GH_USER}/${name}`, { ...headers, Accept: "application/vnd.github+json" });
    if (!meta.ok) return json(meta.status, { error: "not_found" });
    const repo = await meta.json();
    if (repo.private) return json(404, { error: "not_found" });
    return passthrough(await gh(`repos/${GH_USER}/${name}/readme`));
  }

  return json(403, { error: "path_not_allowed" });
}

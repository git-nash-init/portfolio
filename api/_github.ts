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

  // users/{owner} — public profile only.
  if (lower[0] === "users" && lower[1] === OWNER && parts.length === 2) {
    return passthrough(await gh(`users/${GH_USER}`));
  }

  // users/{owner}/repos — public repos, plus the owner's private repos merged in (if the
  // token belongs to the owner). Every repo is reduced to a fixed, safe field set, and
  // private entries never carry html_url/stars/forks, so the source is never reachable
  // and no private detail beyond name/description/live-link/language leaves this proxy.
  if (lower[0] === "users" && lower[1] === OWNER && lower[2] === "repos" && parts.length === 3) {
    const publicRes = await gh(`users/${GH_USER}/repos${query ? `?${query}` : ""}`);
    if (!publicRes.ok) return passthrough(publicRes);
    const publicRepos = await publicRes.json();
    const merged: any[] = Array.isArray(publicRepos) ? publicRepos.slice() : [];

    if (token) {
      try {
        const meRes = await gh("user", { ...headers, Accept: "application/vnd.github+json" });
        if (meRes.ok) {
          const me = await meRes.json();
          if (me?.login?.toLowerCase() === OWNER) {
            const qs = new URLSearchParams(query);
            qs.set("visibility", "all");
            qs.set("affiliation", "owner");
            if (!qs.has("per_page")) qs.set("per_page", "100");
            if (!qs.has("sort")) qs.set("sort", "updated");
            const allRes = await gh(`user/repos?${qs.toString()}`, { ...headers, Accept: "application/vnd.github+json" });
            if (allRes.ok) {
              const allRepos = await allRes.json();
              if (Array.isArray(allRepos)) {
                const existingIds = new Set(merged.map((r) => r.id));
                for (const r of allRepos) {
                  if (r.private && r.owner?.login?.toLowerCase() === OWNER && !existingIds.has(r.id)) {
                    merged.push(r);
                  }
                }
              }
            }
          }
        }
      } catch {
        // Any failure here just means private repos are skipped; the public list still returns.
      }
    }

    const sanitized = merged
      .map((r) => {
        const isPrivate = !!r.private;
        return {
          id: r.id,
          name: r.name,
          description: r.description ?? null,
          html_url: isPrivate ? "" : r.html_url,
          homepage: r.homepage ?? null,
          stargazers_count: isPrivate ? 0 : r.stargazers_count ?? 0,
          forks_count: isPrivate ? 0 : r.forks_count ?? 0,
          language: r.language ?? null,
          topics: Array.isArray(r.topics) ? r.topics : [],
          pushed_at: r.pushed_at,
          fork: !!r.fork,
          archived: !!r.archived,
          private: isPrivate,
          default_branch: r.default_branch ?? "main",
        };
      })
      .sort((a, b) => new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime());
    return json(200, sanitized);
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

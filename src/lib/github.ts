export const GH_USER = "git-nash-init";

export type Repo = {
  id: number;
  name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  topics: string[];
  pushed_at: string;
  fork: boolean;
  archived: boolean;
  private: boolean;
  default_branch: string;
};

export const LANG_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python: "#3572A5",
  Go: "#00ADD8",
  Lua: "#000080",
  Shell: "#89e051",
  CSS: "#563d7c",
  HTML: "#e34c26",
  Rust: "#dea584",
  Vue: "#41b883",
  C: "#555555",
  "C++": "#f34b7d",
  Java: "#b07219",
  Dockerfile: "#384d54",
};

export function rewriteGithubImage(url: string, repo: string, branch = "main"): string {
  if (!url) return url;
  if (url.startsWith("//")) url = "https:" + url;
  if (/^https?:\/\/github\.com\/[^/]+\/[^/]+\/raw\//i.test(url)) {
    return url.replace("/raw/", "/").replace("github.com", "raw.githubusercontent.com");
  }
  if (url.startsWith("./") || url.startsWith("/") || !/^https?:/i.test(url)) {
    const cleaned = url.replace(/^\.?\//, "");
    return `https://raw.githubusercontent.com/${GH_USER}/${repo}/${branch}/${cleaned}`;
  }
  return url;
}

type ReadmeImage = { url: string; width: number; height: number; index: number; alt: string; isBadge: boolean };

const BADGE_HOSTS = /(shields\.io|img\.shields|badgen\.net|badge\.fury|forthebadge|api\.netlify|app\.codacy|github\.com\/[^/]+\/[^/]+\/actions|github\.com\/[^/]+\/[^/]+\/workflows)/i;
const LOGO_HINT = /(logo|icon|avatar|favicon|badge)/i;
const PREVIEW_HINT = /(preview|screenshot|screen-?shot|demo|banner|hero|cover|showcase|thumb)/i;

function parseDim(v?: string): number {
  if (!v) return 0;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}

export function extractReadmeImage(markdown: string, repo: string, branch: string): string | null {
  const candidates: ReadmeImage[] = [];

  const htmlRe = /<img\b([^>]+)>/gi;
  let m: RegExpExecArray | null;
  while ((m = htmlRe.exec(markdown)) !== null) {
    const attrs = m[1];
    const srcMatch = attrs.match(/\bsrc\s*=\s*["']([^"']+)["']/i);
    if (!srcMatch) continue;
    const url = srcMatch[1].trim();
    const widthMatch = attrs.match(/\bwidth\s*=\s*["']?(\d+(?:\.\d+)?)/i);
    const heightMatch = attrs.match(/\bheight\s*=\s*["']?(\d+(?:\.\d+)?)/i);
    const altMatch = attrs.match(/\balt\s*=\s*["']([^"']*)["']/i);
    candidates.push({
      url, width: parseDim(widthMatch?.[1]), height: parseDim(heightMatch?.[1]),
      index: m.index, alt: altMatch?.[1] || "", isBadge: BADGE_HOSTS.test(url),
    });
  }

  const mdRe = /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
  while ((m = mdRe.exec(markdown)) !== null) {
    const url = m[2].trim();
    candidates.push({
      url, width: 0, height: 0, index: m.index, alt: m[1] || "",
      isBadge: BADGE_HOSTS.test(url),
    });
  }

  const usable = candidates.filter((c) => !c.isBadge);
  if (usable.length === 0) return null;

  function score(c: ReadmeImage): number {
    let s = 0;
    const area = c.width * c.height;
    if (area >= 300 * 300) s += 50;
    else if (area >= 200 * 200) s += 25;
    else if (area > 0 && area < 200 * 200) s -= 40;
    if (c.width > 0 && c.height > 0 && c.width / c.height > 1.6) s += 30;
    if (LOGO_HINT.test(c.url) || LOGO_HINT.test(c.alt)) s -= 40;
    if (PREVIEW_HINT.test(c.url) || PREVIEW_HINT.test(c.alt)) s += 80;
    const before = markdown.slice(Math.max(0, c.index - 240), c.index).toLowerCase();
    if (/(##\s*)(preview|screenshot|demo|showcase|gallery)/i.test(before)) s += 60;
    s -= c.index / 5000;
    return s;
  }

  usable.sort((a, b) => score(b) - score(a));
  return rewriteGithubImage(usable[0].url, repo, branch);
}

const readmeCache = new Map<string, Promise<string | null>>();

export function fetchReadmePreview(repo: Repo): Promise<string | null> {
  if (readmeCache.has(repo.name)) return readmeCache.get(repo.name)!;
  const p = (async () => {
    try {
      const res = await fetch(`/api/gh/repos/${GH_USER}/${repo.name}/readme`, {
        headers: { Accept: "application/vnd.github.raw" },
      });
      if (!res.ok) return null;
      const text = await res.text();
      return extractReadmeImage(text, repo.name, repo.default_branch || "main");
    } catch {
      return null;
    }
  })();
  readmeCache.set(repo.name, p);
  return p;
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return "today";
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

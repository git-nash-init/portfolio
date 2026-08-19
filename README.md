# Avinash Thakur — Portfolio (v2)

Cinematic personal portfolio. Vite + React + TypeScript SPA, deployed on Vercel at [avinashthakur.com](https://avinashthakur.com).

### Stack

- Vite 6, React 18, TypeScript
- `wouter` for client-side routing (`/`, `/projects`)
- Lanyard API (Discord presence) + LeetCode stats API
- GitHub REST API via a server-side proxy (token never leaves the server)
  - Dev: Vite middleware plugin in `vite.config.ts`
  - Prod: Vercel function at `api/gh.ts`
- Web3Forms for the contact inquiry form · Cal.com for booking

## Run

```bash
npm install
echo "GITHUB_TOKEN=ghp_xxx" > .env   # personal access token, repo:read scope
npm run dev
```

Then open <http://localhost:5173>.

## Scripts

- `npm run dev` — start Vite dev server with the GitHub proxy
- `npm run build` — production build to `dist/public`
- `npm run serve` — preview the built bundle
- `npm run typecheck` — `tsc --noEmit`

## Structure

```
src/
  components/Portfolio.tsx   # main page (hero, about, live, projects, shipped, journey, skills, contact)
  components/portfolio.css   # all cinematic styling
  pages/Projects.tsx         # /projects — full GitHub archive with hover README previews
  lib/github.ts              # GH types, README image extractor, language colors
  lib/skills.ts              # skill list + icon URLs (devicon / simpleicons)
  lib/seo.ts                 # per-route meta hook
api/gh.ts                    # Vercel proxy for GitHub API
api/leetcode.ts              # LeetCode stats proxy
vite.config.ts               # also hosts the dev-time GitHub proxy
```

## TODO before deploy

- Set `DISCORD_USER_ID` in `src/components/Portfolio.tsx` and join `discord.gg/lanyard`
- Set `WEB3FORMS_ACCESS_KEY` in `src/components/Portfolio.tsx` (free key at web3forms.com)
- Set `GITHUB_TOKEN` in Vercel project env (read-only scope)
- Replace placeholder images in `public/` (logo, opengraph, education logos)

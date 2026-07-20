---
name: verify
description: How to run and drive the RESTHRU Next.js app for verification — launch, auth via server actions from curl, gotchas.
---

# Verifying RESTHRU

## Launch
- `npm run dev` (Next 15 + turbopack, port 3000). Wait for `curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/owner/login` → 200 (first compile takes ~60–90s).
- DB is a remote Neon Postgres (`DATABASE_URL` in `.env`). JWT secret in `.env` (`JWT_SECRET`).

## Gotcha: Prisma "URL must start with prisma://" (P6001)
If every DB query fails with that error, the generated client in
`node_modules/.prisma/client` was built in no-engine/Accelerate mode
(`copyEngine": false` in its index.js). Fix: `npx prisma generate`, then
restart the dev server (it caches the old client in-process).

## Auth surfaces
- Portal areas: `/superadmin` (SUPER_ADMIN/ADMIN), `/owner` (RESTAURANT_OWNER/STAFF), `/reception` (RECEPTIONIST), `/order` (WAITER).
- Sessions are per-portal cookies: `session_admin`, `session_owner`, `session_reception`, `session_waiter` (see lib/auth.ts, proxy.ts). Independent — one browser can hold all four.
- Seeded admin credentials (prisma/seed.ts): `admin` / `admin@123`. The seeded restaurant owner has role `OWNER` which no layout accepts — don't use it; create disposable `verify.tmp.*@gmail.com` users via a prisma script instead and delete them after.

## Driving server actions from curl
There are no REST auth endpoints — login/logout are server actions.
1. Get live action IDs (the on-disk `.next/server/server-reference-manifest.json` is STALE under turbopack dev — don't trust it). Instead fetch the page HTML, download its non-node_modules JS chunks, and grep: `grep -oE '"[0-9a-f]{40,44}":\{"name":"[^"]*"\}' chunks.js` — maps id → exported action name.
2. Call: `curl -s -D - http://localhost:3000/<page-with-action> -H 'Next-Action: <id>' -H 'Content-Type: text/plain;charset=UTF-8' --data '[<json args>]'`. Response body contains the action's return JSON; `Set-Cookie` shows session effects.
   - login args: `["<email>","<password>",null,{"blockAdmin":true}]` (staff doors) or `{"adminConsole":true}` (superadmin). logout args: `[]`.
   - The page you POST to matters: middleware stamps `x-pathname`, which logout uses to pick which portal cookie to clear.
3. Node scripts that use project deps: `NODE_PATH="<repo>/node_modules" node --env-file=.env script.js`.

# CLAUDE.md

Palworld Server Manager - a web dashboard for managing Palworld dedicated game servers via the Palworld REST API.

## Development Commands

```bash
pnpm dev          # Start dev server (Vite) - proxies /api/* to localhost:8212
pnpm build        # TypeScript compile + production build
pnpm lint         # ESLint
pnpm preview      # Preview production build
```

There is no test script.

Docker:
```bash
docker build -t palworld-manager .
docker-compose up   # Local testing
```

## API and auth

- `src/lib/api.ts` holds all Palworld REST calls; `src/hooks/use-palworld.ts` wraps them in SWR hooks.
- Auth: `Authorization: Basic admin:<password>` (base64).
- API proxy: `/api/v1/api/*` routes to the Palworld server (port 8212).

## Development Notes

- Dev API access may require SSH tunneling: `ssh -L 8212:172.18.0.2:8212 <host> -N`
- Password stored in sessionStorage (cleared on tab close)
- SWR refresh: 10s for metrics/players, 30s for settings, 3s for the map
- Path alias: `@/*` maps to `./src/*`

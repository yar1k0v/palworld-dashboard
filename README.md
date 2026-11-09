# Palworld Server Manager

Web dashboard for Palworld dedicated servers. It talks to the official [REST API](https://docs.palworldgame.com/category/rest-api/).

[![CI](https://github.com/yar1k0v/palworld-dashboard/actions/workflows/ci.yml/badge.svg)](https://github.com/yar1k0v/palworld-dashboard/actions/workflows/ci.yml)
[![Docker image](https://github.com/yar1k0v/palworld-dashboard/actions/workflows/docker-publish.yml/badge.svg)](https://github.com/yar1k0v/palworld-dashboard/actions/workflows/docker-publish.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-green)](LICENSE)

<!-- Add screenshots: docs/dashboard.png, docs/players.png, docs/map.png -->

## Features

- **Dashboard**: server status, FPS, uptime, player count, in-game days
- **Players**: online list, kick, ban, unban
- **Live map**: player positions and fast travel towers, Palpagos and World Tree (tiles are optional, see [World map](#world-map))
- **Server control**: broadcast message, save world, graceful shutdown, force stop
- **Settings viewer**: read-only server configuration
- **UI**: dark and light theme, mobile layout

## Quick start

Enable the API on the game server, in `PalWorldSettings.ini`:

```ini
RESTAPIEnabled=True
RESTAPIPort=8212
AdminPassword=<your password>
```

Run the dashboard:

```bash
docker run -d --name palworld-manager -p 3000:80 \
  -e API_BACKEND_URL=http://your-palworld-server:8212 \
  ghcr.io/yar1k0v/palworld-dashboard:latest
```

Open `http://localhost:3000` and enter the admin password. The user name is always `admin`.

Compose file: [`docker-compose.yml`](docker-compose.yml).

| Variable | Default | Meaning |
|---|---|---|
| `API_BACKEND_URL` | `http://localhost:8212` | Palworld REST API base URL, no trailing slash |

## World map

The Map page needs tiles. The repo does not ship them because the artwork belongs to Pocketpair. Generate them from your own Palworld install (Windows, Steam):

```bash
pip install Pillow
python tools/make_tiles.py
```

- Output: `public/tiles` and `public/tiles-tree` (git-ignored)
- Pass `--pak "<path>\Pal-Windows.pak"` if Palworld is not in `C:\Games\Steam`
- Pass `--oodle <path>` to an `oo2core_*_win64.dll` if the script finds none. Any installed game that ships one works.
- Without tiles, the page shows a notice and the players still show on a blank map

Docker mounts the tiles read-only:

```bash
docker run ... \
  -v ./public/tiles:/usr/share/nginx/html/tiles:ro \
  -v ./public/tiles-tree:/usr/share/nginx/html/tiles-tree:ro ...
```

## Development

Needs Node.js 20+ and pnpm 10.

```bash
pnpm install
pnpm dev        # http://localhost:5173, proxies /api/* to localhost:8212
pnpm lint
pnpm build
```

Remote server: tunnel the API port first.

```bash
ssh -L 8212:localhost:8212 user@your-server -N
```

Stack: React 19, TypeScript, Vite, Zustand, SWR, Tailwind CSS 4, shadcn/ui, Leaflet. Served by nginx.

## Security

- ⚠ The dashboard grants full admin control. Anyone who reaches it and knows the password controls the server.
- ⚠ The Palworld REST API is not built for the open internet. Keep it on a LAN or behind a VPN.
- Use HTTPS in front of the dashboard. Basic Auth sends the password on every request.
- The browser keeps the password in `sessionStorage` until the tab closes.

Report vulnerabilities as described in [SECURITY.md](SECURITY.md).

## Compatibility

Field names follow the Palworld REST API docs v1.0.4 (game patch 1.0.5 is current). Not yet verified against a live 1.0.x server. Open an issue if a field differs.

## Disclaimer

Unofficial fan project. Not affiliated with or endorsed by Pocketpair, Inc. Palworld and its artwork belong to Pocketpair, Inc.

## License

[MIT](LICENSE). The license covers this code, not game assets.

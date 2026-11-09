# Contributing

```bash
pnpm install
pnpm lint && pnpm build   # both must pass, CI runs them
```

- Open an issue before a large change.
- Keep one topic per pull request.
- Never commit game assets: tiles, icons, logos, extracted textures. Use `tools/make_tiles.py` locally.
- No test suite exists yet. Describe how you tested a change in the PR.
- API field names must match the [Palworld REST docs](https://docs.palworldgame.com/category/rest-api/).

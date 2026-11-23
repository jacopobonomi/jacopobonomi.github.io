## Starting

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
npm run dev
```

## Building

```bash
npm run build
```

```bash
> You can preview the built app with `npm run preview`, regardless of whether you installed an adapter. This should _not_ be used to serve your app in production.
```

## Leaderboard (Bug Hunt)

The game in `src/lib/Game.svelte` runs on a deterministic simulation (`src/lib/game/sim.ts`).
The leaderboard in `worker/` is a Cloudflare Worker with one Durable Object (SQLite): the
browser sends the log of its inputs, the worker replays the game and stores the score it computes.

```bash
cd worker
npm install
npx wrangler dev --port 8799   # local API
npx wrangler deploy            # needs `npx wrangler login` once
```

To use the local API from the site: `VITE_SCORE_API=http://localhost:8799 npm run dev`.
After the first deploy, put the worker URL in `PRODUCTION_API` (`src/lib/game/api.ts`).

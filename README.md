# GraphMyAnything

Landing page for [graphmyanything.com](https://graphmyanything.com)—**metric memory for AI agents**.

The original 2016 Flask stub lives in [`legacy/`](legacy/).

## Stack

- [Next.js](https://nextjs.org/) 15 (App Router)
- TypeScript, Tailwind CSS v4
- Deployed on [Vercel](https://vercel.com)

## Develop

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Build & lint

```bash
npm run build
npm run lint
```

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | No | Supabase project URL. When set with the service role key, waitlist emails are stored in Postgres. |
| `SUPABASE_SERVICE_ROLE_KEY` | No | Service role key for server-side `waitlist` inserts. **Never expose to the client.** |
| `NEXT_PUBLIC_PREORDER_URL` | No | Checkout URL for founding member preorder. Button shows **Coming soon** when unset. |

Vercel Web Analytics is enabled via `@vercel/analytics` in the root layout (automatic on Vercel deploys).

### Waitlist storage

1. Run the migration in [`supabase/migrations/20251122000000_waitlist.sql`](supabase/migrations/20251122000000_waitlist.sql) on your Supabase project (SQL editor or CLI).
2. Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in Vercel (or `.env.local` for dev).
3. `POST /api/waitlist` accepts `{ "email": "...", "source"?: "..." }`.

Without Supabase, the route logs signups and returns `{ "ok": true }`—useful for preview deploys.

### Custom analytics events

- `waitlist_submit` — successful waitlist signup (`track()` from `@vercel/analytics`)
- `preorder_click` — founding member button click

## Vercel

Import the repo, set environment variables as needed, and deploy. No extra configuration required.

## License

See repository history; legacy Python sample included for archival purposes.
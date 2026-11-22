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
npm run email:preview
```

`email:preview` writes HTML to `/opt/cursor/artifacts/waitlist-email-preview.html` and desktop/mobile screenshots (requires Playwright).

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | No | Supabase project URL. When set with the service role key, waitlist emails are stored in Postgres. |
| `SUPABASE_SERVICE_ROLE_KEY` | No | Service role key for server-side `waitlist` inserts. **Never expose to the client.** |
| `NEXT_PUBLIC_PREORDER_URL` | No | Checkout URL for founding member preorder. Button shows **Coming soon** when unset. |
| `RESEND_API_KEY` | No | Resend API key for waitlist confirmation emails (skipped when unset). |
| `WAITLIST_FROM_EMAIL` | No | From address for waitlist mail, e.g. `GraphMyAnything <hello@graphmyanything.com>`. |

Vercel Web Analytics is enabled via `@vercel/analytics` in the root layout (automatic on Vercel deploys).

### Waitlist storage

1. Run migrations in [`supabase/migrations/`](supabase/migrations/) on your Supabase project (SQL editor or CLI), including attribution columns.
2. Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in Vercel (or `.env.local` for dev).
3. `POST /api/waitlist` accepts email, `source`, and optional UTM / referrer / `landing_path` fields.

In **production** (`VERCEL_ENV=production`), the API requires working storage; otherwise it returns `500`. Local/preview may log signups without storage. New signups trigger a Resend confirmation when `RESEND_API_KEY` and `WAITLIST_FROM_EMAIL` are set; email failures do not fail the signup.

### Custom analytics events

- `waitlist_submit` — new waitlist row persisted (not duplicate resubmits)
- `waitlist_error` — signup failed (validation, network, or server)
- `preorder_click` — founding member CTA (includes `placement`; 350ms flush before navigation)

## Vercel

Import the repo, set environment variables as needed, and deploy. No extra configuration required.

## License

See repository history; legacy Python sample included for archival purposes.
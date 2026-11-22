# Developing the graphmyanything.com site

Internal notes for the Next.js landing app. Directory listings scrape the **root** [`README.md`](../README.md) (MCP-focused); this file is for contributors.

## Stack

- Next.js 15 (App Router), TypeScript, Tailwind CSS v4
- Deployed on Vercel
- Waitlist: Supabase Postgres + Resend (optional)
- Analytics: Vercel Web Analytics in root layout

## Commands

```bash
npm install
npm run dev          # http://localhost:3000
npm run build
npm run lint
npm run email:preview
```

`email:preview` writes HTML under `/opt/cursor/artifacts/` and Playwright screenshots when available.

## Environment variables

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | Waitlist storage (`POST /api/waitlist`) |
| `RESEND_API_KEY` / `WAITLIST_FROM_EMAIL` | Confirmation email (optional) |
| `NEXT_PUBLIC_PREORDER_URL` | Checkout URL; button shows **Coming soon** when unset |

Migrations: [`supabase/migrations/`](../supabase/migrations/).

## MCP package

- Source: [`packages/mcp-server/`](../packages/mcp-server/)
- Root scripts: `npm run build:mcp`, `test:mcp`, `benchmark:tokens`, `validation`
- Release: [`packages/mcp-server/RELEASING.md`](../packages/mcp-server/RELEASING.md)

## Legacy

2016 Flask stub: [`legacy/`](../legacy/).
# Releasing `graphmyanything-mcp`

## One-time: npm trusted publishing (OIDC)

Carlos must configure npm **before** the first tag-driven publish:

1. Open [graphmyanything-mcp on npm](https://www.npmjs.com/package/graphmyanything-mcp) → **Package settings** → **Publishing access** / **Trusted publishers**.
2. Add **GitHub Actions** trusted publisher:
   - **Owner:** `casahome2000`
   - **Repository:** `graphmyanything`
   - **Workflow:** `publish-mcp.yml`
   - **Environment:** (leave empty unless you add one)
3. Remove the bootstrap **npm token** from org/user secrets once trusted publishing works — releases use OIDC only (`id-token: write`).

## Cut a release

1. Bump `version` in `package.json` and `server.json`, merge to `master`.
2. Tag from `master`: `git tag mcp-v0.1.2` (prefix must be `mcp-v`).
3. Push the tag: `git push origin mcp-v0.1.2`.
4. GitHub Actions (`.github/workflows/publish-mcp.yml`) runs `npm ci`, `build`, `test`, then `npm publish --access public --provenance` from `packages/mcp-server`.

Do not publish manually from a laptop unless the workflow is broken.
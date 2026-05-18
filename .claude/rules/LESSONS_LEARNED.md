# Lessons Learned

## 2026-05-12 - Vite runtime verification

- In this workspace, sandboxed `npm run dev` can fail to load `vite.config.ts` with an access-denied error even when the project itself is valid. Re-run important Vite commands in the real project directory when this happens.
- `vite preview` successfully exercised the built `dist/` output and proxied `/api/statistics/visit`, `/api/statistics`, and `/api/statistics/response-time` with HTTP 200 responses.
- Temporary `vite-*.log` files may stay locked briefly by background Windows npm/cmd/node processes; verify the owning process before cleanup.

## 2026-05-18 - Wrangler Pages local env bindings

- `wrangler pages dev` did not pick up `ADMIN_PASSWORD` from the parent PowerShell environment during local verification. Pass runtime variables explicitly with `--binding ADMIN_PASSWORD=...`; the startup log should list `env.ADMIN_PASSWORD ("(hidden)")`.
- For protected Pages Functions, verify both negative and positive cases locally: no `Authorization` header and wrong bearer token should return HTTP 401, while the configured bearer token should return HTTP 200.

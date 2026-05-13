# Lessons Learned

## 2026-05-12 - Vite runtime verification

- In this workspace, sandboxed `npm run dev` can fail to load `vite.config.ts` with an access-denied error even when the project itself is valid. Re-run important Vite commands in the real project directory when this happens.
- `vite preview` successfully exercised the built `dist/` output and proxied `/api/statistics/visit`, `/api/statistics`, and `/api/statistics/response-time` with HTTP 200 responses.
- Temporary `vite-*.log` files may stay locked briefly by background Windows npm/cmd/node processes; verify the owning process before cleanup.

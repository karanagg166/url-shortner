<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Agent Development Rules

## 1. Docker Execution ONLY
- **ALL** commands (backend, frontend, database, scripts, migrations, tests) must be run **inside Docker containers only**.
- Do NOT run services or commands directly on the host machine.
- Examples:
  - Frontend execution: `docker compose exec frontend <command>`
  - Backend execution: `docker compose exec backend <command>`
  - Run one-off container command: `docker compose run --rm <service> <command>`

## 2. Strictly Use `pnpm` (No `npm` / `yarn` / `npx`)
- Always use **`pnpm`** as the package manager for all frontend/Node.js operations.
- Use `pnpm exec <cmd>` instead of `npx <cmd>` for locally installed packages.
- Use `pnpm dlx <package>` instead of `npx <package>` for remote package execution.
- Common commands inside Docker:
  - Install dependencies: `docker compose exec frontend pnpm install`
  - Add packages: `docker compose exec frontend pnpm add <pkg>`
  - Add dev dependency: `docker compose exec frontend pnpm add -D <pkg>`
  - Run scripts: `docker compose exec frontend pnpm run <script>`
  - Execute binary: `docker compose exec frontend pnpm exec <cmd>`
  - Download & execute: `docker compose exec frontend pnpm dlx <pkg>`

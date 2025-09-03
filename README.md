# Control Bancolombia

Full-stack application built with Node.js, Express, React, TypeScript and Drizzle ORM.

## Getting started

```bash
npm ci
npm run dev
```

The client is served by Vite and the API lives under `server/`.

## Environment variables

Copy `.env.example` to `.env` and fill in values for your deployment:

- `DATABASE_URL` – connection string for Postgres
- `SESSION_SECRET` – secret used to sign sessions
- `GOOGLE_CLOUD_PROJECT` and `GOOGLE_CLOUD_CREDENTIALS` – Google Cloud Storage
- `OPENAI_API_KEY` – OpenAI access
- `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX_REQUESTS` – rate limiting
- `CORS_ALLOWED_ORIGINS` – comma separated list of allowed origins
- `CACHE_TTL`, `CACHE_CHECK_PERIOD` – in-memory cache settings
- `LOG_LEVEL`, `LOG_FILE_PATH` – logging configuration

### Object Storage

This project can store receipts in Object Storage and generate signed URLs.

- Replit: use the built-in Object Storage tool. Define:
  - `PRIVATE_OBJECT_DIR` (e.g. `/my-bucket/private`)
  - `PUBLIC_OBJECT_SEARCH_PATHS` (e.g. `/my-bucket/public`)

- Render/Other hosts: use Google Cloud Storage service account credentials. Define:
  - `GCS_SERVICE_ACCOUNT_JSON` – the entire JSON of your service account (paste the JSON text as the value). If your dashboard mangles newlines, use `GCS_SERVICE_ACCOUNT_JSON_B64` with the base64 of the JSON instead.
  - `PRIVATE_OBJECT_DIR` – path like `/<bucket>/<private-prefix>` with leading slash
  - `PUBLIC_OBJECT_SEARCH_PATHS` – one or more `/<bucket>/<public-prefix>` paths, comma‑separated

If `GCS_SERVICE_ACCOUNT_JSON` is present, the server signs URLs using GCS (V4). If not present and not on Replit, the app will skip object storage but still process OCR with a graceful fallback.

## Scripts

- `npm run dev` – start development server
- `npm test` – run Jest test suite
- `npm run build` – build client with Vite and bundle server with esbuild
- `npm run start` – run built server
- `npm run db:push` – run Drizzle migrations

## Deployment on Render

1. Create a **Web Service** for the backend and another for the built frontend (or use a Static Site).
2. Provision a **Postgres** database and set `DATABASE_URL` in an Environment Group.
3. Set the rest of the variables from `.env.example` in the Environment Group and attach it to your services.
4. Use the following build command for the backend:

   ```bash
   npm ci && npm run build
   ```

5. Configure the start command for the backend as:

   ```bash
   npm run start
   ```

6. Enable automatic deployments from GitHub.

## Testing

Jest is configured via `jest.config.cjs`. Run:

```bash
npm test
```

for the full suite including server middleware tests.

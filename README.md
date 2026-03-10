# HR Software Backend

NestJS backend for HR software.

## Local Development

```bash
npm ci
npm run start:dev
```

Set env vars:

```bash
cp .env.example .env
```

## Production Build

```bash
npm run build
npm run start:prod
```

## Health Check

Public endpoint:

- `GET /health`

## Production Container

Build image:

```bash
docker build -t hr-backend .
```

Run image:

```bash
docker run --rm -p 3000:3000 --env-file .env hr-backend
```

## CI/CD (GitHub Actions)

Workflow: `.github/workflows/deploy-backend.yml`

Required repository secrets:

- `GHCR_USERNAME`
- `GHCR_TOKEN`
- `SSH_HOST`
- `SSH_USER`
- `SSH_KEY`
- `SSH_PORT` (optional)

This workflow builds/pushes:

- `ghcr.io/<owner>/hr-backend:main`
- `ghcr.io/<owner>/hr-backend:<sha>`

Then deploys on VPS with:

```bash
cd /opt/hr-software
docker compose pull backend
docker compose up -d backend caddy
```

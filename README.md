# HR Software Backend

NestJS backend for HR software.

## Local Development

```bash
npm ci
cp .env.example .env
npm run start:dev
```

## Health Check

- `GET /health`

## Free Deployment (Render)

1. Push this repository to GitHub.
2. In Render, create a new **Web Service** from this repo.
3. Render settings:
   - Build Command: `npm ci && npm run build`
   - Start Command: `npm run start:prod`
4. Add all env vars from `.env.example` in Render dashboard.
5. Deploy and copy backend URL:
   - `https://<your-service>.onrender.com`

Optional: use `render.yaml` in this repo for Blueprint setup.

## CI

Workflow: `.github/workflows/backend-ci.yml`

Runs on pushes/PRs:
- `npm run build`

## Notes

- Render free tier may sleep after inactivity.
- Set `FRONT_URL` to your Vercel app URL.

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
5. For email on the `free` Render plan, set:
   - `RESEND_API_KEY=<your resend api key>`
   - `RESEND_FROM=onboarding@resend.dev` for account-only testing, or `no-reply@your-domain.com` after you verify a domain in Resend
6. If `RESEND_API_KEY` is not set, the app falls back to `MAIL_*` SMTP settings. That fallback will not work on Render free because outbound SMTP ports are blocked.
7. To send emails to real applicants or employees through Resend, verify a sending domain in Resend and use a `RESEND_FROM` address on that domain.
8. Deploy and copy backend URL:
   - `https://<your-service>.onrender.com`

Optional: use `render.yaml` in this repo for Blueprint setup.

## CI

Workflow: `.github/workflows/backend-ci.yml`

Runs on pushes/PRs:
- `npm run build`

## Notes

- Render free tier may sleep after inactivity.
- Set `FRONT_URL` to your Vercel app URL.
- Resend's default `onboarding@resend.dev` sender can only send test emails to the account owner's email address until a domain is verified.

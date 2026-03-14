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
5. For email on the `free` Render plan, prefer Brevo over HTTPS:
   - `BREVO_API_KEY=<your brevo api key>`
   - `BREVO_SENDER_EMAIL=<a sender email you verified inside Brevo>`
   - `BREVO_SENDER_NAME=HR Platform`
6. If `BREVO_API_KEY` is not set, the app will try `RESEND_API_KEY`, then `MAIL_*` SMTP settings.
7. `MAIL_*` SMTP fallback will not work on Render free because outbound SMTP ports are blocked.
8. Resend still requires a verified domain for real recipients. Brevo can be used as a temporary sender-verification workaround for testing, but domain-based sending is still the cleaner long-term setup.
9. Deploy and copy backend URL:
   - `https://<your-service>.onrender.com`

Optional: use `render.yaml` in this repo for Blueprint setup.

## CI

Workflow: `.github/workflows/backend-ci.yml`

Runs on pushes/PRs:
- `npm run build`

## Notes

- Render free tier may sleep after inactivity.
- Set `FRONT_URL` to your Vercel app URL.
- Brevo sender verification is suitable for temporary testing on free tier, but a real domain is still recommended for better delivery.

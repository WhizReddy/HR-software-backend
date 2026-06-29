# People Hub HR Software Backend

NestJS backend for the People Hub HR platform. It provides REST APIs for
authentication, employees, recruitment, interview scheduling, vacation requests,
salary/payroll records, HR events, career posts, notifications, notes, asset
inventory, file upload, and deployment health checks.

## Tech Stack

- NestJS and TypeScript
- MongoDB with Mongoose schemas
- JWT authentication and role-based guards
- bcrypt password hashing
- Firebase Admin Storage for uploaded files
- Handlebars email templates with Brevo, Resend, or SMTP delivery
- Jest and Supertest-compatible test setup

## Main Modules

- `AuthModule`: sign-in, employee signup, password update, forgot/reset password.
- `UserModule`: employee profiles, profile images, user list/search.
- `ApplicantsModule`: public recruitment submission, confirmation, candidate
  phases, interviews, notes, custom candidate emails.
- `VacationModule`: vacation requests and HR approval/rejection.
- `SalaryModule`: payroll/salary records and individual salary views.
- `EventsModule`: HR events and public career posts.
- `NotificationModule`: notification aggregation and mark-read actions.
- `AssetModule`: inventory, holdings, assignment, return history.
- `FirebaseModule`: file upload, signed private file access, cleanup.
- `MailModule`: email template rendering and provider delivery.

## Local Development

```bash
npm ci
cp .env.example .env
npm run start:dev
```

Required environment values are listed in `.env.example`. At minimum,
production must set:

- `MONGODB_URI`
- `JWT_SECRET`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_PRIVATE_KEY`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_BUCKETNAME`
- `FRONT_URL`

Email delivery can use Brevo, Resend, or SMTP depending on the configured
environment variables.

## Health Check

- `GET /health`

## API Root

- `GET /` returns basic API metadata, for example `{ "name": "People Hub API", "status": "ok" }`.

## Quality Checks

Run these before pushing or deploying:

```bash
npm run lint:check
npm test
npm run build
```

Use `npm ci` when installing dependencies from a clean checkout or in CI.

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
- `npm ci`
- `npm run lint:check`
- `npm test`
- `npm run build`

## Notes

- Render free tier may sleep after inactivity.
- Set `FRONT_URL` to your Vercel app URL.
- Production must define `MONGODB_URI`, `JWT_SECRET`, and the required Firebase variables listed in `.env.example`.
- Brevo sender verification is suitable for temporary testing on free tier, but a real domain is still recommended for better delivery.
- Password reset stores only hashed reset tokens and clears them after a
  successful reset.

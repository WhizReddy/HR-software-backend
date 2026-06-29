# People Hub HR Platform - Backend Thesis Chapter Notes

These notes connect the implemented backend code to the English Bachelor thesis
chapters. They should guide thesis writing and should not be treated as a final
chapter draft without editing.

## Chapter 1: Introduction - What The System Solves

The backend supports a centralized HR platform for employee management,
recruitment, interviews, vacation requests, payroll review, events, assets, and
notifications. It replaces disconnected manual processes with a REST API that
supports both public applicant workflows and protected HR/Admin workflows.

The thesis can present the backend as the system layer responsible for:
- data persistence;
- authentication and authorization;
- business rules;
- file storage integration;
- email notification delivery;
- deployment-ready API behavior.

## Chapter 2: Theoretical Background

Relevant theory connected to the implementation:
- HRIS: modules cover users, applicants, leave, payroll, events, and assets.
- Web applications: the backend exposes REST endpoints consumed by a React SPA.
- REST APIs: controllers map HTTP methods and paths to service logic.
- RBAC: guards and decorators protect role-specific routes.
- JWT: signed tokens authenticate protected requests.
- Password hashing: bcrypt is used for stored passwords.
- Secure reset tokens: random reset tokens are stored as SHA-256 hashes with
  expiry and single-use clearing.
- NoSQL: MongoDB stores document-shaped HR data through Mongoose schemas.
- File storage: Firebase Storage stores CVs, profile images, and event media.
- Testing: Jest tests validate service, utility, guard-related, and controller
  behavior.
- CI/CD: GitHub Actions and Render support deployment.

## Chapter 3: Methodology And Requirements

Functional requirements implemented in backend code:
- sign in with JWT;
- create employees through HR/Admin workflows;
- request and reset passwords;
- submit public job applications with CV files;
- confirm applications by email token;
- list and filter candidates;
- schedule/reschedule first and second interviews;
- store candidate notes;
- send custom candidate emails;
- reject or employ candidates;
- manage users, vacation requests, salary records, events, assets, notes, and
  notifications;
- provide health and root metadata endpoints.

Non-functional requirements implemented or partially implemented:
- validation through DTOs and global validation pipe;
- role-based access controls;
- environment validation;
- upload size and MIME checks;
- hashed passwords and reset tokens;
- deployment configuration for Render;
- automated lint, test, and build CI.

## Chapter 4: System Architecture

Backend architecture:
- NestJS modules organize business domains.
- Controllers expose REST endpoints.
- Services contain business logic.
- Mongoose schemas define MongoDB collections.
- Guards enforce JWT and role access.
- Decorators mark public routes and role requirements.
- Firebase service handles file storage.
- Mail service renders Handlebars templates and sends emails through Brevo,
  Resend, or SMTP.

Database architecture:
- MongoDB is the primary database.
- Mongoose schemas define users, auth records, applicants, vacations, salaries,
  events, notifications, assets, and notes.

Deployment architecture:
- Render runs the backend service.
- Environment variables provide MongoDB, JWT, Firebase, frontend URL, and email
  provider configuration.
- The React frontend is deployed separately and calls this API by URL.

## Chapter 5: Implementation

Implemented backend modules:
- `AuthModule`: sign-up, sign-in, password update, forgot/reset password.
- `UserModule`: employee profiles, profile image upload, user list/search.
- `ApplicantsModule`: public application, confirmation, candidate phases,
  interview scheduling, notes, custom emails.
- `VacationModule`: vacation requests, HR approval/rejection, user leave views.
- `SalaryModule`: salary/payroll records and user salary views.
- `EventsModule`: HR events, career posts, media upload, notifications.
- `NotificationModule`: notification creation, aggregation, read states.
- `AssetModule`: inventory, holdings, assignment, return history.
- `FirebaseModule`: upload, private file access URL generation, delete cleanup.
- `MailModule`: email templates and provider-specific delivery.
- `HealthController`: deployment health check.

Important implementation detail for security: reset-password now searches only
for the SHA-256 hash of the provided token, rejects raw stored tokens, enforces
expiry, and clears reset fields after success.

## Chapter 6: Security And Testing

Security mechanisms:
- `AuthGuard` verifies JWT bearer tokens;
- `RolesGuard` enforces role metadata;
- `@Public()` marks explicit public endpoints;
- `@Roles()` marks HR/Admin restrictions;
- bcrypt hashes passwords;
- SHA-256 hashes password reset tokens;
- reset tokens expire and are single-use;
- environment validation blocks missing critical secrets;
- global validation pipe rejects unknown DTO fields;
- upload validation limits file types and sizes;
- Firebase private CV paths are exposed through signed URLs;
- sanitized user responses remove sensitive auth fields.

Testing evidence:
- `src/auth/auth.service.spec.ts` tests reset-password hardening;
- `src/applicants/applicant.service.spec.ts` tests applicant behavior;
- `src/common/config/env.validation.spec.ts` tests environment validation;
- `src/common/pipes/file-mime-type-validation.pipe.spec.ts` tests upload MIME
  validation;
- `src/user/user.controller.spec.ts` tests access control behavior;
- `src/notification/notification.service.spec.ts` tests notifications;
- `src/firebase/firebase.service.spec.ts` tests Firebase service behavior.

Security limitations:
- no MFA;
- no complete audit log;
- no full e2e security suite;
- JWT is consumed by the frontend from localStorage rather than HTTP-only
  cookies.

## Chapter 7: Results And Discussion

The backend demonstrates a working HR platform API with:
- public applicant submission and confirmation;
- authenticated HR/Admin operations;
- employee self-access checks for personal data routes;
- candidate interview scheduling and email communication;
- leave, payroll, events, assets, and notification modules;
- file upload and email integrations;
- CI checks for lint, tests, and build.

Discussion should be honest about the project scope: it is suitable for a
Bachelor thesis demonstration and small-platform prototype, but a production HR
system would require stronger audit logging, privacy review, security review,
monitoring, backup strategy, and more e2e testing.

## Chapter 8: Conclusions And Future Work

The backend shows how NestJS and MongoDB can support a modular HR platform with
recruitment and employee-management workflows. It integrates authentication,
authorization, persistence, file storage, emails, and deployment checks.

Realistic future work:
- migrate session handling to HTTP-only secure cookies;
- add MFA for HR/Admin users;
- add audit logs for sensitive HR changes;
- add full e2e tests with test database isolation;
- add structured logging and production monitoring;
- add finer-grained permissions beyond broad HR/Admin roles;
- add stronger file scanning for uploaded CVs;
- add backup and data-retention policies.

# People Hub HR Platform - Backend Thesis Code Evidence

This document records the implemented backend evidence for the Bachelor thesis.
It is based on the current NestJS repository and should remain factual.

## Project Overview

People Hub is a full-stack HR management and recruitment platform. This
repository contains the backend API built with NestJS, TypeScript, MongoDB,
Mongoose, JWT authentication, role-based authorization, Firebase file storage,
email notifications, Jest tests, and Render deployment configuration.

The backend supports:
- authentication, sign-in, employee creation, password update, forgot/reset
  password;
- role-based access control for HR/Admin features;
- applicants, public recruitment submission, email confirmation, candidate
  phases, interviews, notes, custom emails, rejection, and employment flow;
- users, vacations, salary/payroll, events/career posts, notifications, notes,
  assets, holdings, Firebase file upload, and health endpoints.

## Backend Architecture

The root module is `src/app.module.ts`. It configures:
- `ConfigModule` with environment validation;
- MongoDB connection through `MongooseModule`;
- global throttling through `ThrottlerModule` and `ThrottlerGuard`;
- scheduling through `ScheduleModule`;
- application modules: `UserModule`, `AssetModule`, `AuthModule`,
  `EventsModule`, `VacationModule`, `NotificationModule`, `NoteModule`,
  `ApplicantsModule`, `MailModule`, `FirebaseModule`, and `SalaryModule`;
- public root and health controllers.

`src/main.ts` configures:
- Firebase Admin initialization from environment variables;
- CORS based on `FRONT_URL`, `CORS_ORIGINS`, and local development origins;
- global `ValidationPipe` with transform, whitelist, and
  forbid-non-whitelisted behavior;
- application port from `PORT` with default `3000`.

## Frontend Architecture

The backend is consumed by a React, TypeScript, and Vite frontend. The frontend
uses Axios to call this REST API, sends JWT bearer tokens for protected
requests, and hosts public pages for login, career posts, recruitment, applicant
confirmation, forgot password, and reset password.

## Database Model Summary

MongoDB models are defined with Mongoose schemas:
- `Auth`: email, hashed password, soft delete flag, hashed reset token, reset
  token expiry.
- `User`: employee profile, role, phone, image URL, demographics, position,
  grade, engagement, auth reference, soft delete flag.
- `Applicant`: public applicant data, CV path, confirmation token, status,
  current phase, first/second interview dates, notes, soft delete flag.
- `Vacation`: leave type, dates, status, user reference, soft delete flag.
- `Salary`: net/gross salary data, working days, bonus, deductions, month,
  year, user reference.
- `Event`: title, description, type, dates, location, participants, photos,
  soft delete flag.
- `Notification`: title, content, type, typeId, date, read state, readers, soft
  delete flag.
- `Asset`: type, serial number, status, assigned user, taken/return dates,
  history, soft delete flag.
- `Note`: note records used by notification workflows.

## Authentication And Authorization

Authentication code is in:
- `src/auth/auth.controller.ts`;
- `src/auth/auth.service.ts`;
- `src/auth/auth.module.ts`;
- `src/common/guard/auth.guard.ts`;
- `src/common/guard/role.guard.ts`;
- `src/common/decorator/public.decorator.ts`;
- `src/common/decorator/roles.decorator.ts`.

Sign-in verifies the email and bcrypt password, loads the related user, signs a
JWT with `sub`, `email`, and `role`, and returns a sanitized user response.

Passwords are hashed with bcrypt. Created employees receive generated passwords
by email.

`AuthGuard` allows endpoints marked with `@Public()` and otherwise requires a
valid bearer token. `RolesGuard` checks `@Roles(...)` metadata against the
authenticated user's role.

## Reset Password Flow After Hardening

The forgot-password flow:
- creates a random reset token;
- stores only a SHA-256 hash of that token;
- stores an expiry timestamp;
- emails the raw token only inside the reset URL.

The reset-password flow now:
- hashes the provided token;
- searches only for the hashed token;
- enforces `resetPasswordExpires > Date.now()`;
- rejects raw/plain stored tokens;
- hashes the new password with bcrypt;
- clears `resetPasswordToken` and `resetPasswordExpires` after success;
- returns a generic success or invalid/expired token response.

Tests in `src/auth/auth.service.spec.ts` prove:
- hashed token works;
- raw/plain stored token does not work;
- expired token does not work;
- reset token fields are cleared after a successful reset.

## Public Routes Vs Protected Routes

Public backend endpoints include:
- `GET /`;
- `GET /health`;
- `POST /auth/signin`;
- `POST /auth/forgot-password`;
- `POST /auth/reset-password`;
- `POST /applicant`;
- `GET /applicant/confirm`;
- `GET /event/career`.

Protected endpoints use JWT auth by default. HR/Admin-only endpoints use
`@Roles(Role.HR, Role.ADMIN)` or controller-level role restrictions.

## Role-Based Access Control

Roles are defined in `src/common/enum/role.enum.ts`. HR/Admin access is required
for sensitive management actions such as employee list/search, applicant
management, salary list, vacation administration, event administration, and
asset inventory administration.

Self-access checks are implemented for routes such as:
- `GET /user/:id`;
- `GET /salary/user/:id`;
- `GET /vacation/user/:id`;
- `GET /asset/user/:id`;
- user notification routes.

## Recruitment Workflow

The public recruitment endpoint is `POST /applicant`. It:
- accepts multipart CV upload through `FileInterceptor`;
- validates file MIME type with `FileMimeTypeValidationPipe`;
- limits uploaded CV size to 5 MB;
- rejects applicants whose email already belongs to an employee auth account;
- stores the CV through Firebase as private storage;
- creates an applicant with `pending` status and confirmation token;
- emails a confirmation link;
- rolls back the applicant record and uploaded CV if confirmation email sending
  fails.

## Candidate Confirmation Flow

`GET /applicant/confirm?token=...` validates the confirmation token, changes the
applicant status to `active`, clears the confirmation token, creates an
applicant notification, and saves the applicant.

## Two-Phase Interview Scheduling And Rescheduling

Candidate updates are handled by `PATCH /applicant/:id`. The service supports:
- first interview date;
- second interview date;
- future-date validation;
- second interview must be after the first interview when first date exists;
- 30-minute conflict detection across first and second interview dates;
- reschedule email templates when a date already existed;
- separate first and second interview phases.

Upcoming interviews are exposed through `GET /applicant/interviews/upcoming`,
which returns active candidates with future first/second interview dates as
separate items.

## Interview Notes And Custom Candidate Email Flow

Candidate notes are updated through applicant patch payloads. Custom candidate
emails use `customSubject` and `customMessage` and send the `custom-email`
template through `MailService`.

## Employee And HR Modules

User management is implemented in `src/user`. HR/Admin users can list, search,
update, and soft-delete employees. Normal users can access only their own
profile where controller self-access checks allow it. Profile image upload uses
Firebase storage.

## Vacation Module

Vacation management is implemented in `src/vacation`. Users can create vacation
requests. HR/Admin users can list, filter, approve, reject, and soft-delete
requests. Notifications are created for new requests and status changes.

## Payroll And Salary Module

Salary/payroll management is implemented in `src/salary`. HR/Admin users can
create and filter salary records. Users can access their own payroll route.
Salary records include month, year, working days, bonus, deductions, gross and
net salary values.

## Events And Career Posts Module

Events are implemented in `src/events`. HR/Admin users can create, update, and
soft-delete events with optional photo uploads. General event notifications are
created for participants or all users. Public career posts are represented as
events with type `career` and exposed through `GET /event/career`.

## Notifications

Notifications are implemented in `src/notification`. They support event,
applicant, vacation, note, and promotion-related notification aggregation.
Users can mark individual notifications or all period notifications as read,
with self-access checks for user-specific notification endpoints.

## File Upload And Firebase Storage

File upload is handled by `src/firebase/firebase.service.ts`.
Implemented behavior:
- image conversion to WebP;
- optional square crop for profile images;
- public uploads for images when requested;
- private CV storage for applicant uploads;
- signed URL generation for private file access;
- file deletion used during applicant rollback.

Firebase credentials are read from environment variables and are not committed.

## Testing Strategy

Backend tests use Jest. Current coverage includes:
- app controller;
- applicant phone validation;
- applicant service behavior;
- reset-password hardening;
- environment validation;
- file MIME validation pipe;
- sanitized user responses;
- filter query helpers;
- Firebase service behavior;
- mail service construction;
- note controller;
- notification service;
- user controller authorization.

Representative files:
- `src/auth/auth.service.spec.ts`;
- `src/applicants/applicant.service.spec.ts`;
- `src/common/config/env.validation.spec.ts`;
- `src/common/pipes/file-mime-type-validation.pipe.spec.ts`;
- `src/user/user.controller.spec.ts`.

## CI/CD And Deployment

The backend is configured for Render deployment. Required environment variables
are documented in `.env.example` and enforced by `validateEnvironment`.

The GitHub Actions workflow `.github/workflows/backend-ci.yml` runs:
- `npm ci`;
- `npm run lint:check`;
- `npm test`;
- `npm run build`.

## Security Considerations

Implemented backend security measures:
- JWT authentication guard;
- role guard with decorators;
- public route decorator for explicit public endpoints;
- bcrypt password hashing;
- SHA-256 reset token hashing;
- reset token expiry and single-use clearing;
- environment validation for required secrets;
- DTO validation pipe with whitelist and non-whitelisted field rejection;
- CORS origin allow-listing;
- upload size limits and MIME validation;
- private Firebase CV storage with signed access URLs;
- sanitization of user responses to remove sensitive auth fields.

Limitations:
- no MFA;
- no audit log for all sensitive operations;
- no HTTP-only cookie auth migration yet;
- tests are mostly unit/service tests, not full production-like end-to-end
  coverage.

## Important Files And Their Purpose

- `src/app.module.ts`: module graph, config, MongoDB, throttling, scheduling.
- `src/main.ts`: CORS, Firebase Admin, validation pipe, app bootstrap.
- `src/auth/auth.service.ts`: sign-up, sign-in, password update, forgot/reset
  password.
- `src/auth/auth.service.spec.ts`: reset-password hardening tests.
- `src/common/guard/auth.guard.ts`: JWT bearer token guard.
- `src/common/guard/role.guard.ts`: role metadata guard.
- `src/common/config/env.validation.ts`: required environment validation.
- `src/applicants/applicant.service.ts`: recruitment, confirmation, candidate
  phases, interviews, notes, emails.
- `src/firebase/firebase.service.ts`: file upload, image processing, signed URL
  access.
- `src/mail/mail.service.ts`: template rendering and email delivery through
  Brevo, Resend, or SMTP.
- `src/events/events.service.ts`: HR events and career posts.
- `src/vacation/vacation.service.ts`: vacation request logic.
- `src/salary/salary.service.ts`: payroll/salary calculations and filters.
- `src/notification/notification.service.ts`: notification creation and
  aggregation.

## Claims To Avoid In The Thesis

Do not claim:
- that MFA is implemented;
- that all authorization decisions happen only on the frontend;
- that reset tokens are stored in plaintext;
- that the system has complete audit logging;
- that the payroll module is legally certified payroll/accounting software;
- that every workflow has end-to-end tests;
- that Firebase credentials are exposed to the frontend;
- that real-time WebSocket notifications are fully implemented unless the
  specific deployed behavior is demonstrated.

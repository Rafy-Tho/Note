# Privacy Policy

## Status

This is the product privacy policy for the current Oqira MVP. The frontend publishes it at `/privacy-policy` and links to it from the registration form. The deployment operator is responsible for supplying the appropriate support contact and reviewing the policy for the deployment's legal requirements.

Last updated: 2026-09-11

## Information We Collect

Oqira collects the information needed to provide a private note workspace and protect account access:

- Account email address, email-verification status, and account timestamps.
- Authentication records for local, Google, or Facebook sign-in.
- An Argon2id hash for local passwords; plaintext passwords are not stored.
- Note titles, structured note content, notebooks, tags, favorites, and note state.
- Hashes of session, verification, password-reset, and OAuth callback values.
- Limited operational request data: request ID, method, path, status, and duration.

Request logs do not contain query strings, cookies, request bodies, tokens, or private note content.

## Use of Information

Information is used to create and authenticate accounts, verify email addresses, send password-reset messages, store and search notes, maintain workspace organization, prevent unauthorized access, rate-limit abuse, and operate and troubleshoot the service.

## Cookies

The service uses necessary HTTP-only cookies for authenticated sessions and a short-lived browser-binding cookie for social sign-in flows. The MVP does not intentionally use advertising cookies, analytics trackers, or cross-site tracking pixels.

## Service Providers

Hostinger may deliver email verification and password-reset messages. Google and Facebook process information under their own privacy policies and terms when a user chooses those sign-in methods. Oqira does not sell personal information or share note content for advertising.

## Storage, Retention, and Choices

Account and workspace data remain available while the account is active, subject to the deployment operator's retention and backup practices. Expired or consumed authentication tokens are not usable. The MVP does not provide self-service account deletion or data export. Account-data requests should use the support channel provided with the deployment.

## Security

The service uses server-managed opaque sessions, secure cookie settings, CSRF protection, authentication rate limits, server-side validation, rich-text sanitization, and ownership checks for protected data. Notes are stored as structured server-side content for the current MVP. The product must not claim end-to-end or client-side encryption until that capability is implemented and verified.

## Changes and Contact

The policy may be updated when the product or its data practices change. The published effective date identifies the current version. Privacy questions should be directed to the operator or support contact published with the deployment.

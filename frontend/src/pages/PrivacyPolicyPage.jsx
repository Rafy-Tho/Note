import { Link } from 'react-router-dom';
import styles from './PrivacyPolicyPage.module.css';

export function PrivacyPolicyPage() {
  return (
    <article className={styles.page} aria-labelledby="privacy-policy-title">
      <header className={styles.header}>
        <p className={styles.eyebrow}>Privacy / policy</p>
        <h1 id="privacy-policy-title">Privacy Policy</h1>
        <p className={styles.intro}>
          Note App is a private note workspace. This policy explains what the
          current MVP stores, why it is needed, and which services support the
          account flows.
        </p>
        <p className={styles.updated}>Last updated: September 11, 2026</p>
      </header>

      <section>
        <h2>Information we collect</h2>
        <p>
          We collect the information needed to provide your workspace and keep
          it secure:
        </p>
        <ul>
          <li>
            Your account email address, email-verification status, and account
            timestamps.
          </li>
          <li>
            Authentication records for local, Google, or Facebook sign-in. Local
            passwords are not stored in plain text; the server stores an
            Argon2id password hash.
          </li>
          <li>
            Notes and workspace organization data, including note titles, note
            content, notebooks, tags, favorites, and note state.
          </li>
          <li>
            Security records such as hashed session, verification, reset, and
            OAuth callback values.
          </li>
          <li>
            Limited operational request data: request ID, method, path, status,
            and duration. Query strings, cookies, request bodies, tokens, and
            private note content are not written to request logs.
          </li>
        </ul>
      </section>

      <section>
        <h2>How we use information</h2>
        <p>
          We use this information to create and authenticate accounts, verify
          email addresses, deliver password-reset messages, store and search
          your notes, maintain workspace organization, prevent unauthorized
          access, rate-limit abuse, and operate and troubleshoot the service.
        </p>
      </section>

      <section>
        <h2>Cookies and similar technologies</h2>
        <p>
          Note App uses necessary HTTP-only cookies for authenticated sessions
          and, when using social sign-in, a short-lived browser binding for the
          OAuth flow. These cookies support security and account access. The MVP
          does not intentionally use advertising cookies, analytics trackers, or
          cross-site tracking pixels.
        </p>
      </section>

      <section>
        <h2>Service providers</h2>
        <p>
          Email verification and password-reset messages may be delivered
          through Brevo. If you choose Google or Facebook sign-in, that provider
          processes information under its own privacy policy and terms. Note App
          does not sell your personal information or share your note content for
          advertising.
        </p>
      </section>

      <section>
        <h2>Storage, retention, and your choices</h2>
        <p>
          Account and workspace data remain available while the account is
          active, subject to the deployment operator&apos;s retention and backup
          practices. Expired or consumed authentication tokens are not usable.
          The current MVP does not provide self-service account deletion or data
          export. To request account-data assistance, contact the operator
          through the support channel provided with your Note App deployment.
        </p>
      </section>

      <section>
        <h2>Security</h2>
        <p>
          Note App uses server-managed opaque sessions, secure cookie settings,
          CSRF protection, authentication rate limits, server-side validation,
          rich-text sanitization, and ownership checks for protected data. Notes
          are stored as structured server-side content for the current MVP; this
          page does not claim end-to-end or client-side encryption. No online
          service can guarantee absolute security, so keep your credentials
          private and use a unique password.
        </p>
      </section>

      <section>
        <h2>Policy changes and contact</h2>
        <p>
          The policy may be updated when the product or its data practices
          change. The effective date above identifies the current version.
          Privacy questions should be directed to the operator or support
          contact published with your Note App deployment.
        </p>
      </section>

      <nav className={styles.actions} aria-label="Privacy policy navigation">
        <Link className={styles.primaryLink} to="/register">
          Create an account
        </Link>
        <Link className={styles.secondaryLink} to="/login">
          Return to sign in
        </Link>
      </nav>
    </article>
  );
}

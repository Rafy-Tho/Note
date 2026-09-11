# Acceptance Criteria

- A user cannot read or modify another user's account, note, notebook, tag, search result, or collection.
- Registration, verification, sign-in, sign-out, provider callbacks, and password reset enforce their security rules.
- Local registration creates exactly one user and one local auth account; local login and password reset continue to work from that auth account.
- A known provider account logs into its linked user, while a new verified provider account creates exactly one user and one social auth account.
- A provider callback with an email matching an existing user does not create a second user or session and directs the user through explicit authenticated linking.
- Explicit provider linking requires a verified session, CSRF protection, one-time callback state, a provider identity not linked elsewhere, and preserves the existing local login method. Linking uses the authenticated provider identity rather than comparing provider emails; an unverified or missing email is not used to select the account.
- Unverified provider email claims cannot create an automatic account, and provider-account collisions are rejected without partial account state.
- A user can create, view, edit, autosave, search, organize, archive, trash, restore, and permanently delete their own notes.
- Failed saves retain current editor content and older saves cannot overwrite newer content.
- Rich text is validated and safely rendered.
- Normal collections and search exclude trashed notes.
- Responsive layouts preserve navigation, focus, keyboard behavior, and unsaved-change protection.
- Required automated checks pass before a feature is marked complete.

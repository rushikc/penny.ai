# secrets/

This folder is gitignored. It is no longer required for app authentication.

Admin access uses email/password sign-in via `EXPO_PUBLIC_ADMIN_EMAIL` and
`EXPO_PUBLIC_ADMIN_PASSWORD` in `.env`, with Firestore locked to your admin
user UID in `firestore.rules`.

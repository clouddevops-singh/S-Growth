# S-Growth

S-Growth is a private personal growth dashboard rebuilt from the original single-file HTML app. It runs as a Next.js application with server-side authentication, authenticated API routes, and persistent private storage through Vercel Blob. Local development uses files under `.data/` when Blob is not configured.

## Features

- Private password sign-in with an HTTP-only, signed session cookie.
- Create, complete, reset, and remove daily habits.
- Record check-ins by date and view real weekly or four-week history.
- Add goals, edit their names and target dates, and update progress.
- Switch between six personal skill groups and update scores.
- Edit the five-year vision cards, change the theme, and rotate affirmations and quotes.
- Includes the existing profile headshot as the default avatar. New JPEG, PNG, or WebP uploads up to 4 MB are private and served through an authenticated route.
- Mobile-friendly navigation and layout.

## Local development

Use Node.js 22 or newer.

```bash
npm install
```

Set these values in an ignored `.env.local` file. `BLOB_READ_WRITE_TOKEN` can be left empty to use local files.

```dotenv
AUTH_SECRET=replace-with-a-random-secret-at-least-32-characters
ADMIN_EMAIL=you@example.com
ADMIN_PASSWORD_HASH=salthex:scrypt-hex
```

Generate a password hash with Node.js:

```js
const { randomBytes, scryptSync } = require('node:crypto');
const salt = randomBytes(16).toString('hex');
const password = 'replace-this-with-a-strong-password';
console.log(`${salt}:${scryptSync(password, salt, 64).toString('hex')}`);
```

The hash format is `salt:hex(scrypt(password, salt, 64))`. Do not commit `.env.local` or share the password hash in the repository.

```bash
npm run dev
```

Visit `http://localhost:3000`. Local growth state and uploaded images live in the ignored `.data/` folder.

## Vercel deployment

1. Import `clouddevops-singh/S-Growth` as a Next.js project.
2. Create and connect a **private** Vercel Blob store.
3. Set `AUTH_SECRET`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD_HASH` for Preview and Production. The Blob integration supplies `BLOB_READ_WRITE_TOKEN`.
4. Deploy the `codex/s-growth-backend` branch as a Preview deployment. Set the production branch to `main` until the new version is reviewed.

The application does not index the private dashboard. API routes require a valid session. Data and image storage depend on the connected private Blob store in Vercel.

## Original project

The previous `index.html` remains in the repository history. Its browser-local check-ins are not uploaded automatically because each browser owns a separate local-storage database. Chart history in this version begins when check-ins are recorded; demonstration values from the original page are not treated as real history.

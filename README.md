# FieldForce AI MVP Prototype

This workspace contains the first working prototype for a Pharma + FMCG field-force management platform.

## What is included

- Manager command center
- Mobile field app preview
- Visit management
- Sales/product performance
- Scheme builder concept
- Incentive engine concept
- Gamification
- AI sales copilot concept

## How to open

Open `index.html` in a browser.

No build step or dependency install is required for this first prototype.

For the mobile field-user prototype, open `mobile.html`.

## Mobile install / PWA

The mobile prototype includes basic PWA support:

- `manifest.webmanifest`
- `sw.js`
- `icon.svg`
- `icon-192.svg`

After deployment on HTTPS, open `mobile.html` on a phone and use the browser's "Add to Home Screen" option.

## Vercel deployment

This project includes `vercel.json`.

- `/` opens the mobile app.
- `/admin` opens the admin dashboard prototype.
- `/admin.html` also opens the admin dashboard prototype.

## Fast update workflow

After GitHub and Vercel are connected once, use:

```bash
./deploy.sh "update app"
```

This commits changes to GitHub. Vercel will auto-deploy from GitHub.

## Supabase cloud setup

Run `supabase-schema.sql` in Supabase SQL Editor before testing cloud save.

The prototype currently uses Supabase public anon access for testing. Before a large rollout, replace this with authenticated users and stricter row-level security policies.

## Next development steps

1. Convert this prototype into a Next.js admin panel.
2. Create a React Native mobile app.
3. Add a NestJS backend with PostgreSQL.
4. Implement authentication, role permissions, employee hierarchy, customer master, attendance, visits, orders, and offline sync.
5. Add scheme, incentive, gamification, AI, and integration modules phase by phase.

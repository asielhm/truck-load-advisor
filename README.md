# TruckLoad Advisor v3 — Supabase authentication

This version connects the GitHub Pages prototype to:

- Supabase project: `iirptoelyjunzvzoudcj`
- Real email/password authentication
- Secure user profiles protected by Row Level Security
- Online driver operating profiles
- A database table prepared for future authorized live-load feeds

## 1. Run the SQL

Open your Supabase project:

1. Go to **SQL Editor**
2. Choose **New query**
3. Paste the complete contents of `supabase-setup.sql`
4. Press **Run**

## 2. Configure authentication redirects

Open:

**Authentication → URL Configuration**

Set:

- **Site URL:** `https://asielhm.github.io/truck-load-advisor/`
- **Redirect URL:** `https://asielhm.github.io/truck-load-advisor/`

Email confirmation may remain enabled. New users will then receive a confirmation message.

## 3. Upload the website files

Upload or replace these files in the root of the GitHub repository:

- `index.html`
- `style.css`
- `script.js`
- `loads.json`
- `cities.json`

The SQL file does not need to be hosted publicly after you run it, although keeping it in the repository is useful for version control.

## Security

The `sb_publishable_...` key is intentionally public and works together with RLS.

Never place any of these in GitHub:

- `sb_secret_...`
- legacy `service_role`
- load-board private API secrets
- Stripe secret key

The `loads` table has RLS enabled and currently has no public browser-read policy.

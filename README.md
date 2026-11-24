# THE VIII SALON

A React + TypeScript customer website with an Express + TypeScript booking API.

## Run locally

```powershell
cd backend
npm install --ignore-scripts
npm run build
npm start
```

In another terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. The admin area is at `http://localhost:5173/admin`.

Copy `backend/.env.example` to `backend/.env` and set the database, admin, and SMTP values. The backend requires MySQL; bookings are stored in the database. Start the frontend and backend in separate terminals. The frontend calls `http://localhost:4000/api` by default in development.

## Database

Run `backend/schema.sql` against your MySQL server before starting the backend. For an existing database, run `backend/migrations/001_permanent_service_deletion.sql` once to allow permanent service deletion while preserving booking history.

## Deployment

Deploy the frontend and backend as separate services unless your host is configured to proxy `/api` to the backend:

1. Deploy `backend/` as a Node.js service. Build with `npm run build` and start with `npm start`. Configure the backend environment variables from `backend/.env.example`, including a reachable MySQL database and valid SMTP credentials.
2. Deploy `frontend/` as a Vite static site. Build with `npm run build` and publish `dist/`. Set the build-time variable `VITE_API_URL` to the public backend origin (for example, `https://your-api-domain.example`). It may include `/api`; the frontend normalizes either form.
3. Set the backend `REACT_URL` to the frontend's exact public origin. For multiple allowed origins, separate them with commas.
4. Configure the database with `backend/schema.sql` and set `SMTP_USER`, `SMTP_PASS`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, and `ADMIN_NOTIFY_EMAIL`. The SMTP provider must allow the deployed backend to send mail. Gmail requires an app password. Without working SMTP credentials, bookings can still be saved, but the API reports email delivery as failed.

The hero image and logo are served from `frontend/public`; use root-relative URLs such as `/salon-interior.jpg` and `/logo.jpeg`.

## Validation

Run `npm run build` from both `backend/` and `frontend/` to type-check and build each service.

## Cloudflare Pages deployment

This repository uses Cloudflare Pages Functions for the API and D1 for the database. The frontend and API are deployed together, with `/api/*` handled by `functions/api/[[path]].ts`.

1. Install Wrangler and authenticate:

```bash
npm install -g wrangler
wrangler login
```

2. Create the D1 database:

```bash
wrangler d1 create theviiisalon
```

Copy the returned `database_id` into `wrangler.toml`.

3. Apply the schema:

```bash
wrangler d1 execute theviiisalon --remote --file migrations/0001_cloudflare_initial.sql
```

4. In Cloudflare Dashboard, open **Workers & Pages > theviiisalon > Settings > Variables and Secrets** and add:

- `JWT_SECRET`: a random 32+ character secret
- `ADMIN_EMAIL`: the admin login email
- `ADMIN_DEFAULT_PASSWORD`: the initial admin password
- `ADMIN_SECRET_KEY`: the second-factor admin secret
- `RESEND_API_KEY`: optional Resend API key
- `EMAIL_FROM`: optional verified sender, for example `The VIII Salon <bookings@example.com>`
- `ADMIN_NOTIFY_EMAIL`: optional booking notification recipient

Add the D1 binding in **Settings > Bindings**: variable name `DB`, database `theviiisalon`.

5. Create the Pages project or deploy manually:

```bash
npm install
npm run build --prefix frontend
npx wrangler pages deploy frontend/dist --project-name theviiisalon
```

For Git-connected deployments, set the build command to `npm run build --prefix frontend`, the build output directory to `frontend/dist`, and connect the repository root. Pages Functions and D1 bindings are read from `wrangler.toml` and the Dashboard binding settings.

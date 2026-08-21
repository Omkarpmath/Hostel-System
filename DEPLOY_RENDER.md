# Deploying the Hostel Management System on Render

This project is a two-part application:

- **Frontend:** React/Vite app in `client/` — deploy as a **Static Site**.
- **Backend:** Express/Prisma app in `server/` — deploy as a **Web Service**.
- **Database:** PostgreSQL — create a **Render Postgres** database, or use an existing hosted PostgreSQL database.

Deploy the backend first, then the frontend. This order gives you the backend URL required by the frontend build.

> Never commit `.env`, `.env.local`, Razorpay secrets, JWT secrets, or database passwords to Git.

## 1. Prepare the repository

1. Push this project to a private GitHub repository.
2. Confirm these commands work locally:

   ```bash
   cd server && npm run build
   cd ../client && npm run build
   ```

3. Do **not** upload `node_modules`, `dist`, or local `.env` files.

## 2. Create PostgreSQL on Render

1. In [Render](https://dashboard.render.com/), choose **New → Postgres**.
2. Choose a name such as `hostel-db`, select a region, and create it.
3. Open the database’s **Info** page and copy its **Internal Database URL**. It is for a backend deployed in the same Render region.
4. The new database is empty. This project has no committed Prisma migrations, so initialize its schema using:

   ```bash
   cd server
   DATABASE_URL='your-render-database-url' npx prisma db push
   ```

   Run that command from your own terminal after replacing the value. It creates the tables but does not copy your local data. If you need your existing data in production, export/import it separately before accepting real users.

## 3. Deploy the backend API

1. In Render, choose **New → Web Service** and connect the GitHub repository.
2. Use these settings:

   | Render field | Value |
   | --- | --- |
   | Runtime | `Node` |
   | Root Directory | `server` |
   | Build Command | `npm ci && npm run build` |
   | Start Command | `npm start` |
   | Health Check Path | `/api/v1/health` |

3. Add these environment variables in the service’s **Environment** page:

   | Key | Value |
   | --- | --- |
   | `NODE_ENV` | `production` |
   | `DATABASE_URL` | Render Postgres **Internal Database URL** |
   | `JWT_ACCESS_SECRET` | a long, newly generated secret |
   | `JWT_REFRESH_SECRET` | a different long, newly generated secret |
   | `CLIENT_URL` | Set this after Step 4 to your frontend URL, e.g. `https://bmsce-hostel.onrender.com` |
   | `RAZORPAY_KEY_ID` | your Razorpay key ID (test or live, matching the environment) |
   | `RAZORPAY_KEY_SECRET` | matching Razorpay secret — keep it server-only |
   | `RESERVATION_TIMEOUT_MINUTES` | optional; for example `10` |

   Do **not** manually set `PORT`; Render provides it and the server already reads it.

4. Deploy. Copy the API’s public URL, for example:

   ```text
   https://hostel-api.onrender.com
   ```

5. Check this URL in a browser. It should return JSON:

   ```text
   https://hostel-api.onrender.com/api/v1/health
   ```

## 4. Make the frontend use the deployed API

The frontend currently uses `baseURL: '/api/v1'` in `client/src/api/axios.ts`. That works locally because Vite proxies `/api` to the local server. A Render Static Site has no Vite proxy, so change it before deploying:

```ts
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api/v1`
    : '/api/v1',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});
```

Also change the refresh call in the same file so it uses the same base URL:

```ts
const apiBaseUrl = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api/v1`
  : '/api/v1';

const { data } = await axios.post(`${apiBaseUrl}/auth/refresh`, {}, {
  withCredentials: true,
});
```

Keep the Vite proxy in `client/vite.config.ts`; it is still useful for local development.

## 5. Deploy the frontend

1. In Render, choose **New → Static Site** and connect the same repository.
2. Use these settings:

   | Render field | Value |
   | --- | --- |
   | Root Directory | `client` |
   | Build Command | `npm ci && npm run build` |
   | Publish Directory | `dist` |

3. Add these **build-time** environment variables:

   | Key | Value |
   | --- | --- |
   | `VITE_API_URL` | API URL from Step 3, e.g. `https://hostel-api.onrender.com` |
   | `VITE_PUBLIC_APP_URL` | Frontend URL from this service, e.g. `https://bmsce-hostel.onrender.com` |

   `VITE_` variables are included in the frontend JavaScript at build time. Never put `RAZORPAY_KEY_SECRET`, JWT secrets, or `DATABASE_URL` in a `VITE_` variable.

4. Add a Rewrite rule so React routes—including scanned QR URLs—work when opened directly:

   | Source | Destination | Action |
   | --- | --- | --- |
   | `/*` | `/index.html` | `Rewrite` |

5. Deploy and copy the frontend URL. Update `VITE_PUBLIC_APP_URL` to exactly that URL if it was not known beforehand, then **redeploy the frontend**.

## 6. Complete the cross-service configuration

After the frontend has a final URL:

1. In the **backend** service, set `CLIENT_URL` to the exact frontend URL (no trailing slash), then redeploy the backend. This allows browser requests and cookies from the frontend.
2. In the **frontend** service, confirm:

   ```text
   VITE_API_URL=https://your-api.onrender.com
   VITE_PUBLIC_APP_URL=https://your-frontend.onrender.com
   ```

   Redeploy after any `VITE_` value changes.
3. Sign in, open the student dashboard, and refresh it to regenerate the QR code. Old QR codes containing `localhost` or `192.168.x.x` will only work on the old local network and must be replaced.

## Where each deployed URL goes

| What it is | Environment variable / code | Example |
| --- | --- | --- |
| Public frontend URL used in QR codes | `VITE_PUBLIC_APP_URL` in the **frontend** Static Site | `https://bmsce-hostel.onrender.com` |
| Public API URL used by the browser | `VITE_API_URL` in the **frontend** Static Site, after updating `client/src/api/axios.ts` as above | `https://hostel-api.onrender.com` |
| Frontend origin allowed by backend CORS | `CLIENT_URL` in the **backend** Web Service | `https://bmsce-hostel.onrender.com` |
| Database connection | `DATABASE_URL` in the **backend** Web Service | Render Postgres internal URL |

## 7. QR verification test

Use mobile data (turn Wi-Fi off) and scan a newly generated QR code. It should open:

```text
https://your-frontend.onrender.com/verify/student/<token>
```

No login is required for the scanner. The verification endpoint is intentionally public and only returns the QR’s permitted student/room details.

## 8. Razorpay notes

- Keep Razorpay secrets only in the backend Render environment.
- Use test keys while testing and live keys only when you are ready to take real payments.
- After changing from test to live keys, redeploy the backend and test the complete booking/payment flow again.
- If you configure Razorpay webhooks later, use the deployed API URL—not a localhost URL.

## Common deployment failures

| Symptom | Likely fix |
| --- | --- |
| Browser requests go to the frontend URL’s `/api/...` and return 404 | Add `VITE_API_URL` and make the `axios.ts` update in Step 4, then rebuild the frontend. |
| Refreshing `/verify/student/...` returns 404 | Add the `/* → /index.html` Rewrite rule to the Render Static Site. |
| Backend says a request is blocked by CORS | Set backend `CLIENT_URL` to the exact frontend HTTPS URL and redeploy. |
| QR opens localhost or a LAN IP | Set `VITE_PUBLIC_APP_URL` to the deployed frontend URL and redeploy/reload the dashboard. |
| Backend cannot connect to Postgres | Use the database Internal URL for a backend in the same Render region; verify `DATABASE_URL` is set in the backend, not the frontend. |
| Render service fails to start | Ensure the backend Root Directory is `server` and Start Command is `npm start`. |

## Optional custom domain

After everything works with `onrender.com` URLs, add a custom domain in both Render services. Update all three URL settings (`VITE_PUBLIC_APP_URL`, `VITE_API_URL`, and `CLIENT_URL`) to the final HTTPS domain names and redeploy affected services.

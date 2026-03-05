# Deploy backend on Replit (no card)

Use this when you import **Developerdannyjames1/Alishba_project** into Replit so the backend runs from the `server/` folder.

## 1. Import the repo

1. Go to [replit.com](https://replit.com) and sign in (e.g. with GitHub).
2. Click **Create Repl**.
3. Choose **Import from GitHub**.
4. Paste: `https://github.com/Developerdannyjames1/Alishba_project`
5. Click **Import from GitHub**. Replit will clone the repo.

## 2. Set environment variables (Secrets)

1. In the left sidebar, click the **Lock** icon (Secrets / Tools).
2. Add these **Secrets** (Replit exposes them as env vars):

   | Key | Value |
   |-----|--------|
   | `MONGO_URI` | Your MongoDB Atlas connection string |
   | `JWT_SECRET` | Your JWT secret (e.g. long random string) |
   | `CLIENT_URL` | Your Vercel frontend URL, e.g. `https://your-app.vercel.app` |

3. Save. Do **not** commit these values; they stay in Replit only.

## 3. Run the backend

1. Click **Run** (top). Replit will run `cd server && npm install && npm start` (from `.replit`).
2. Wait until the console shows something like `Server running on http://0.0.0.0:5000` (or the port Replit assigns).
3. The app will get a public URL like `https://your-repl-name.username.repl.co`. Use that as your backend URL.

## 4. Deploy (always-on URL)

1. In the top bar, click **Deploy** (or **Deployment**).
2. **Important:** Set the **Run** / **Start** command for the deployment to:
   ```bash
   npm run start:server
   ```
   (This runs the backend from `server/`, not the frontend.) If you don’t set this, Replit may run `npm start` from the repo root (Vite) and the deploy will fail.
3. Ensure **Secrets** (Lock icon) are set: `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL`. They apply to Deploy as well.
4. Create/update the deployment so the app gets a stable public URL.
5. Copy that URL (e.g. `https://alishbaproject--developerdigita.replit.app`).

## 5. If deploy failed (“failed to publish”)

- Open **Deploy** → your deployment → **Logs** to see the error.
- Set the deployment **Start command** to: `npm run start:server` (see step 4 above).
- Confirm **Secrets** are set (Lock icon): `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL`.
- **Redeploy** after changing the start command or secrets.

## 6. Point Vercel at the backend

In your **Vercel** project → **Settings** → **Environment Variables**:

- **VITE_API_URL** = `https://YOUR-REPL-URL.repl.co/api`
- **VITE_SOCKET_URL** = `https://YOUR-REPL-URL.repl.co`

Redeploy the frontend so it uses the new backend URL.

---

**Note:** On the free tier the Repl may sleep when idle; the first request after sleep can be slow (cold start).

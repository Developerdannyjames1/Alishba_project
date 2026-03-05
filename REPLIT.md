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
2. Create a deployment so the app gets a stable public URL that stays up (within Replit’s free limits).
3. Copy that URL (e.g. `https://alishba-api.username.repl.co`).

## 5. Point Vercel at the backend

In your **Vercel** project → **Settings** → **Environment Variables**:

- **VITE_API_URL** = `https://YOUR-REPL-URL.repl.co/api`
- **VITE_SOCKET_URL** = `https://YOUR-REPL-URL.repl.co`

Redeploy the frontend so it uses the new backend URL.

---

**Note:** On the free tier the Repl may sleep when idle; the first request after sleep can be slow (cold start).

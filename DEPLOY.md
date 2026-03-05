# Deploy Event Sphere Management

## Frontend (Vercel)

### 1. Push your code to GitHub

```bash
git remote add origin https://github.com/alishba4024/Events-Sphere-Management.git
git branch -M main
git push -u origin main
```

### 2. Import the project in Vercel

1. Go to [vercel.com](https://vercel.com) and sign in (use GitHub).
2. Click **Add New…** → **Project**.
3. Import the repo **alishba4024/Events-Sphere-Management**.
4. Leave **Root Directory** as `.` (project root).
5. Vercel will detect Vite and use:
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
6. Click **Deploy**. The first deploy may succeed without env vars, but the app will need the backend URL to work fully.

### 3. Set environment variables (after backend is deployed)

In the Vercel project: **Settings** → **Environment Variables**, add:

| Name              | Value                    | Notes                    |
|-------------------|--------------------------|--------------------------|
| `VITE_API_URL`    | `https://your-api.com/api` | Your backend API base URL (no trailing slash). |
| `VITE_SOCKET_URL` | `https://your-api.com`   | Same origin as API for Socket.IO. |

Redeploy after changing env vars so the frontend build picks them up.

---

## Backend (separate host)

Vercel does not run long-lived servers or WebSockets. Deploy the **server** to a Node-friendly host and point the frontend at it.

### Backend on Render (recommended, no card required)

This repo includes a **`render.yaml`** Blueprint so you can deploy the API in a few steps.

1. **Sign in:** Go to [render.com](https://render.com) and sign in with GitHub.
2. **New Blueprint:** Click **Dashboard** → **New +** → **Blueprint**.
3. **Connect repo:** Select **Developerdannyjames1/Alishba_project** (or your fork). Render will detect `render.yaml` in the root.
4. **Set env vars:** In the Blueprint preview, open the **alishba-api** service and add:
   - **MONGO_URI** – Your MongoDB Atlas connection string.
   - **JWT_SECRET** – A long random string (e.g. from `openssl rand -base64 32`).
   - **CLIENT_URL** – Your Vercel frontend URL, e.g. `https://your-app.vercel.app` (no trailing slash).
5. **Create resources:** Click **Apply**. Render will create the web service and deploy from the `server/` directory.
6. **Backend URL:** After deploy, the API will be at `https://alishba-api.onrender.com` (or the URL shown in the dashboard). Use this for **VITE_API_URL** and **VITE_SOCKET_URL** in Vercel.

**Note:** On the free tier the service sleeps after ~15 minutes of no traffic; the first request after sleep may take 30–60 seconds (cold start).

### Other options

- **Railway** – [railway.app](https://railway.app): connect repo, set root to `server`, add `MONGO_URI` and `CLIENT_URL`.
- **Fly.io** – [fly.io](https://fly.io): use the `server/Dockerfile` and `server/fly.toml`; requires adding payment info for new apps.

### Backend env vars (e.g. on Railway/Render)

- `MONGO_URI` – MongoDB connection string (required).
- `PORT` – Set by the host (e.g. Railway/Render); keep default in code if they inject it.
- `CLIENT_URL` – Your Vercel frontend URL, e.g. `https://your-app.vercel.app` (for CORS and Socket.IO).
- `JWT_SECRET` (or whatever your server uses) – keep secret.

### CORS

The backend already uses `CLIENT_URL` for CORS. Set `CLIENT_URL` to your Vercel URL (e.g. `https://events-sphere-management.vercel.app`) so the browser allows API and Socket.IO requests.

---

## Summary

1. Push to GitHub.
2. Import **alishba4024/Events-Sphere-Management** in Vercel and deploy (frontend).
3. Deploy the **server** folder to Railway, Render, or Fly.io and configure MongoDB + env vars.
4. In Vercel, set `VITE_API_URL` and `VITE_SOCKET_URL` to your backend URL and redeploy.

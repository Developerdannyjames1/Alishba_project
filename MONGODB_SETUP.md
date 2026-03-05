# MongoDB Setup Guide

You need a MongoDB database. Here are your options:

---

## Option 1: MongoDB Atlas (Free, Recommended — No Install)

**Best if:** You don't have Docker or don't want to install MongoDB locally.

### Steps:

1. **Sign up** → https://www.mongodb.com/cloud/atlas/register  
   - Create a free account (email or Google)

2. **Create a cluster**
   - Choose **M0 FREE** tier
   - Pick a region close to you
   - Click **Create**

3. **Create a database user**
   - Go to **Database Access** → **Add New Database User**
   - Username: `expoadmin`
   - Password: choose one (e.g. `expo123`) and save it
   - Click **Add User**

4. **Allow network access**
   - Go to **Network Access** → **Add IP Address**
   - Click **Allow Access from Anywhere** (adds `0.0.0.0/0`)
   - Click **Confirm**

5. **Get your connection string**
   - Go to **Database** → **Connect** → **Connect your application**
   - Copy the connection string, e.g.:
   ```
   mongodb+srv://expoadmin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
   - Replace `<password>` with your actual password
   - Add your database name: change `?retryWrites` to `expoDB?retryWrites`

6. **Update `server/.env`**
   ```
   MONGO_URI=mongodb+srv://expoadmin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/expoDB?retryWrites=true&w=majority
   ```

---

## Option 2: Docker (If You Have Docker)

```bash
docker compose up -d
```

MongoDB runs on `localhost:27017`. The `.env` is already set for this.

---

## Option 3: Local MongoDB (Manual Install)

If you install MongoDB yourself:

```bash
# macOS with Homebrew (may need: sudo chown -R $(whoami) /usr/local/Cellar)
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

Then in `server/.env`:
```
MONGO_URI=mongodb://localhost:27017/expoDB
```

---

## Troubleshooting: "bad auth : authentication failed"

This means the username or password in your connection string is wrong. Try:

### 1. Verify credentials in Atlas
- Go to **Database Access** → find your user (e.g. `dev`)
- Click **Edit** → **Edit Password** → set a new simple password (letters + numbers only, no `@`, `#`, `:`, etc.)
- Use that password in `server/.env`

### 2. URL-encode special characters
If your password has `@`, `#`, `:`, `/`, etc., encode them:
- `@` → `%40`
- `#` → `%23`
- `:` → `%3A`

Example: password `pass@123` → use `pass%40123` in the connection string.

### 3. Create a new user
- **Database Access** → **Add New Database User**
- Username: `expoadmin`
- Password: `expo123` (simple, no special chars)
- Update `server/.env`:
  ```
  MONGO_URI=mongodb+srv://expoadmin:expo123@cluster0.qckvwug.mongodb.net/expoDB?retryWrites=true&w=majority
  ```
  *(Replace `cluster0.qckvwug` with your cluster host from Atlas.)*

---

## Verify Connection

After setup, run:

```bash
cd server
npm run dev
```

You should see: `MongoDB Connected`

# Telegram Auto Join Bot

An automated ecosystem for managing private Telegram channel join requests. This project consists of two operational modes: a **Production Bot** that handles incoming join requests in real-time, and a **Local Cleanup Script** used to mass-approve backlogged requests.

---

## 🛠️ Project Architecture

- **`index.js` (The Production Bot)**: Runs 24/7 on a cloud server. It uses the `telegraf` package via Webhooks (or Polling in dev) to instantly auto-approve new members and DM them a welcome message.
- **`cleanup.js` (The Local Cleanup Script)**: Run manually from your computer only. It uses the MTProto `telegram` (GramJS) engine to fetch historical lists of waiting users and clear the channel queue in bulk.
- **`logger.js`**: Provides automatic daily rotating logs for file storage, categorized by log level (Info, Error, Warn).

---

## 📂 Project Structure

```text
telegram-auto-join-bot/
├── logs/                         # Generated automatically by logger
│   ├── app-YYYY-MM-DD.log
│   ├── warn-YYYY-MM-DD.log
│   └── error-YYYY-MM-DD.log
├── cleanup.js                    # Local Userbot script for bulk approval
├── index.js                      # Main Bot script (Production entry point)
├── logger.js                     # Winston logger configuration
├── package.json                  # Dependencies mapping
└── .env                          # Local environment settings (Keep secure)
```

---

## ⚙️ Environment Variables (`.env`)

Create a `.env` file in the root folder. Fill out the corresponding parameters depending on where you are running the project:

```env
# ──── BOTH ENVIRONMENT SETTINGS ────
BOT_TOKEN=1234567890:ABCdefGhIJKlmNoPQRstUVwxyZ  # From @BotFather

# ──── PRODUCTION ENGINE ONLY ────
NODE_ENV=production                             # Set to 'production' on server
PORT=3000                                       # Cloud server port
DOMAIN_URL=https://render.com          # Your deployment URL

# ──── LOCAL CLEANUP SCRIPT ONLY ────
TELEGRAM_API_ID=1234567                         # From https://telegram.org
TELEGRAM_API_HASH=abcdef0123456789abcdef012345  # From https://telegram.org
CHANNEL_CHAT_ID=4446920286               # Target Channel ID (Without -100 prefix)
USERBOT_SESSION_STRING=1B...U=                  # Pre-authenticated session token
```

---

## 🔑 How to Generate your `USERBOT_SESSION_STRING`

To run the local `cleanup.js` script, you must generate a persistent session string locally.

This token string functions like an active authorization cookie, letting your `cleanup.js` script connect completely pre-authenticated.

### Prerequisites for Token Generation

1. Make sure `TELEGRAM_API_ID` and `TELEGRAM_API_HASH` are already added inside your `.env` configuration file.

### Step-by-Step Generation

1. Run the utility file from your local console terminal:
   ```bash
   node ./session-generator.js
   ```
2. Type in your mobile number containing the specific country prefix formatting (e.g., `+251...`).
3. Retrieve the official numerical identification token code sent to your active Telegram application device profile and provide it to the text prompt.
4. If your profile utilizes Two-Factor Authentication (2FA), submit your account security password string.
5. Once authenticated, a long text block sequence will print out to the screen.
6. Copy this continuous block string and map it to your structural environment assignment target:
   ```env
   USERBOT_SESSION_STRING=1BabcDeFGHi...jklMNoP=
   ```

_Once configured, your local cleanup script will bypass all login confirmation protocols during sub-sequent runs._

---

## 🚀 Execution & Command Guide

### 1. Running the Live Bot (Production / Local Testing)

The Live Bot handles requests in real-time. It uses Long Polling locally, but will automatically switch to Webhook mode if `NODE_ENV=production` is detected.

- **Local Development with hot-reload**:
  ```bash
  npm run dev
  ```
- **Standard Startup / Production Node Deployment**:
  ```bash
  npm start
  ```

### 2. Running the Bulk Cleanup Script (Local Computer Only)

This script is **omitted from production deployment** to save resource size, because it utilizes development dependencies (`devDependencies`).

- **Run the bulk approval routine**:
  ```bash
  node ./cleanup.js
  ```

---

## 📦 Dependency Optimization Strategy

To keep the cloud server lightweight and fast, dependencies are segmented inside `package.json`:

1.  **`dependencies`**: System critical tools needed to run the 24/7 live bot configuration (`telegraf`, `winston`, `dotenv`).
2.  **`devDependencies`**: Desktop tools used strictly for local operations. The MTProto library (`telegram`) is located here so that it **does not install on production**.

### How Production skips the `telegram` library:

When deploying to cloud networks (like Render, Railway, or Heroku), make sure you configure your server environment variables to include:

- `NODE_ENV=production`

If you are deploying manually on a VPS terminal, prevent development installations by utilizing either of these commands:

```bash
npm install --production
# OR
npm ci --omit=dev
```

---

## ⚠️ Operational Notes

- **Channel Permissions**: For both mechanisms to work seamlessly, make sure **both** your Bot profile and your Userbot profile have been promoted to **Administrators** inside the target channel with the `Invite Users via Link` permission active.
- **Formatting Syntax**: The live bot sends HTML messages using `parse_mode: 'HTML'`. If you change string templates, ensure all tags comply with valid closed XML layouts (`<b>`, `<a>`) to prevent parser validation rejections.

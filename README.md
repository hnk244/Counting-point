# Count Point

Real-time score tracking app built with React, Vite, Prisma (MongoDB), and Vercel Serverless Functions.

## Features

- 🎯 Create game rooms with shareable 4-digit codes
- 👥 Add participants and track scores in real-time
- 📊 View game history
- 📱 QR code sharing for easy room access
- ⚡ Deployed on Vercel with serverless API

## Tech Stack

- **Frontend**: React 19, React Router, TailwindCSS 4, Vite
- **Backend**: Vercel Serverless Functions (Node.js)
- **Database**: MongoDB via Prisma ORM
- **Real-time**: Client-side polling (2s interval)

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (or npm/yarn)
- A MongoDB database (e.g. [MongoDB Atlas](https://www.mongodb.com/atlas) free tier)

### Installation

```bash
pnpm install
```

### Environment Variables

Create a `.env` file:

```env
DATABASE_URL="mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<dbname>?retryWrites=true&w=majority"
```

### Database Setup

```bash
pnpm prisma:generate
pnpm prisma:push
```

### Development

Run the Vite dev server and Express backend together:

```bash
# Terminal 1 - Frontend
pnpm dev

# Terminal 2 - Backend (for local dev with Socket.io)
pnpm dev:server
```

The app will be available at `http://localhost:5173`.

---

## Deploying to Vercel

### Step 1: Push to GitHub

Make sure your code is pushed to a GitHub repository.

```bash
git add .
git commit -m "Configure for Vercel deployment"
git push origin main
```

### Step 2: Create a Vercel Project

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **"Add New..." → "Project"**
3. Import your `Counting-point` repository
4. Vercel will auto-detect the framework as **Vite**

### Step 3: Configure Environment Variables

In the Vercel project settings, add the following environment variable:

| Name | Value |
|------|-------|
| `DATABASE_URL` | `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<dbname>?retryWrites=true&w=majority` |

> **Important**: Use your MongoDB Atlas connection string. Make sure to:
> - Allow connections from **all IPs** (`0.0.0.0/0`) in Atlas Network Access (Vercel uses dynamic IPs)
> - URL-encode special characters in the password

### Step 4: Configure Build Settings

Vercel should auto-detect these from `vercel.json`, but verify:

| Setting | Value |
|---------|-------|
| **Framework Preset** | Vite |
| **Build Command** | `prisma generate && vite build` |
| **Output Directory** | `dist` |
| **Install Command** | `pnpm install` |

### Step 5: Deploy

Click **"Deploy"**. Vercel will:
1. Install dependencies
2. Run `prisma generate` to build the Prisma client
3. Build the Vite frontend
4. Deploy serverless functions from the `api/` directory

### Step 6: Verify

Once deployed, your app will be live at `https://your-project.vercel.app`.

---

## Project Structure

```
├── api/                    # Vercel Serverless Functions
│   ├── _prisma.ts          # Shared Prisma client
│   ├── rooms/
│   │   ├── index.ts        # POST /api/rooms
│   │   └── [code]/
│   │       ├── index.ts    # GET /api/rooms/:code
│   │       ├── participants.ts  # POST /api/rooms/:code/participants
│   │       ├── games.ts    # POST /api/rooms/:code/games
│   │       └── history.ts  # GET /api/rooms/:code/history
│   ├── scores/
│   │   └── [scoreId]/
│   │       ├── increment.ts # POST /api/scores/:id/increment
│   │       └── decrement.ts # POST /api/scores/:id/decrement
│   └── games/
│       └── [gameId]/
│           └── end.ts       # POST /api/games/:id/end
├── app/                     # React frontend
│   ├── main.tsx
│   ├── lib/
│   │   └── usePolling.ts    # Polling hook (replaces WebSocket)
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── RoomSetup.tsx
│   │   └── GameRoom.tsx
│   └── components/
│       └── HistoryModal.tsx
├── prisma/
│   └── schema.prisma
├── server/                  # Express server (local dev / self-hosted)
│   ├── index.ts
│   └── prisma.ts
├── vercel.json
└── package.json
```

## Troubleshooting

### "ECONNREFUSED" during Vercel build
Make sure `DATABASE_URL` is set correctly in Vercel environment variables.

### MongoDB connection issues on Vercel
In MongoDB Atlas → **Network Access**, add `0.0.0.0/0` to allow all IPs (required for Vercel serverless).

### API routes returning 404
Check the `vercel.json` rewrites match your API paths. Dynamic routes use `[param]` folder syntax.

---

## Docker Deployment (Alternative)

```bash
docker build -t count-point .
docker run -p 3000:3000 -e DATABASE_URL="..." count-point
```

---

Built with ❤️ using React + Vite + Vercel.

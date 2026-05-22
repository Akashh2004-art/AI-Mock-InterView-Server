# InterviewAI — Server

> Backend API for the InterviewAI mock interview platform. Handles interview generation, answer storage, AI feedback, and performance stats.

---

## Tech Stack

- **Node.js** + **Express** + **TypeScript**
- **Drizzle ORM** — Database queries
- **Supabase** (PostgreSQL) — Database
- **Groq API** (llama-3.3-70b) — AI question generation and feedback
- **Deployed on Render**

---

## API Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/generate` | Generate interview questions by role |
| POST | `/api/generate/resume` | Generate questions from uploaded resume PDF |
| GET | `/api/interviews/user/:userId/recent` | Get recent interviews for a user |
| GET | `/api/interviews/user/:userId/stats` | Get user stats (avg score, best score) |
| GET | `/api/interviews/:id/questions` | Get questions for an interview |
| POST | `/api/answers` | Save a user's answer |
| GET | `/api/answers/interview/:id` | Get all answers for an interview |
| POST | `/api/feedback` | Generate AI feedback for an answer |
| GET | `/api/feedback/interview/:id` | Get all feedback for an interview |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project (PostgreSQL)
- A [Groq](https://console.groq.com) API key

### Installation

```bash
# Clone the repo
git clone https://github.com/Akashh2004-art/AI-Mock-InterView-Server.git
cd AI-Mock-InterView-Server

# Install dependencies
npm install
```

### Environment Variables

Create a `.env` file in the root directory:

```env
DATABASE_URL=your_supabase_connection_string
PORT=3000
GROQ_API_KEY=your_groq_api_key
```

> Get your `DATABASE_URL` from Supabase → Project Settings → Database → Connection String (URI mode).

### Database Setup

```bash
# Push schema to Supabase
npm run db:push
```

### Run Locally

```bash
npm run dev
```

Server will be running at `http://localhost:3000`

---

## Project Structure

```
server/src/
├── db/
│   ├── index.ts        # Drizzle DB connection
│   └── schema.ts       # Table definitions
├── routes/
│   ├── generate.ts     # AI question generation
│   ├── interviews.ts   # Interview CRUD + stats
│   ├── answers.ts      # Answer storage
│   └── feedback.ts     # AI feedback generation
├── grok.ts             # Groq API client
└── index.ts            # Express app entry point
```

---

## Database Schema

| Table | Description |
|-------|-------------|
| `users` | Clerk user records |
| `interviews` | Interview sessions |
| `questions` | Generated questions per interview |
| `answers` | User answers per question |
| `feedback` | AI feedback and scores per answer |

---

## Deployment (Render)

1. Push your code to GitHub
2. Create a new **Web Service** on [render.com](https://render.com)
3. Connect your GitHub repo
4. Set **Build Command:** `npm install && npm run build`
5. Set **Start Command:** `npm start`
6. Add environment variables in Render dashboard:
   - `DATABASE_URL`
   - `GROQ_API_KEY`
   - `PORT` → `3000`

---

## Related

- 🖥️ **Frontend Repo:** [AI-Mock-InterView](https://github.com/Akashh2004-art/AI-Mock-InterView)

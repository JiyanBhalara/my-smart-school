# My Smart School

A learning management system for small schools and individual teachers. Teachers publish
lessons with written content, videos and quizzes; students work through them and get an
automatically scored report card. Both sides can talk to each other in 1:1 and group chats
with file sharing.

Built solo with Next.js 15 and TypeScript.

> **Screenshot / demo**
>
> _TODO: drop a screenshot at `docs/screenshot.png` and a short demo GIF at `docs/demo.gif`,
> then replace this block with:_
> `![My Smart School](docs/screenshot.png)`

## Who it's for

Two roles, chosen at onboarding:

- **Teachers** create lessons, upload material and videos, write quizzes, and track how each
  student is doing.
- **Students** work through published lessons, take quizzes, and see their own report card.

## Features

**Lessons**
- Lesson library with subjects and tags, published/draft visibility
- Rich Markdown content pages plus file attachments (PDF, PPT, DOC, images)
- Direct-to-storage MP4 video uploads with live progress

**Quizzes**
- Multiple-choice quizzes with per-question images, points and explanations
- Time limits, attempt caps, pass marks, optional question/option shuffling
- Server-side scoring — answers are never marked in the browser
- Per-attempt reports for students, per-student breakdowns for teachers

**Reports**
- Student report cards: scores, attempts, pass/fail, trends over time
- Teacher view across students, with private per-student notes
- Charts via Chart.js

**Chat**
- 1:1 teacher↔student conversations with unread counts
- Group chats with admins, member management and pinned messages
- File attachments in both, served through signed URLs

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15.4 (App Router), React 19 |
| Language | TypeScript |
| Auth | NextAuth — Google OAuth + email/password, Prisma adapter, JWT sessions |
| Database | PostgreSQL via Prisma 6 |
| File storage | Supabase Storage (lesson files, chat uploads, quiz images) |
| Video storage | Vercel Blob (client-side direct upload) |
| Styling | Tailwind CSS 4 |
| Charts | Chart.js + react-chartjs-2 |
| Validation | zod |
| Hosting | Vercel |

## Local setup

**Requirements:** Node.js 20+ (the Supabase client warns on 18), npm, and a PostgreSQL
database — Supabase is the easiest path since the app already uses it for storage.

```bash
git clone <your-repo-url>
cd my-smart-school
npm install
```

Create a `.env` in the project root with the variables listed below, then apply the schema
and start the dev server:

```bash
npx prisma migrate deploy   # or `prisma db push` for a throwaway database
npx prisma generate
npm run dev
```

The app runs at http://localhost:3000.

### Google OAuth

In the Google Cloud Console, create an **OAuth 2.0 Client ID** of type *Web application* and
register this exact redirect URI:

```
http://localhost:3000/api/auth/callback/google
```

Add your deployed equivalent (`https://<your-domain>/api/auth/callback/google`) for production.

### A note on video uploads in development

Videos upload straight from the browser to Vercel Blob. Blob then calls back into the app to
record the video, and that callback cannot reach `localhost`. Locally the upload will complete
and the progress bar will finish, but no video row is created. To exercise the whole flow, run
a tunnel (for example `ngrok http 3000`) and point `NEXTAUTH_URL` at the public URL, or test on
a deployed preview.

## Environment variables

Names only — put the values in `.env`, which is gitignored. Never commit real credentials.

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_URL` | Base URL of the app (`http://localhost:3000` in development) |
| `NEXTAUTH_SECRET` | Session signing secret — generate with `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (browser-safe) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key — server only, never expose |
| `SUPABASE_BUCKET` | Bucket for quiz images (defaults to `quiz-assets`) |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob read/write token for video uploads |

## Scripts

| Command | Does |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |

## Project layout

```
app/
  (root)/        pages: lessons, quizzes, chat, groups, reports
  api/           route handlers (~41 endpoints)
  utils/         NextAuth options
components/      UI components
contexts/        React contexts (upload progress)
lib/
  auth-guard.ts  shared auth/authorization guards for API routes
  validation.ts  zod schemas for request bodies
  prisma.ts      Prisma client singleton
prisma/
  schema.prisma  data model
  migrations/    migration history
```

## Known limitations

- **Lesson access is author-or-published.** There is no enrolment model, so any signed-in user
  can read any published lesson. Adding a real roster is tracked as future work.
- **No rate limiting.** Signup, login and the upload endpoints are unthrottled. Serverless needs
  a shared store (such as Upstash Redis) to do this properly.
- **Teacher role is self-assigned at onboarding.** The `TeacherStatus` model exists for selfie
  verification but is never written, so anyone can pick "Teacher" during onboarding.

# aise-moods 🌤️

**A simple daily mood tracker.** Create an account, log in, and record how you're
feeling one day at a time — then look back over your history.

- 🔗 **Live app:** [aise-moods.vercel.app](https://aise-moods.vercel.app/)
- ⚙️ **Backend API:** [aise-moods.onrender.com](https://aise-moods.onrender.com/)

## What it does

1. **Register** with an email and password.
2. **Log in** — the backend checks your password and hands back a session token that keeps you logged in.
3. **Log a mood** from five options (great, good, okay, low, awful), with an optional note.
4. **See your history** — your past moods, newest first. You only ever see your own.

**Built with:** React + Vite (frontend), Rust + Axum (backend), MongoDB (database),
with JWT for sessions and bcrypt for password hashing.

## Strengths & weaknesses

| 💪 Strengths | ⚠️ Weaknesses |
| --- | --- |
| Passwords hashed with bcrypt — never stored as plain text | No rate limiting, so login can be brute-forced |
| Sessions use signed JWTs that expire after 7 days | Token lives in `localStorage` (exposed to XSS) and can't be revoked early |
| Every mood is scoped to its owner — you can't see anyone else's | CORS is fully open — any website can call the API |
| Login gives one uniform error, so it doesn't reveal which emails exist | Timing still leaks whether an email is registered |
| Small, clearly-structured Rust API and React frontend | No input validation — empty/weak passwords and malformed emails are accepted |
| Frontend tests cover the register, login, and mood flows | No unique index on email, so duplicate accounts are possible |

> **In short:** solid enough as a learning project and demo, but not hardened for
> production. See the weaknesses above for what to fix first.

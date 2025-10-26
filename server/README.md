# Classmates Social - Backend (Node.js + Express + MySQL)

Beginner-friendly backend API for a simple social media app for high school students.

## Tech
- Node.js + Express
- MySQL (mysql2/promise)
- JWT Auth (jsonwebtoken)
- Password hashing (bcryptjs)
- Validation (express-validator)
- File uploads (multer)

## Prerequisites
- Node.js 18+
- MySQL 8+

## Setup
1. Create database and tables:
   - Update `.env` with your MySQL credentials.
   - Run the SQL in `sql/schema.sql`.

### Quick local DB using Docker
If you don't have MySQL locally, you can quickly run one using Docker Compose. A `docker-compose.yml` has been added to this folder.

Start MySQL:

```powershell
# From the server folder
docker compose up -d
# Wait a few seconds for MySQL to initialize
```

This starts a MySQL 8 container with:
- root password: `secret`
- database: `classmates_social`

Then set your environment variables (PowerShell example):

```powershell
$env:DB_HOST='127.0.0.1'
$env:DB_PORT='3306'
$env:DB_USER='root'
$env:DB_PASSWORD='secret'
$env:DB_NAME='classmates_social'
node src/index.js
```

To stop the DB:

```powershell
docker compose down
```

2. Install dependencies:
```bash
npm install
```

3. Run server in dev mode:
```bash
npm run dev
```

Server runs on `http://localhost:4000` by default.

## Environment Variables (.env)
See `.env.example` for all variables.

## API Overview
- Auth: `POST /api/auth/signup`, `POST /api/auth/login`, `GET /api/auth/me`
- Posts: `POST /api/posts` (text/image), `GET /api/feed`, `GET /api/users/:id/posts`
- Follows: `POST /api/follow/:userId`, `DELETE /api/follow/:userId`, `GET /api/following`
- Messages: `POST /api/messages/:receiverId`, `GET /api/messages/:userId`
- Users: `GET /api/users/search?q=`, `GET /api/users/:id`

## Notes
- Image uploads are stored in `/uploads` and served statically.
- Keep your `JWT_SECRET` safe.

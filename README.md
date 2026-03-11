# 📝 Notes App — REST API Backend

A RESTful backend service for managing personal notes with authentication, built as a learning project to practice Node.js backend development from scratch.

[![Node.js](https://img.shields.io/badge/Node.js-ESM-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.x-000000?style=flat&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=flat&logo=mongodb&logoColor=white)](https://mongoosejs.com/)
[![Cloudinary](https://img.shields.io/badge/Cloudinary-Avatar_Upload-3448C5?style=flat&logo=cloudinary&logoColor=white)](https://cloudinary.com/)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)

---

## ✨ Features

- 🔐 **JWT Authentication** — Register, login, logout with access & refresh token rotation via HTTP-only cookies
- 📧 **Password Reset** — Secure recovery flow via email link (Nodemailer + Handlebars HTML template)
- 👤 **Avatar Upload** — Update profile photo stored on Cloudinary via Multer
- 📋 **Notes CRUD** — Full create, read, update, delete for personal notes, scoped per user
- 🔍 **Full-text Search** — MongoDB text index on `title` and `content` fields with weighted scoring
- 🏷️ **Tag Filtering** — Filter notes by category (Work, Personal, Meeting, Shopping, Ideas, Travel, Finance, Health, Important, Todo)
- 📄 **Pagination** — Configurable `page` / `perPage` query params with total count response
- ✅ **Request Validation** — All endpoints validated with `celebrate` (Joi-based)
- 🪵 **Structured Logging** — HTTP request logging via `pino-http` + `pino-pretty`

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js (ES Modules) |
| Framework | Express.js v5 |
| Database | MongoDB + Mongoose |
| Auth | JWT (jsonwebtoken) + bcrypt |
| Validation | celebrate (Joi) |
| File Storage | Cloudinary + Multer |
| Email | Nodemailer + Handlebars templates |
| Logging | pino-http + pino-pretty |
| Dev tooling | Nodemon, ESLint |

---

## 📂 Project Structure

```
src/
├── constants/          # Enums: note tags
├── controllers/        # Route handlers: auth, notes, user
├── db/                 # MongoDB connection
├── middleware/         # authenticate, errorHandler, logger, multer, notFoundHandler
├── models/             # Mongoose models: User, Note, Session
├── routes/             # Express routers: authRoutes, notesRoutes, userRoutes
├── services/           # Business logic: auth service
├── templates/          # Handlebars HTML email templates
├── utils/              # Helpers: saveFileToCloudinary, sendMail
├── validations/        # Joi schemas: auth, notes
└── server.js           # App entry point
```

---

## ⚙️ Getting Started

### Prerequisites

- Node.js `v18+`
- MongoDB (local or [Atlas](https://www.mongodb.com/atlas))
- Cloudinary account
- SMTP credentials (Gmail, Mailtrap, etc.)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/Ihor-Kotliarevskyi/nodejs-hw.git
cd nodejs-hw

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
# Fill in your values (see below)

# 4. Start the development server
npm run dev
```

### Environment Variables

```env
PORT=3000
MONGO_URL=mongodb+srv://<user>:<password>@cluster.mongodb.net/notes_db

JWT_SECRET=your_jwt_secret_key

FRONTEND_DOMAIN=http://localhost:5173

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASSWORD=your_smtp_password
```

---

## 📡 API Endpoints

### Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/register` | Register new user |
| `POST` | `/auth/login` | Login, set access + refresh tokens in cookies |
| `POST` | `/auth/logout` | Logout, clear session |
| `POST` | `/auth/refresh` | Refresh access token using refresh cookie |
| `POST` | `/auth/request-reset-email` | Send password reset email |
| `POST` | `/auth/reset-password` | Reset password with token |

### Notes *(requires authentication)*

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/notes` | List notes with pagination, search & tag filter |
| `GET` | `/notes/:noteId` | Get single note |
| `POST` | `/notes` | Create new note |
| `PATCH` | `/notes/:noteId` | Update note |
| `DELETE` | `/notes/:noteId` | Delete note |

**Query params for `GET /notes`:**

| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Page number (default: 1) |
| `perPage` | number | Items per page (default: 15) |
| `search` | string | Full-text search in title & content |
| `tag` | string | Filter by tag (e.g. `Work`, `Personal`) |

### Users *(requires authentication)*

| Method | Endpoint | Description |
|--------|----------|-------------|
| `PATCH` | `/users/me/avatar` | Upload/update profile avatar (multipart/form-data) |

---

## 🏷️ Note Tags

Notes can be tagged with one of the following categories:

`Work` · `Personal` · `Meeting` · `Shopping` · `Ideas` · `Travel` · `Finance` · `Health` · `Important` · `Todo`

---

## 🧪 Available Scripts

```bash
npm run dev    # Start dev server with hot reload (nodemon)
npm start      # Start production server
```

---

## 📝 What I Learned

- Building a RESTful API from scratch with Express.js v5 using ES Modules
- Implementing JWT authentication with HTTP-only cookies and refresh token rotation
- Designing MongoDB schemas with Mongoose, including text indexes for full-text search
- Handling file uploads with Multer and storing assets on Cloudinary
- Sending transactional emails with Nodemailer and HTML templates via Handlebars
- Centralizing request validation with celebrate (Joi) and global error handling middleware
- Structuring an Express app with clean separation of concerns: routes → controllers → services

---

<p align="center">Made with ☕ by <a href="https://github.com/Ihor-Kotliarevskyi">Ihor Kotliarevskyi</a></p>

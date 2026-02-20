# PyrexxBook

PyrexxBook is a full-stack social platform with:
- JWT authentication (access + refresh tokens)
- Real-time chat via Socket.IO
- Stories that expire in 24 hours
- Feed with posts, likes, and comments

## Stack
- Frontend: React + Vite
- Backend: Node.js + Express + Socket.IO
- Database: MongoDB + Mongoose

## Local setup

1. Install dependencies:
```bash
npm install
npm install --prefix server
npm install --prefix vite-project
```

2. Configure environment variables in `.env`:
```env
MONGO_URI=mongodb://127.0.0.1:27017/pyrexxbook
CLIENT_URL=http://localhost:5173
JWT_ACCESS_SECRET=replace_with_secure_secret
JWT_REFRESH_SECRET=replace_with_secure_secret
EMAIL_USER=optional_for_otp
EMAIL_PASS=optional_for_otp
PORT=5000
```

Optional frontend `.env` (inside `vite-project/`) for production API base:
```env
VITE_API_URL=https://your-api-domain.com
VITE_DEV_PROXY_TARGET=http://localhost:5000
```

3. Run apps:
```bash
npm run dev:client
npm run dev:server
```

## Production build

Build frontend and copy to backend static folder:
```bash
npm run build
```

Start server:
```bash
npm start
```

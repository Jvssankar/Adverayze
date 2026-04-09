# Adverayze Chat App

A real-time chat application built for the Adverayze technical assignment.

## Live Links
- **Live application** - https://adverayze.netlify.app/

## Tech Stack
- **Frontend:** React + Vite, Socket.io-client
- **Backend:** Node.js, Express, Socket.io
- **Database:** MongoDB compass

## Setup Instructions

### Prerequisites
Node.js v18+, MongoDB compass account

### Backend
```bash
cd backend
npm install
# Create .env with MONGO_URI, PORT, CLIENT_URL
npm run dev
```

### Frontend
```bash
cd frontend
npm install
# Create .env with VITE_API_URL
npm run dev
```


## Design Decisions
- Socket.io for real-time updates — avoids polling overhead
- "Delete for me" stores username in `deletedFor[]` array — simple and scalable
- "Delete for everyone" uses a boolean flag — clean soft delete
- Pinned messages stored on the message document itself
- Username stored in localStorage (persists across refresh)

## Tradeoffs & Assumptions
- No auth — username is trusted on client (sufficient for assignment scope)
- Single chat room — multi-room would require socket namespaces
- Messages capped at 200 per fetch — prevents performance issues

# QRTrack — Dynamic QR Code Generator & Analytics Platform

MERN stack application for creating dynamic QR codes and tracking scan analytics including scan count, device type, location (country/city), and time.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS |
| State | Zustand + React Query |
| Backend | Node.js + Express |
| Database | MongoDB (Mongoose) |
| Auth | JWT (access + refresh tokens) |
| QR generation | `qrcode` npm package |
| Analytics | `geoip-lite` + `ua-parser-js` |
| Charts | Recharts |

---

## Project Structure

```
qrtrack/
├── server/
│   ├── index.js              # Express app entry
│   ├── .env.example          # Environment variables template
│   ├── models/
│   │   ├── User.js           # User + plan limits
│   │   ├── QRCode.js         # Dynamic QR codes
│   │   └── ScanEvent.js      # Analytics events (TTL: 1 year)
│   ├── routes/
│   │   ├── auth.js           # Register, login, refresh, logout, me
│   │   ├── qr.js             # QR CRUD + image download
│   │   ├── analytics.js      # Overview + per-QR aggregations
│   │   └── redirect.js       # /r/:code — scan tracking + redirect
│   ├── middleware/
│   │   └── auth.js           # JWT protect middleware
│   └── services/
│       └── qrService.js      # QR image generation (PNG + SVG)
│
└── client/
    └── src/
        ├── App.jsx            # Routes + protected guard
        ├── pages/
        │   ├── LoginPage.jsx
        │   ├── RegisterPage.jsx
        │   ├── DashboardPage.jsx   # Overview stats + recent QRs
        │   ├── QRListPage.jsx      # All QR codes + actions
        │   ├── QRCreatePage.jsx    # Create with live preview
        │   ├── QREditPage.jsx      # Edit destination URL
        │   └── AnalyticsPage.jsx   # Full analytics dashboard
        ├── components/
        │   └── dashboard/Layout.jsx
        ├── store/authStore.js      # Zustand auth state
        └── utils/api.js           # Axios + auto token refresh
```

---

## Setup

### 1. Clone and install

```bash
git clone <your-repo>
cd qrtrack
npm run install:all
```

### 2. Configure server environment

```bash
cd server
cp .env.example .env
# Edit .env with your values:
# MONGODB_URI=mongodb+srv://...
# JWT_SECRET=your-secret-here
# BASE_URL=http://localhost:5000
# CLIENT_URL=http://localhost:5173
```

### 3. Start development

```bash
# From root — starts both server and client
npm run dev

# Or separately:
npm run server    # Express on :5000
npm run client    # Vite on :5173
```

---

## API Reference

### Auth
| Method | Route | Description |
|---|---|---|
| POST | /api/auth/register | Create account |
| POST | /api/auth/login | Login |
| POST | /api/auth/refresh | Refresh access token |
| POST | /api/auth/logout | Logout |
| GET | /api/auth/me | Get current user |

### QR Codes
| Method | Route | Description |
|---|---|---|
| GET | /api/qr | List all QR codes |
| POST | /api/qr | Create dynamic QR code |
| GET | /api/qr/:id | Get single QR code |
| PUT | /api/qr/:id | Update (change URL, style, etc.) |
| DELETE | /api/qr/:id | Delete QR code |
| GET | /api/qr/:id/image?format=png|svg | Download QR image |
| POST | /api/qr/preview | Live preview (no auth) |

### Analytics
| Method | Route | Description |
|---|---|---|
| GET | /api/analytics/overview | Dashboard summary stats |
| GET | /api/analytics/:refId?days=30 | Scans over time, device, OS, country |
| GET | /api/analytics/:refId/recent | Last 20 scan events |

### Redirect (public)
| Method | Route | Description |
|---|---|---|
| GET | /r/:code | Track scan + redirect to destination |

---

## Analytics Tracked Per Scan

- **Scan count** — total and unique (deduped per IP per 24h)
- **Device type** — mobile / tablet / desktop
- **OS** — Android, iOS, Windows, Mac OS, etc.
- **Browser** — Chrome, Safari, Firefox, etc.
- **Location** — country, city, region (via geoip-lite)
- **Time** — exact timestamp of each scan
- **Referer** — where the scan came from

---

## Key Features

- **Dynamic QR codes** — change destination URL anytime, QR code stays the same
- **Live QR preview** — see your QR update in real time as you type
- **Smart redirects** — send Android/iOS/Windows users to different URLs
- **Custom colors** — full foreground/background color control
- **SVG + PNG download** — high quality exports
- **JWT auth** — access + refresh token rotation
- **Analytics dashboard** — charts for scan trends, device, OS, top countries

---

## Production Deployment

### Backend (Render / Railway / Fly.io)
```bash
cd server
npm start
```

### Frontend (Vercel / Netlify)
```bash
cd client
npm run build
# Deploy /dist folder
# Set VITE_API_URL env var if using a separate domain
```

### MongoDB
Use MongoDB Atlas free tier — update `MONGODB_URI` in server `.env`.

---

## Free Plan Limits (default)
- 3 dynamic QR codes
- 5 short links  
- 1,000 scans/month

To upgrade users, update `user.plan` and `user.limits` in MongoDB directly or build a billing integration (Stripe/Razorpay).

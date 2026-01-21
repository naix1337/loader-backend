# KeyAuth.cc Backend - Production-Ready

**Sicheres NestJS Backend mit KeyAuth.cc Integration, Hardware Fingerprinting, und verschlüsselter Kommunikation**

---

## 🎯 Features

- ✅ **KeyAuth.cc Integration** - Login, License, Ban Check
- ✅ **Hardware Fingerprinting** - CPU, Disk, MAC, BIOS, OS mit Toleranzsystem
- ✅ **Risk Scoring** - Multi-Faktor Risikobewertung (0-100)
- ✅ **Verschlüsselung** - RSA-2048 + AES-256-GCM + HMAC-SHA256
- ✅ **Replay Protection** - Nonce + Timestamp Validation
- ✅ **Anti-VM Detection** - VMware, VirtualBox, Hyper-V, KVM
- ✅ **Session Management** - Sichere AES-verschlüsselte Sessions
- ✅ **Heartbeat System** - 60s Intervall mit Auto-Invalidierung
- ✅ **Audit Logging** - Login, Risk Events, Admin Actions
- ✅ **Rate Limiting** - DDoS Protection
- ✅ **Swagger Docs** - Automatische API-Dokumentation

---

## 📁 Projektstruktur

```
backend/
├── src/                      # Source Code
│   ├── modules/
│   │   ├── auth/            # JWT Authentifizierung
│   │   ├── keyauth/         # KeyAuth.cc Integration
│   │   ├── security/        # Encryption, Replay Protection
│   │   ├── hwid/            # Hardware Fingerprinting & Risk Scoring
│   │   ├── loader-api/      # C++ Loader API Endpoints
│   │   ├── licensing/       # License Management
│   │   ├── admin/           # Admin Panel
│   │   ├── forum/           # Forum System
│   │   └── realtime/        # WebSocket/Real-time
│   ├── prisma/
│   │   └── schema.prisma    # Database Schema (12 Models)
│   └── main.ts              # Entry Point
├── Server/                   # Server Deployment Files
│   ├── nginx.conf           # Nginx Config
│   ├── ecosystem.config.js  # PM2 Config
│   ├── setup-server.sh      # Server Installation
│   ├── deploy.sh            # Deployment Script
│   ├── backup-db.sh         # Database Backup
│   ├── .env.production.example
│   └── SERVER_DEPLOYMENT.md # Deployment Guide
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

---

## 🚀 Quick Start

### Local Development

```bash
# 1. Install dependencies
npm install

# 2. Setup environment
cp .env.example .env
# Edit .env with your settings

# 3. Start PostgreSQL & Redis
# (Docker or local installation)

# 4. Run migrations
npx prisma generate
npx prisma migrate dev

# 5. Start server
npm run start:dev
```

**API Dokumentation**: http://localhost:3000/api/docs

---

### Server Deployment (Ubuntu)

**Automatisch (empfohlen)**:
```bash
# 1. Auf Server
cd /var/www
git clone https://github.com/naix1337/loader-backend.git keyauth-backend
cd keyauth-backend

# 2. Server Setup
cd Server
chmod +x setup-server.sh deploy.sh
./setup-server.sh

# 3. Configure .env
cd ..
cp Server/.env.production.example .env
nano .env  # Edit settings

# 4. Deploy
cd Server
./deploy.sh
```

**Detaillierte Anleitung**: siehe [`Server/SERVER_DEPLOYMENT.md`](Server/SERVER_DEPLOYMENT.md)

---

## 🔐 Security Features

### Backend

| Feature | Status | Details |
|---------|--------|---------|
| KeyAuth.cc Integration | ✅ | Login, License, Ban Check |
| RSA Key Exchange | ✅ | RSA-2048 |
| AES Encryption | ✅ | AES-256-GCM |
| HMAC Signing | ✅ | SHA256 |
| Replay Protection | ✅ | Nonce + Timestamp (±30s) |
| HWID Fingerprinting | ✅ | CPU, Disk, MAC, BIOS, OS |
| Tolerance System | ✅ | 60% Similarity Threshold |
| Risk Scoring | ✅ | 0-100, 5 Faktoren |
| VM Detection | ✅ | VMware, VBox, etc. |
| Auto-Flagging | ✅ | Shadow-Ban ab 80% |
| Session Management | ✅ | AES-encrypted |
| Heartbeat | ✅ | 60s Intervall |
| Rate Limiting | ✅ | NestJS Throttler |
| Audit Logging | ✅ | All Actions |

---

## 📊 Database Schema

**12 Datenbank-Modelle** (Prisma):
- `User` - Benutzer mit Rollen, Bans, MFA
- `License` - Onetime, Time-based, Lifetime Keys
- `HWIDRecord` - Hardware Fingerprints mit Trust/Risk Scores
- `Session` - AES-verschlüsselte Sessions
- `Heartbeat` - Heartbeat Tracking
- `RiskEvent` - Security Events (HWID-Changes, VM, Geo)
- `LoginLog` - Login History
- `AuditLog` - Admin Actions
- `NonceStore` - Replay Protection
- `Category`, `Thread`, `Post` - Forum
- `DirectMessage` - DMs

---

## 📡 API Endpoints

### Loader API
- `POST /api/loader/handshake` - Initiate Handshake
- `POST /api/loader/challenge-response` - Complete Handshake
- `POST /api/loader/login` - User Login (AES-encrypted)
- `POST /api/loader/verify` - Session Verification
- `POST /api/loader/heartbeat` - Heartbeat
- `POST /api/loader/license` - License Activation

### Health & Docs
- `GET /health` - Health Check
- `GET /api/docs` - Swagger API Documentation

---

## 🔧 Tech Stack

- **Framework**: NestJS (TypeScript)
- **Database**: PostgreSQL 15
- **Cache**: Redis
- **ORM**: Prisma
- **Process Manager**: PM2 (Cluster Mode)
- **Reverse Proxy**: Nginx
- **SSL**: Let's Encrypt (Certbot)
- **API Docs**: Swagger/OpenAPI

---

## 📝 Environment Variables

Siehe `.env.example` für Development und `Server/.env.production.example` für Production.

**Wichtigste Variablen**:
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/keyauth_db
REDIS_HOST=localhost
JWT_SECRET=your-secret-key
KEYAUTH_OWNER_ID=XqG07zEkpw
KEYAUTH_APP_SECRET=1463fa804501c5c9d24f61dc401cba666470e492531e62da391593b2c7f5283d
```

---

## 🛠️ Nützliche Commands

**Development**:
```bash
npm run start:dev    # Dev Server
npm run build        # Build
npx prisma studio    # Database GUI
npx prisma migrate dev  # Create Migration
```

**Production**:
```bash
pm2 logs             # View Logs
pm2 restart all      # Restart
pm2 monit           # Monitor
```

---

## 📚 Dokumentation

- **Deployment**: [`Server/SERVER_DEPLOYMENT.md`](Server/SERVER_DEPLOYMENT.md) - Komplette Server-Setup-Anleitung
- **Security**: siehe Root-Verzeichnis `README_SECURITY.md`
- **API**: http://localhost:3000/api/docs (Swagger)

---

## 🔒 Security Notes

**WICHTIG für Production**:
- [ ] Ändere alle Secrets in `.env` (JWT_SECRET, etc.)
- [ ] Ändere PostgreSQL Password
- [ ] Generiere neue RSA Keys (siehe Deployment Guide)
- [ ] Aktiviere Firewall (UFW)
- [ ] Setup SSL (Let's Encrypt)
- [ ] Aktiviere PM2 Startup
- [ ] Setup Backups (Cronjob)

---

## 📄 License

Private Project

---

## 🆘 Support

Bei Problemen:
1. Prüfe Logs: `pm2 logs`
2. Prüfe Status: `pm2 status`
3. Siehe [`Server/SERVER_DEPLOYMENT.md`](Server/SERVER_DEPLOYMENT.md)

---

**Made with ❤️ for KeyAuth.cc Integration**

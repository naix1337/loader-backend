# KeyAuth Backend - Server Deployment Guide

## 🎯 Übersicht

Diese Anleitung zeigt, wie Sie das KeyAuth Backend auf einem Linux-Server (Ubuntu/Debian) deployen.

---

## 📋 Voraussetzungen

### Server Requirements
- **OS**: Ubuntu 20.04/22.04 LTS (empfohlen) oder Debian 11/12
- **RAM**: Minimum 2GB, empfohlen 4GB+
- **CPU**: 2+ Cores
- **Disk**: 20GB+ SSD
- **Domain**: Eine registrierte Domain mit DNS-Zugriff

### Lokale Requirements
- SSH-Zugriff zum Server
- Git installiert (für Code-Transfer)

---

## 🚀 Schritt-für-Schritt Deployment

### 1. Server-Vorbereitung

**SSH auf Server verbinden**:
```bash
ssh root@your-server-ip
# oder
ssh username@your-server-ip
```

**System vorbereiten**:
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Create non-root user (wenn noch nicht vorhanden)
sudo adduser keyauth
sudo usermod -aG sudo keyauth

# Switch to user
su - keyauth
```

### 2. Automatische Server-Installation

**Setup-Script ausführen**:
```bash
# Upload setup script zum Server
scp backend/setup-server.sh keyauth@your-server-ip:~/

# Auf Server ausführen
chmod +x setup-server.sh
./setup-server.sh
```

Das Script installiert automatisch:
- ✅ Node.js 20.x
- ✅ PM2 (Process Manager)
- ✅ PostgreSQL 15
- ✅ Redis
- ✅ Nginx
- ✅ Certbot (SSL)

### 3. Backend-Code auf Server übertragen

**Option A: Git Clone (empfohlen)**
```bash
cd /var/www
sudo mkdir -p keyauth-backend
sudo chown -R keyauth:keyauth keyauth-backend
cd keyauth-backend

# Clone your repository
git clone https://github.com/your-username/keyauth-backend.git .
```

**Option B: SCP Upload**
```bash
# Von lokalem PC
cd backend
tar czf backend.tar.gz .
scp backend.tar.gz keyauth@your-server-ip:/var/www/keyauth-backend/

# Auf Server
cd /var/www/keyauth-backend
tar xzf backend.tar.gz
rm backend.tar.gz
```

### 4. Environment konfigurieren

**Erstelle Production .env**:
```bash
cd /var/www/keyauth-backend
cp .env.production.example .env

# Editiere .env
nano .env
```

**Wichtige Änderungen in .env**:
```env
# PostgreSQL Password (vom setup-server.sh)
DATABASE_URL="postgresql://keyauth:IHR_PASSWORT@localhost:5432/keyauth_db?schema=public"

# JWT Secret (generiere neues)
JWT_SECRET=$(openssl rand -base64 64)

# Request Signature Secret
REQUEST_SIGNATURE_SECRET=$(openssl rand -base64 64)

# Your Domain
CORS_ORIGIN=https://your-domain.com
```

**Secrets generieren**:
```bash
# JWT Secret
openssl rand -base64 64

# Request Signature Secret
openssl rand -base64 64
```

### 5. RSA Keys generieren

```bash
cd /var/www/keyauth-backend
mkdir -p keys

# Generate RSA key pair
openssl genrsa -out keys/private.pem 2048
openssl rsa -in keys/private.pem -outform PEM -pubout -out keys/public.pem

# Secure permissions
chmod 600 keys/private.pem
chmod 644 keys/public.pem
```

### 6. Dependencies installieren & Build

```bash
cd /var/www/keyauth-backend

# Install dependencies
npm install --production=false

# Build TypeScript
npm run build

# Prisma setup
npx prisma generate
npx prisma migrate deploy
```

### 7. PM2 starten

```bash
# Start application
pm2 start ecosystem.config.js

# Check status
pm2 status

# View logs
pm2 logs keyauth-backend

# Setup PM2 to start on boot
pm2 startup systemd
# Copy und führe den angezeigten Command aus:
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u keyauth --hp /home/keyauth

# Save PM2 process list
pm2 save
```

### 8. Nginx konfigurieren

**Domain in nginx.conf anpassen**:
```bash
cd /var/www/keyauth-backend
nano nginx.conf

# Ersetze "your-domain.com" mit Ihrer echten Domain
:%s/your-domain.com/ihre-domain.de/g
```

**Nginx Config aktivieren**:
```bash
sudo cp nginx.conf /etc/nginx/sites-available/keyauth-backend
sudo ln -s /etc/nginx/sites-available/keyauth-backend /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

### 9. SSL Zertifikat (Let's Encrypt)

```bash
sudo certbot --nginx -d ihre-domain.de -d www.ihre-domain.de
```

Certbot wird automatisch:
- ✅ Zertifikat generieren
- ✅ Nginx konfigurieren
- ✅ HTTPS erzwingen
- ✅ Auto-Renewal einrichten

**Test Auto-Renewal**:
```bash
sudo certbot renew --dry-run
```

### 10. DNS konfigurieren

**A Records erstellen**:
```
Type: A
Name: @
Value: YOUR_SERVER_IP

Type: A
Name: www
Value: YOUR_SERVER_IP
```

**Propagation testen**:
```bash
dig ihre-domain.de
nslookup ihre-domain.de
```

---

## ✅ Verification

### Backend erreichbar?
```bash
# Health check
curl https://ihre-domain.de/health

# API Docs
curl https://ihre-domain.de/api/docs
```

### PM2 Status
```bash
pm2 status
pm2 logs keyauth-backend --lines 50
```

### Nginx Status
```bash
sudo systemctl status nginx
sudo nginx -t
```

### PostgreSQL Status
```bash
sudo systemctl status postgresql
sudo -u postgres psql -c "\l"
```

### Redis Status
```bash
sudo systemctl status redis
redis-cli ping  # Should return "PONG"
```

---

## 🔄 Deployment Updates

**Wenn Sie Code-Updates deployen möchten**:

```bash
cd /var/www/keyauth-backend

# Pull latest code
git pull origin main

# Install new dependencies
npm install --production=false

# Rebuild
npm run build

# Run new migrations
npx prisma migrate deploy
npx prisma generate

# Restart PM2
pm2 restart keyauth-backend

# Check logs
pm2 logs keyauth-backend --lines 50
```

**Oder nutzen Sie das Deploy-Script**:
```bash
cd /var/www/keyauth-backend
chmod +x deploy.sh
./deploy.sh
```

---

## 📊 Monitoring & Logs

### PM2 Monitoring
```bash
# Real-time monitoring
pm2 monit

# View logs
pm2 logs

# Show app info
pm2 show keyauth-backend
```

### Log-Dateien
```
PM2 Logs:      /var/log/pm2/keyauth-backend-out.log
               /var/log/pm2/keyauth-backend-error.log

Nginx Access:  /var/log/nginx/keyauth-backend-access.log
Nginx Error:   /var/log/nginx/keyauth-backend-error.log

PostgreSQL:    /var/log/postgresql/postgresql-15-main.log
```

### Disk Usage überwachen
```bash
df -h
du -sh /var/www/keyauth-backend
du -sh /var/lib/postgresql
```

---

## 💾 Backup-Strategie

### Automatisches Datenbank-Backup

**Einrichten**:
```bash
chmod +x backup-db.sh

# In backup-db.sh Password anpassen
nano backup-db.sh
# Ändere: PGPASSWORD=your_password

# Test Backup
./backup-db.sh

# Cronjob einrichten (täglich 3 Uhr)
crontab -e
# Füge hinzu:
0 3 * * * /var/www/keyauth-backend/backup-db.sh
```

**Backup wiederherstellen**:
```bash
gunzip < /var/backups/keyauth/keyauth_backup_YYYYMMDD_HHMMSS.sql.gz | \
  sudo -u postgres psql keyauth_db
```

### Dateien-Backup
```bash
# Backend files
tar czf keyauth-backend-$(date +%Y%m%d).tar.gz /var/www/keyauth-backend

# Nginx config
tar czf nginx-config-$(date +%Y%m%d).tar.gz /etc/nginx

# SSL certificates
sudo tar czf letsencrypt-$(date +%Y%m%d).tar.gz /etc/letsencrypt
```

---

## 🔒 Security Best Practices

### Firewall (UFW)
```bash
# Check status
sudo ufw status

# Allow SSH, HTTP, HTTPS
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable

# Close PostgreSQL port (only local access)
sudo ufw deny 5432/tcp
```

### SSH Hardening
```bash
# Disable root login
sudo nano /etc/ssh/sshd_config
# PermitRootLogin no
# PasswordAuthentication no (use SSH keys only)

sudo systemctl restart sshd
```

### Fail2Ban (optional)
```bash
sudo apt install fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### Regular Updates
```bash
# Setup unattended-upgrades
sudo apt install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

---

## 🐛 Troubleshooting

### Backend startet nicht
```bash
# Check PM2 logs
pm2 logs keyauth-backend --err

# Check if port 3000 is free
sudo netstat -tulpn | grep 3000

# Check .env configuration
cat .env

# Test database connection
npx prisma db push
```

### Nginx 502 Bad Gateway
```bash
# Check PM2 is running
pm2 status

# Check nginx error log
sudo tail -f /var/log/nginx/keyauth-backend-error.log

# Test backend directly
curl http://localhost:3000/health
```

### SSL Certificate Probleme
```bash
# Test SSL
curl https://ihre-domain.de

# Renew certificate
sudo certbot renew

# Check certificate expiry
sudo certbot certificates
```

### Database Connection Failed
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check database exists
sudo -u postgres psql -c "\l"

# Test connection
sudo -u postgres psql keyauth_db
```

### High Memory Usage
```bash
# Check memory
free -h

# Reduce PM2 instances
# In ecosystem.config.js: "instances": 1

# Restart with new config
pm2 delete keyauth-backend
pm2 start ecosystem.config.js
```

---

## 📈 Performance Tuning

### PostgreSQL Tuning
```bash
# Edit config
sudo nano /etc/postgresql/15/main/postgresql.conf

# Recommended for 4GB RAM:
shared_buffers = 1GB
effective_cache_size = 3GB
maintenance_work_mem = 256MB
work_mem = 16MB
max_connections = 100

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### PM2 Cluster Mode
```javascript
// ecosystem.config.js
{
  "instances": "max",  // Use all CPU cores
  "exec_mode": "cluster"
}
```

### Nginx Caching (optional)
```nginx
# In nginx.conf, add:
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m max_size=100m;

location /api/ {
    proxy_cache api_cache;
    proxy_cache_valid 200 5m;
    # ...
}
```

---

## 🔧 Nützliche Commands

```bash
# PM2
pm2 restart keyauth-backend    # Restart app
pm2 reload keyauth-backend     # Zero-downtime restart
pm2 stop keyauth-backend       # Stop app
pm2 delete keyauth-backend     # Remove from PM2
pm2 logs --lines 100           # View logs

# Nginx
sudo nginx -t                   # Test config
sudo systemctl reload nginx     # Reload config
sudo systemctl restart nginx    # Restart nginx

# PostgreSQL
sudo -u postgres psql keyauth_db  # Connect to DB
sudo systemctl restart postgresql # Restart PostgreSQL

# Redis
redis-cli                       # Connect to Redis
sudo systemctl restart redis    # Restart Redis

# System
htop                            # System monitor
journalctl -xe                  # System logs
systemctl status <service>      # Service status
```

---

## 📞 Support

Bei Problemen:

1. **Logs prüfen**: `pm2 logs`, `sudo nginx error.log`
2. **Status prüfen**: `pm2 status`, `systemctl status nginx`
3. **Dokumentation**: Siehe README_SECURITY.md

---

## ✅ Production Checklist

Vor dem Go-Live:

- [ ] Domain DNS konfiguriert
- [ ] SSL Zertifikat installiert
- [ ] .env Secrets geändert (JWT_SECRET, etc.)
- [ ] PostgreSQL Password geändert
- [ ] Firewall konfiguriert (UFW)
- [ ] PM2 startup konfiguriert
- [ ] Backup-Cronjob eingerichtet
- [ ] Monitoring/Logging konfiguriert
- [ ] Health-Check funktioniert
- [ ] API Docs erreichbar (https://domain/api/docs)
- [ ] KeyAuth.cc Credentials getestet
- [ ] Loader kann sich verbinden

---

**🎉 Deployment abgeschlossen!**

Ihr Backend läuft jetzt unter: `https://ihre-domain.de/api/`

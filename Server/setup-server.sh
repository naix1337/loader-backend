#!/bin/bash

#############################################
# KeyAuth Backend - Server Setup Script
# Für Ubuntu 20.04/22.04 LTS
#############################################

set -e  # Exit on error

echo "=================================="
echo "KeyAuth Backend - Server Setup"
echo "=================================="

# Update system
echo "📦 Updating system packages..."
sudo apt update
sudo apt upgrade -y

# Install Node.js 20.x
echo "📦 Installing Node.js 20.x..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify Node.js installation
node --version
npm --version

# Install PM2 globally
echo "📦 Installing PM2..."
sudo npm install -g pm2

# Install PostgreSQL 15
echo "📦 Installing PostgreSQL 15..."
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo gpg --dearmor -o /usr/share/keyrings/postgresql-archive-keyring.gpg
sudo sh -c 'echo "deb [signed-by=/usr/share/keyrings/postgresql-archive-keyring.gpg] http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
sudo apt update
sudo apt install -y postgresql-15 postgresql-contrib

# Install Redis
echo "📦 Installing Redis..."
sudo apt install -y redis-server

# Configure Redis to start on boot
sudo systemctl enable redis-server
sudo systemctl start redis-server

# Install Nginx
echo "📦 Installing Nginx..."
sudo apt install -y nginx

# Install Certbot for SSL
echo "📦 Installing Certbot..."
sudo apt install -y certbot python3-certbot-nginx

# Create application directory
echo "📁 Creating application directory..."
sudo mkdir -p /var/www/keyauth-backend
sudo chown -R $USER:$USER /var/www/keyauth-backend

# Create log directory
sudo mkdir -p /var/log/pm2
sudo chown -R $USER:$USER /var/log/pm2

# Setup PostgreSQL database
echo "🗄️ Setting up PostgreSQL database..."
sudo -u postgres psql << EOF
CREATE DATABASE keyauth_db;
CREATE USER keyauth WITH ENCRYPTED PASSWORD 'change-this-password';
GRANT ALL PRIVILEGES ON DATABASE keyauth_db TO keyauth;
\q
EOF

# Configure PostgreSQL for network access (optional)
echo "⚙️ Configuring PostgreSQL..."
sudo sed -i "s/#listen_addresses = 'localhost'/listen_addresses = 'localhost'/" /etc/postgresql/15/main/postgresql.conf

# Restart PostgreSQL
sudo systemctl restart postgresql

# Configure firewall
echo "🔥 Configuring firewall..."
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

echo ""
echo "=================================="
echo "✅ Server setup completed!"
echo "=================================="
echo ""
echo "📝 Next steps:"
echo "1. Clone your backend code to /var/www/keyauth-backend"
echo "2. Copy .env.example to .env and configure"
echo "3. Run: npm install"
echo "4. Run: npm run build"
echo "5. Run: npx prisma migrate deploy"
echo "6. Run: pm2 start ecosystem.config.js"
echo "7. Configure nginx (see deploy.sh)"
echo ""
echo "PostgreSQL Credentials:"
echo "  Database: keyauth_db"
echo "  User: keyauth"
echo "  Password: change-this-password (CHANGE THIS!)"
echo ""

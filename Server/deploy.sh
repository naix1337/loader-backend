#!/bin/bash

#############################################
# KeyAuth Backend - Deployment Script
#############################################

set -e

APP_DIR="/var/www/keyauth-backend"
DOMAIN="your-domain.com"

echo "=================================="
echo "KeyAuth Backend - Deployment"
echo "=================================="

# Navigate to app directory
cd $APP_DIR

# Pull latest code (if using git)
echo "📥 Pulling latest code..."
# git pull origin main

# Install dependencies
echo "📦 Installing dependencies..."
npm install --production

# Build TypeScript
echo "🔨 Building application..."
npm run build

# Run database migrations
echo "🗄️ Running database migrations..."
npx prisma migrate deploy
npx prisma generate

# Restart PM2 application
echo "🔄 Restarting application..."
pm2 restart ecosystem.config.js

# Save PM2 process list
pm2 save

# Setup PM2 startup script (first time only)
# pm2 startup systemd -u $USER --hp /home/$USER
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp /home/$USER

# Configure Nginx (first time only)
if [ ! -f /etc/nginx/sites-available/keyauth-backend ]; then
    echo "⚙️ Configuring Nginx..."
    sudo cp nginx.conf /etc/nginx/sites-available/keyauth-backend
    
    # Update domain in nginx config
    sudo sed -i "s/your-domain.com/$DOMAIN/g" /etc/nginx/sites-available/keyauth-backend
    
    # Enable site
    sudo ln -sf /etc/nginx/sites-available/keyauth-backend /etc/nginx/sites-enabled/
    
    # Remove default site
    sudo rm -f /etc/nginx/sites-enabled/default
    
    # Test nginx configuration
    sudo nginx -t
    
    # Reload nginx
    sudo systemctl reload nginx
fi

# Setup SSL certificate (first time only)
if [ ! -d "/etc/letsencrypt/live/$DOMAIN" ]; then
    echo "🔒 Setting up SSL certificate..."
    sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN
fi

# Setup SSL auto-renewal (first time only)
if ! sudo crontab -l | grep -q 'certbot renew'; then
    echo "⏰ Setting up SSL auto-renewal..."
    (sudo crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet --post-hook 'systemctl reload nginx'") | sudo crontab -
fi

echo ""
echo "=================================="
echo "✅ Deployment completed!"
echo "=================================="
echo ""
echo "🌐 Your backend is now running at:"
echo "   https://$DOMAIN/api/docs"
echo ""
echo "📊 PM2 Status:"
pm2 status
echo ""
echo "📝 Useful commands:"
echo "   pm2 logs keyauth-backend     # View logs"
echo "   pm2 restart keyauth-backend  # Restart app"
echo "   pm2 monit                    # Monitor app"
echo "   sudo systemctl status nginx  # Check nginx"
echo ""

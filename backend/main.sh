#!/bin/bash
# AWS EC2 Setup Script for Docker Deployment
# Run this script on your AWS EC2 instance

echo "🚀 Setting up AWS EC2 for Docker deployments..."

# Update system packages
sudo apt-get update -y
sudo apt-get upgrade -y

# Install Docker
echo "📦 Installing Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
echo "📦 Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Node.js (for potential Node.js apps)
echo "📦 Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install additional tools
echo "📦 Installing additional tools..."
sudo apt-get install -y git curl wget unzip nginx

# Configure firewall
echo "🔒 Configuring firewall..."
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 3000:65000/tcp
sudo ufw --force enable

# Create deployment directory
echo "📁 Creating deployment directories..."
sudo mkdir -p /opt/deployments
sudo chown $USER:$USER /opt/deployments

# Setup nginx reverse proxy configuration
echo "⚙️ Setting up Nginx reverse proxy..."
sudo tee /etc/nginx/sites-available/deployments > /dev/null <<EOF
server {
    listen 80;
    server_name _;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

sudo ln -s /etc/nginx/sites-available/deployments /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx

# Setup Docker cleanup cron job
echo "🧹 Setting up Docker cleanup cron job..."
(crontab -l 2>/dev/null; echo "0 2 * * * docker system prune -f") | crontab -

# Create deployment monitoring script
echo "📊 Creating deployment monitoring script..."
sudo tee /opt/deployments/monitor.sh > /dev/null <<EOF
#!/bin/bash
# Deployment monitoring script

LOG_FILE="/opt/deployments/monitor.log"

echo "\$(date): Checking Docker containers" >> \$LOG_FILE
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" >> \$LOG_FILE

# Check for unhealthy containers
UNHEALTHY=\$(docker ps --filter "health=unhealthy" --format "{{.Names}}")
if [ ! -z "\$UNHEALTHY" ]; then
    echo "\$(date): Unhealthy containers detected: \$UNHEALTHY" >> \$LOG_FILE
    # Add notification logic here (email, Slack, etc.)
fi

# Clean up old logs (keep last 1000 lines)
tail -n 1000 \$LOG_FILE > \$LOG_FILE.tmp && mv \$LOG_FILE.tmp \$LOG_FILE
EOF

sudo chmod +x /opt/deployments/monitor.sh

# Add monitoring to cron
(crontab -l 2>/dev/null; echo "*/5 * * * * /opt/deployments/monitor.sh") | crontab -

# Create SSL certificate setup script (optional)
echo "🔐 Creating SSL setup script..."
sudo tee /opt/deployments/setup-ssl.sh > /dev/null <<EOF
#!/bin/bash
# SSL Certificate setup with Let's Encrypt
# Usage: ./setup-ssl.sh your-domain.com

DOMAIN=\$1
if [ -z "\$DOMAIN" ]; then
    echo "Usage: ./setup-ssl.sh your-domain.com"
    exit 1
fi

# Install certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d \$DOMAIN --non-interactive --agree-tos --email admin@\$DOMAIN

# Setup auto-renewal
(crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -

echo "SSL certificate installed for \$DOMAIN"
EOF

sudo chmod +x /opt/deployments/setup-ssl.sh

# Create deployment stats script
echo "📈 Creating deployment stats script..."
sudo tee /opt/deployments/stats.sh > /dev/null <<EOF
#!/bin/bash
# Deployment statistics

echo "=== Docker Deployment Statistics ==="
echo "Total containers: \$(docker ps -a | wc -l)"
echo "Running containers: \$(docker ps | wc -l)"
echo "Images: \$(docker images | wc -l)"
echo "Disk usage:"
docker system df
echo ""
echo "=== System Resources ==="
echo "Memory usage:"
free -h
echo ""
echo "Disk usage:"
df -h
echo ""
echo "CPU usage:"
top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - \$1"%"}'
EOF

sudo chmod +x /opt/deployments/stats.sh

# Install fail2ban for security
echo "🛡️ Installing fail2ban for security..."
sudo apt-get install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Create Docker network for deployments
echo "🌐 Creating Docker network..."
docker network create deployment-network 2>/dev/null || true

# Final setup
echo "✅ EC2 setup completed!"
echo ""
echo "Next steps:"
echo "1. Configure your SSH key for deployment access"
echo "2. Update your .env file with this instance details"
echo "3. Test deployment with: ssh -i your-key.pem ubuntu@your-instance-ip"
echo "4. Run './setup-ssl.sh your-domain.com' if you have a domain"
echo "5. Check stats with: /opt/deployments/stats.sh"
echo ""
echo "Security recommendations:"
echo "- Change default SSH port if needed"
echo "- Setup CloudFlare or similar CDN"
echo "- Configure backup strategy"
echo "- Monitor logs regularly"
echo ""
echo "🎉 Your AWS EC2 instance is ready for deployments!"
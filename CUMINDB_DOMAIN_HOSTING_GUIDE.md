# CuminDB Domain Hosting & Deployment Guide (`cumindb.cdfd.org.in`)

This document provides complete instructions and exact shell commands to host CuminDB on **`cumindb.cdfd.org.in`** at CDFD.

---

## Summary of Files & Settings Modified for `cumindb.cdfd.org.in`

1. **`server.js`**:
   - Enabled `app.set('trust proxy', 1);` so Express properly processes reverse proxy headers (`X-Forwarded-For`, `X-Forwarded-Proto`).
2. **`public/index.html`**:
   - Added canonical link `<link rel="canonical" href="https://cumindb.cdfd.org.in">`.
   - Configured OpenGraph social metadata (`og:url` &rarr; `https://cumindb.cdfd.org.in`).
3. **`README.md` & `TUTORIAL.md`**:
   - Updated production domain URL references to `https://cumindb.cdfd.org.in`.
4. **Nginx Reverse Proxy Config**:
   - Created `/etc/nginx/sites-available/cumindb.cdfd.org.in`.
5. **Systemd Service Unit**:
   - Created `/etc/systemd/system/cumindb.service`.

---

## Step 1: Server Prerequisites & Setup

Run these commands on your production server:

```bash
# 1. Update system packages
sudo apt update && sudo apt upgrade -y

# 2. Install Node.js (v18+), Nginx, Samtools, Tabix, and Certbot
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs nginx samtools tabix certbot python3-certbot-nginx fuser

# 3. Verify Node.js installation
node -v
npm -v
```

---

## Step 2: Transfer CuminDB to Server Directory

```bash
# Create target directory on server
sudo mkdir -p /var/www/cumindb
sudo chown -R $USER:$USER /var/www/cumindb

# Extract deployment package into /var/www/cumindb
tar -xzf CuminDB_Deployment_Package.tar.gz -C /var/www/cumindb --strip-components=1

# Change directory
cd /var/www/cumindb

# Install production dependencies
npm install --production
```

---

## Step 3: Configure Systemd Service (`/etc/systemd/system/cumindb.service`)

Create a system service so CuminDB automatically runs in the background and restarts on server reboot:

```bash
sudo nano /etc/systemd/system/cumindb.service
```

Paste the following configuration:

```ini
[Unit]
Description=CuminDB Node.js Web Portal Daemon
After=network.target

[Service]
Type=simple
User=ramesh
WorkingDirectory=/var/www/cumindb
ExecStart=/usr/bin/node /var/www/cumindb/server.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production
Environment=PORT=8005

[Install]
WantedBy=multi-user.target
```

Enable and start the service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable cumindb
sudo systemctl start cumindb
sudo systemctl status cumindb
```

---

## Step 4: Configure Nginx Reverse Proxy (`/etc/nginx/sites-available/cumindb.cdfd.org.in`)

Create Nginx virtual host configuration:

```bash
sudo nano /etc/nginx/sites-available/cumindb.cdfd.org.in
```

Paste the following Nginx block:

```nginx
server {
    listen 80;
    server_name cumindb.cdfd.org.in;

    # Maximum upload limit for BLAST queries & data exports
    client_max_body_size 100M;

    location / {
        proxy_pass http://127.0.0.1:8005;
        proxy_http_version 1.1;
        
        # Header forwarding for HTTPS & IP tracking
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the Nginx site configuration and test for syntax errors:

```bash
sudo ln -sf /etc/nginx/sites-available/cumindb.cdfd.org.in /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## Step 5: Configure SSL/TLS HTTPS Certificate

### Option A: Using Let's Encrypt Certbot (Recommended for Public Domains)

```bash
sudo certbot --nginx -d cumindb.cdfd.org.in
```

### Option B: Using Institutional CDFD SSL Certificate (`.crt` & `.key`)

If CDFD IT team provides SSL certificates, update `/etc/nginx/sites-available/cumindb.cdfd.org.in`:

```nginx
server {
    listen 443 ssl http2;
    server_name cumindb.cdfd.org.in;

    ssl_certificate /etc/ssl/certs/cumindb_cdfd_org_in.crt;
    ssl_certificate_key /etc/ssl/private/cumindb_cdfd_org_in.key;

    client_max_body_size 100M;

    location / {
        proxy_pass http://127.0.0.1:8005;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }
}

server {
    listen 80;
    server_name cumindb.cdfd.org.in;
    return 301 https://$host$request_uri;
}
```

Reload Nginx:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

---

## Step 6: Verify Domain Deployment

1. Open **`https://cumindb.cdfd.org.in`** in your browser.
2. Verify home page, BLAST engine, JBrowse 2 tracks, SSR search, TF search, miRNA search, and CSV export functionality.
3. Check server logs if needed:
   ```bash
   sudo journalctl -u cumindb -f
   ```

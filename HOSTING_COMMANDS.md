# CuminDB Server Hosting & Deployment Guide

This document provides step-by-step terminal commands to transfer, install, run, and host the **CuminDB** portal on a Linux remote server (Ubuntu / Debian / RHEL / CentOS).

---

## 1. Package Overview

All essential database files, indexes, API backend code, and web assets are bundled inside:
- **Standalone Folder**: `CuminDB_Deployment_Package/` (729 MB)
- **Compressed Tarball Archive**: `CuminDB_Deployment_Package.tar.gz` (117 MB)

### Included Assets:
- `db/cumin_database.sqlite` — Relational SQLite Master Database
- `db/*.gff.gz` & `db/*.gff.gz.tbi` — Indexed Multi-Track Tabix GFF Files
- `server.js` & `package.json` — Node.js Express REST API Backend
- `id_mapping.tsv` — Standardized scaffold and gene ID lookup tables
- `public/` — Web application frontend (HTML, CSS, JS, Logos, Team Photos, 600 DPI Plots)
- `scripts/` — Pipeline build scripts

---

## 2. Transfer Package to Remote Server

Run one of the following commands on your local machine to upload the package to your remote server:

### Option A: Using `scp` (Compressed Archive - Recommended)
```bash
# Replace 'user' and 'your-server-ip' with your server credentials
scp /media/ramesh/LGI/Not-Mine/Cumin_DB/CuminDB_Deployment_Package.tar.gz user@your-server-ip:/var/www/
```

### Option B: Using `rsync` (Direct Folder Sync)
```bash
rsync -avzP /media/ramesh/LGI/Not-Mine/Cumin_DB/CuminDB_Deployment_Package/ user@your-server-ip:/var/www/Cumin_DB/
```

---

## 3. Server Setup & Extraction

SSH into your server and extract the package:

```bash
# 1. SSH into server
ssh user@your-server-ip

# 2. Navigate to destination directory
cd /var/www/

# 3. Extract compressed archive (if transferred via scp)
tar -xzvf CuminDB_Deployment_Package.tar.gz
cd CuminDB_Deployment_Package

# 4. Install Node.js dependencies
npm install
```

---

## 4. Launching the CuminDB Server

Choose one of the following options to run CuminDB on port `8005`:

### Option 1: Using PM2 Process Manager (Recommended for Production)
PM2 ensures the portal automatically restarts if the server reboots or crashes.

```bash
# Install PM2 globally (if not already installed)
sudo npm install -g pm2

# Start CuminDB application
pm2 start server.js --name "cumindb"

# Enable PM2 to auto-start on server reboot
pm2 save
pm2 startup
```

### Option 2: Using Nohup (Background Daemon)
```bash
nohup node server.js > server.log 2>&1 &
```

### Option 3: Direct Console Run (For Testing)
```bash
node server.js
```

---

## 5. Verify Server Status

Test if the CuminDB REST API is actively responding:

```bash
# Test API stats endpoint
curl http://127.0.0.1:8005/api/stats
```

Expected JSON Output:
`{"status":"success","counts":{"genes":33595,"ssrs":294013,"tfs":1248,"mirna":887912,"sec_metabolites":294}}`

---

## 6. Nginx Reverse Proxy Setup (Port 80 / 443 HTTPS)

To host CuminDB on standard Web HTTP (`http://your-domain.org`) or HTTPS:

1. Install Nginx:
```bash
sudo apt update && sudo apt install -y nginx
```

2. Create Nginx Configuration File `/etc/nginx/sites-available/cumindb`:
```nginx
server {
    listen 80;
    server_name cumindb.cdfd.org.in your-domain-or-ip;

    client_max_body_size 100M;

    location / {
        proxy_pass http://127.0.0.1:8005;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

3. Enable configuration and reload Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/cumindb /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 7. Useful Management Commands

```bash
# Check PM2 server status
pm2 status

# View live server logs
pm2 logs cumindb

# Restart CuminDB server
pm2 restart cumindb

# Stop CuminDB server
pm2 stop cumindb

# Force kill port 8005 (if needed)
fuser -k 8005/tcp
```

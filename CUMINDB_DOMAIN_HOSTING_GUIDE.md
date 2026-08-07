# CuminDB Domain Hosting & Deployment Guide (`https://database.cdfd.org.in/cumindb/`)

This document provides complete instructions and exact shell commands to host CuminDB on **`https://database.cdfd.org.in/cumindb/`** at CDFD.

---

## Summary of Files & Settings Modified for `database.cdfd.org.in/cumindb/`

1. **`server.js`**:
   - Enabled `app.set('trust proxy', 1);` so Express properly processes reverse proxy headers (`X-Forwarded-For`, `X-Forwarded-Proto`).
2. **`public/index.html`**:
   - Added canonical link `<link rel="canonical" href="https://database.cdfd.org.in/cumindb/">`.
   - Configured OpenGraph social metadata (`og:url` &rarr; `https://database.cdfd.org.in/cumindb/`).
3. **`README.md` & `TUTORIAL.md`**:
   - Updated production domain URL references to `https://database.cdfd.org.in/cumindb/`.
4. **Nginx Reverse Proxy Config**:
   - Configured location `/cumindb/` in Nginx site config.
5. **Systemd Service Unit**:
   - Created `/etc/systemd/system/cumindb.service`.

---

## Database & File Audit: Required vs. Non-Required Files for Hosting

### A. REQUIRED Files to Host on Server (`database.cdfd.org.in/cumindb/`):
1. **`server.js`**: Express backend REST API server.
2. **`package.json`**: Node.js package dependency manifest.
3. **`public/`**: Frontend HTML, CSS, JS, images, logos, and JBrowse 2 app files.
4. **`id_mapping.tsv`**: Gene model and scaffold ID conversion table.
5. **`db/cumin_database.sqlite`**: **Master relational database (239 MB) containing ALL 33,595 genes, 294,013 SSRs, 1,248 TFs, 887,912 miRNA targets, and 294 secondary metabolite pathways**.
6. **`db/*.gff.gz` & `db/*.gff.gz.tbi`**: Tabix-indexed annotation tracks for JBrowse 2.
7. **`db/cumin_cds.*` & `db/cumin_proteins.*`**: NCBI BLAST+ database indexes for Web BLAST.

### B. NOT REQUIRED on Hosting Server (Safe to Exclude / Delete):
1. **`db/parsed_mirna_targets.json` (402 MB)** & **`db/parsed_genes.json` (20 MB)**: Intermediate JSON dumps produced during building. The Express server queries `cumin_database.sqlite` directly.
2. **Raw Input Files**: `psRNATargetJob-*.txt`, `krait-ssr`, `krait-ssr-primers`, `generic_export.txt`, `cumin_refined_genes_clean.gff3`.
3. **Mining Scripts (`scripts/*.py`)**: Pipeline build scripts (only needed if rebuilding from raw sources).

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

## Step 2: Transfer CuminDB & Reference Genome to Server Directory

```bash
# 1. Create target deployment directory on server
sudo mkdir -p /var/www/cumindb
sudo chown -R $USER:$USER /var/www/cumindb

# 2. Extract deployment package into /var/www/cumindb
tar -xzf CuminDB_Deployment_Package.tar.gz -C /var/www/cumindb --strip-components=1

# 3. Copy the 1.3 GB Reference Assembly FASTA file & index required for JBrowse 2
# (Because of its large 1.3 GB size, copy this directly from your workspace directory)
cp /media/ramesh/LGI/Not-Mine/Cumin_DB/cumin_ncbi_renamed.fsa /var/www/cumindb/
cp /media/ramesh/LGI/Not-Mine/Cumin_DB/cumin_ncbi_renamed.fsa.fai /var/www/cumindb/

# 4. Change directory and install dependencies
cd /var/www/cumindb
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

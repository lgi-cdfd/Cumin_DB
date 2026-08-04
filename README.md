# CuminDB: Cuminum cyminum Genome & Functional Annotation Portal

[![Database](https://img.shields.io/badge/Database-SQLite%20%7C%20MySQL-blue?style=flat-square)](#)
[![Node.js](https://img.shields.io/badge/Node.js-%E2%89%A516.0.0-green?style=flat-square)](#)
[![Express](https://img.shields.io/badge/Express-v4.18-lightgrey?style=flat-square)](#)
[![JBrowse 2](https://img.shields.io/badge/Genome%20Browser-JBrowse%202-orange?style=flat-square)](#)
[![BLAST+](https://img.shields.io/badge/Alignment-BLAST%2B-red?style=flat-square)](#)
[![License](https://img.shields.io/badge/License-CC%20BY%204.0-yellowgreen?style=flat-square)](#)

Welcome to **CuminDB**, a state-of-the-art computational biology web database and genome browser for *Cuminum cyminum* (Cumin). CuminDB provides a comprehensive, interactive platform for structural gene models, OmicsBox/Blast2GO functional annotations, SSR microsatellite primers, transcription factor classifications, psRNATarget miRNA targets cross-referenced with miRBase, and an interactive Web BLAST alignment engine.

Designed and developed for submission to **Nature *Scientific Data*** by the computational genomics team at **BRIC - Centre for DNA Fingerprinting and Diagnostics (CDFD)**.

---

## Authors & Lab Information

- **Principal Investigator**: Dr. Ajay Kumar Mahato (akmlgi2021@gmail.com)
- **Research Scholars**: 
  - Lakshmi Devi (Research Scholar)
  - Priyanka Kushwaha (Research Scholar)
  - Ramesh Eerapagula (Research Scholar)
  - Ankit Bhagat (Research Scholar)
- **Institution**: BRIC - Centre for DNA Fingerprinting and Diagnostics (CDFD), Hyderabad, India.
- **GitHub Organization**: [`lgi-cdfd`](https://github.com/lgi-cdfd)

---

## Directory Structure

```
Cumin_DB/
├── cdfd-logo.png                       # Official BRIC-CDFD Logo
├── materials_and_methods.md            # Manuscript section for Scientific Data submission
├── README.md                           # Comprehensive documentation & command log
├── package.json                        # Node.js dependencies
├── server.js                           # Express.js REST API server & database connector
├── db/
│   ├── cumin_database.sqlite           # Relational SQLite Database (Indexed)
│   ├── cumin_sorted.gff.gz             # Compressed and sorted GFF3 for JBrowse 2
│   ├── cumin_sorted.gff.gz.tbi         # Tabix index of GFF3
│   ├── parsed_genes.json               # Intermediate gene models JSON
│   ├── parsed_ssrs.json                # Intermediate SSR primers JSON
│   ├── parsed_tfs.json                 # Intermediate Transcription Factors JSON
│   └── parsed_mirna_targets.json       # Intermediate miRNA targets JSON
├── scripts/                            # Pipeline scripts for GitHub upload (lgi-cdfd)
│   ├── 01_parse_gff_annotations.py     # GFF3 & Blast2GO annotation parser
│   ├── 02_mine_ssrs_and_primers.py      # SSR motif miner & PCR primer designer
│   ├── 03_process_tfs.py               # TF family classifier & TAIR ortholog mapper
│   ├── 04_process_mirna_targets.py     # psRNATarget parser & miRBase hyperlinker
│   ├── 05_build_sqlite_db.py           # SQLite database generator & B-tree indexer
│   ├── setup_jbrowse2.py               # JBrowse 2 assembly and track configuration setup
│   └── setup_blast.py                  # BLAST database formatter for SequenceServer
└── public/                             # Premium Web Application Frontend
    ├── index.html                      # Single Page Application
    ├── cdfd-logo.png                   # Logo asset
    ├── css/
    │   └── styles.css                  # Minimalist gray/white design system
    └── js/
        ├── app.js                      # Main application controller
        ├── charts.js                   # Chart.js interactive visualizations
        ├── browser.js                  # JBrowse 2 Linear Genome View track renderer
        └── blast.js                    # SequenceServer Web BLAST controller
```

---

## Command Reference Log

### 1. Data Pipeline Execution
Run the complete bioinformatics data parsing, SSR mining, TF mapping, miRNA hyperlinking, and database creation pipeline:

```bash
# 1. Parse GFF3 models and OmicsBox / Blast2GO annotations
python3 scripts/01_parse_gff_annotations.py

# 2. Mine SSR microsatellites and design PCR primers (Forward, Reverse, Tm, Product Size)
python3 scripts/02_mine_ssrs_and_primers.py

# 3. Classify Transcription Factors and map Arabidopsis TAIR orthologs
python3 scripts/03_process_tfs.py

# 4. Parse psRNATarget results and generate miRBase accessions & hyperlinks
python3 scripts/04_process_mirna_targets.py

# 5. Build and index relational SQLite database
python3 scripts/05_build_sqlite_db.py

# 6. Set up JBrowse 2 genome assembly index & track formatting
# This runs samtools faidx, bgzip, and tabix to prepare the files
python3 scripts/setup_jbrowse2.py

# 7. Index predicted CDS and protein fasta files for BLAST/SequenceServer
python3 scripts/setup_blast.py
```

### 2. Launching SequenceServer Web BLAST
To start the SequenceServer BLAST query engine, run:

```bash
sequenceserver -d db/
```

### 3. Launching the Web Server
Install Node.js dependencies and start the Express REST API server:

```bash
# Install dependencies
npm install

# Start production server (default port 8000)
PORT=8000 npm start
```

Access the portal in your web browser at: `http://localhost:8000`

---

## MySQL Enterprise Database Setup

For enterprise hosting on MySQL or MariaDB, execute the following DDL schema:

```sql
CREATE DATABASE IF NOT EXISTS cumin_db;
USE cumin_db;

-- 1. Genes Table
CREATE TABLE genes (
    gene_id VARCHAR(100) PRIMARY KEY,
    contig VARCHAR(100),
    source VARCHAR(50),
    feature_type VARCHAR(50),
    start INT,
    end INT,
    length INT,
    strand CHAR(1),
    description TEXT,
    go_terms TEXT,
    go_ids TEXT,
    ec_code VARCHAR(100),
    ec_name TEXT,
    interpro_name TEXT,
    INDEX idx_contig (contig)
);

-- 2. SSRs & Primers Table
CREATE TABLE ssrs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ssr_id VARCHAR(50),
    gene_id VARCHAR(100),
    ssr_type VARCHAR(50),
    motif VARCHAR(50),
    repeat_count INT,
    start INT,
    end INT,
    length INT,
    primer_forward VARCHAR(100),
    primer_reverse VARCHAR(100),
    tm_f DOUBLE,
    tm_r DOUBLE,
    product_size INT,
    FOREIGN KEY (gene_id) REFERENCES genes(gene_id),
    INDEX idx_ssr_gene (gene_id),
    INDEX idx_motif (motif)
);

-- 3. Transcription Factors Table
CREATE TABLE transcription_factors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    gene_id VARCHAR(100),
    tf_family VARCHAR(50),
    ath_hit VARCHAR(100),
    ath_locus VARCHAR(100),
    evalue VARCHAR(50),
    description TEXT,
    tair_url TEXT,
    FOREIGN KEY (gene_id) REFERENCES genes(gene_id),
    INDEX idx_tf_family (tf_family),
    INDEX idx_tf_gene (gene_id)
);

-- 4. miRNA Targets Table
CREATE TABLE mirna_targets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mirna_acc VARCHAR(100),
    mirbase_id VARCHAR(100),
    target_gene VARCHAR(100),
    expectation DOUBLE,
    upe DOUBLE,
    mirna_start INT,
    mirna_end INT,
    target_start INT,
    target_end INT,
    mirna_aligned TEXT,
    target_aligned TEXT,
    inhibition VARCHAR(50),
    target_desc TEXT,
    mirbase_url TEXT,
    FOREIGN KEY (target_gene) REFERENCES genes(gene_id),
    INDEX idx_mirna_target (target_gene),
    INDEX idx_mirna_acc (mirna_acc)
);
```

---

## REST API Endpoints

| Endpoint | Method | Description | Parameters |
|---|---|---|---|
| `/api/stats` | GET | Global metrics & summary counts | None |
| `/api/genes` | GET | Query gene models | `page`, `limit`, `search`, `contig`, `format=csv` |
| `/api/ssrs` | GET | Query SSR markers & primers | `page`, `limit`, `search`, `type`, `format=csv` |
| `/api/tfs` | GET | Query Transcription Factors | `page`, `limit`, `search`, `family`, `format=csv` |
| `/api/mirna` | GET | Query miRNA target interactions | `page`, `limit`, `search`, `mirna`, `format=csv` |
| `/api/blast` | POST | Web BLAST sequence search | `query`, `program`, `database`, `max_evalue` |
| `/api/genome-browser/contigs` | GET | List available scaffolds | None |
| `/api/genome-browser/features` | GET | Genome browser features for contig | `contig` |

---

## Uploading Scripts to GitHub (`lgi-cdfd`)

To push the analysis scripts to your lab GitHub repository:

```bash
git init
git remote add origin https://github.com/lgi-cdfd/Cumin_DB.git
git add scripts/ materials_and_methods.md README.md package.json server.js public/
git commit -m "Initial commit of CuminDB genomic portal and analysis pipeline"
git push -u origin main
```

# CuminDB: An Integrated Computational Genomics Portal for *Cuminum cyminum* (Cumin)

[![Database](https://img.shields.io/badge/Database-SQLite%20%7C%20MySQL-blue?style=flat-square)](#)
[![Node.js](https://img.shields.io/badge/Node.js-%E2%89%A518.0.0-green?style=flat-square)](#)
[![Express](https://img.shields.io/badge/Express-v4.18-lightgrey?style=flat-square)](#)
[![JBrowse 2](https://img.shields.io/badge/Genome%20Browser-JBrowse%202-orange?style=flat-square)](#)
[![BLAST+](https://img.shields.io/badge/Alignment-BLAST%2B-red?style=flat-square)](#)
[![License](https://img.shields.io/badge/License-CC%20BY%204.0-yellowgreen?style=flat-square)](#)

Welcome to **CuminDB**, a state-of-the-art computational biology web database and genome browser for *Cuminum cyminum* (Cumin). CuminDB provides a comprehensive, interactive platform for structural gene models, OmicsBox/Blast2GO functional annotations, Krait SSR microsatellite PCR primers, transcription factor classifications, psRNATarget miRNA targets cross-referenced with miRBase, secondary metabolite biosynthetic pathways, and an interactive Web BLAST alignment engine.

Developed and maintained by the **Laboratory of Genome Informatics (LGI)** at the **BRIC - Centre for DNA Fingerprinting and Diagnostics (CDFD)**, Hyderabad, India.

---

## Authors & Laboratory Information

- **Dr. Ajay Kumar Mahato** (`akmahato@cdfd.org.in` / `akmlgi2021@gmail.com`) — *Principal Investigator & Corresponding Author*
- **Ramesh Eerapagula** (`rameshe@cdfd.org.in`) — *Research Scholar*
- **Lakshmi Devi** (`lakshmidevi@cdfd.org.in`) — *Research Scholar*
- **Priyanka Kushwaha** (`priyankakushwaha@cdfd.org.in`) — *Research Scholar*
- **Ankit Bhagat** (`ankitbhagat@cdfd.org.in`) — *Research Scholar*

**Institution**: BRIC - Centre for DNA Fingerprinting and Diagnostics (CDFD), Inner Ring Road, Uppal, Hyderabad, Telangana 500039, India.  
**Laboratory**: Laboratory of Genome Informatics (LGI)  
**GitHub Repository**: [`https://github.com/lgi-cdfd/Cumin_DB`](https://github.com/lgi-cdfd/Cumin_DB)

---

## Key Features & Genomic Scope

1. **Assembly & Gene Models**: Standardized scaffold mappings for 148,518 assembly contigs (`CcContig_XXXXX`) and 33,595 gene models (`CcGene_XXXXX`) with full GFF3 structure, OmicsBox functional descriptions, GO terms, EC enzyme codes, and InterPro protein domain signatures.
2. **Krait SSR Microsatellites & Designed Primers**: 294,013 mined SSR loci with 227,112 designed PCR primer pairs (Forward/Reverse sequences, $T_m$, product sizes). Includes fine-grained GFF3 feature tree intersection classifying each SSR into `Coding (CDS)` (2,386), `Non-coding (Intron)` (24,155), `Non-coding (Exon/UTR)` (72), or `Intergenic` (267,400).
3. **miRNA Target Regulation**: 887,912 genomically intersected miRNA target interactions predicted by psRNATarget, cross-referenced with miRBase accessions and classified by inhibition mode (`Cleavage`, `Translation Repression`).
4. **Secondary Metabolite Biosynthesis**: 294 pathway genes mapped across major phytochemical classes (Monoterpenes, Sesquiterpenes, Phenylpropanoids, Alkaloids, Polyketides).
5. **Transcription Factor Families**: 1,248 TFs classified across 55 gene families mapped to TAIR *Arabidopsis thaliana* orthologs.
6. **Embedded JBrowse 2 Genome Browser**: Multi-track GFF visualization (`Gene Models`, `EDTA Repeatmasking`, `Krait SSR Primers`, `miRNA Targets`, `Secondary Metabolite Pathways`).
7. **Web BLAST Engine**: SequenceServer backend with interactive SVG alignment maps and circular chord diagrams.

---

## Clean Repository Structure

```
Cumin_DB/
├── server.js                           # Express.js REST API server & database connector
├── package.json                        # Node.js dependencies
├── id_mapping.tsv                      # Standardized scaffold and gene ID mappings
├── TUTORIAL.md                         # Interactive website tutorial guide
├── README.md                           # Master repository documentation
├── .gitignore                          # Clean repository exclusion rules
├── scripts/                            # Pipeline build & figure scripts
│   ├── 01_build_master_mappings.py     # Scaffold & gene ID standardization mapper
│   ├── 02_mine_ssrs_and_primers.py     # Krait SSR & PCR primer parser
│   ├── 03_parse_interpro_and_eggnog.py # Functional annotation parser
│   ├── 04_process_mirna_targets.py     # psRNATarget & miRBase hyperlinker
│   ├── 05_process_sec_metabolites.py    # Secondary metabolite pathway parser
│   ├── 06_process_tfs.py               # Transcription factor family classifier
│   ├── build_full_database_and_tracks.py # Master SQLite database & Tabix track builder
│   ├── generate_publication_plots.py   # 600 DPI publication figure generator
│   └── generate_blast_plot.py          # Web BLAST SVG alignment & chord plot engine
└── public/                             # Web Application Frontend
    ├── index.html                      # Single Page Application HTML5 template
    ├── cumindb_logo.png                # Official CuminDB Emblem Logo
    ├── cdfd-logo.png                   # Official BRIC-CDFD Logo
    ├── css/
    │   └── styles.css                  # Responsive design system
    ├── js/
    │   ├── app.js                      # Main SPA controller & REST API client
    │   ├── charts.js                   # Chart.js interactive dashboard charts
    │   ├── browser.js                  # JBrowse 2 Embedded React Linear Genome View
    │   └── blast.js                    # Web BLAST controller & SVG renderer
    ├── images/
    │   └── team/                       # Team member profile photos
    └── plots/                          # 600 DPI high-resolution figures
```

> **Note**: Raw sequence FASTA files, raw GFF3 dumps, temporary parsing text files, and binary SQLite database files (`db/cumin_database.sqlite`) are excluded via `.gitignore` to maintain a clean code repository.

---

## Server Installation & Commands

### 1. Prerequisites
- Node.js $\ge 18.0.0$
- Python $\ge 3.9$ with `sqlite3`, `matplotlib`, `tabix`, `bgzip`

### 2. Install Node Dependencies
```bash
npm install
```

### 3. Build Database & Multi-Track Indexes
Run the master pipeline script to generate the SQLite database and Tabix GFF tracks:
```bash
python3 scripts/build_full_database_and_tracks.py
```

### 4. Start the Portal Server
```bash
# Start server (default port 8005)
node server.js
```

Access the portal in your web browser at: `http://localhost:8005`

### 5. Stop the Server
```bash
# Stop server running on port 8005
fuser -k 8005/tcp
```

---

## REST API Endpoint Reference

| Endpoint | Method | Query Parameters | Description |
|---|---|---|---|
| `/api/stats` | `GET` | None | Summary counts for database dashboard |
| `/api/genes` | `GET` | `page`, `limit`, `search`, `contig`, `format=csv` | Search gene models & functional annotations |
| `/api/ssrs` | `GET` | `page`, `limit`, `motif`, `gene_id`, `type`, `format=csv` | Query Krait SSR markers & designed primers |
| `/api/tfs` | `GET` | `page`, `limit`, `search`, `family`, `format=csv` | Query Transcription Factor gene families |
| `/api/mirna` | `GET` | `page`, `limit`, `search`, `format=csv` | Query psRNATarget miRNA target interactions |
| `/api/sec-metabolites` | `GET` | `page`, `limit`, `search`, `category`, `format=csv` | Query secondary metabolite biosynthetic genes |
| `/api/blast` | `POST` | `query`, `program`, `database`, `evalue` | Execute Web BLAST alignment search |

---

## Citation & License

If you utilize datasets, PCR primer designs, annotation tracks, or comparative mapping outputs from CuminDB in your publication, please cite the database as follows:

```text
Ajay Kumar Mahato, Ramesh Eerapagula, Lakshmi Devi, Priyanka Kushwaha, Ankit Bhagat. 
CuminDB: An Integrated Computational Genomics Portal for Cuminum cyminum L. 
Scientific Data (2026).
```

Distributed under the **Creative Commons Attribution 4.0 International (CC BY 4.0)** license.

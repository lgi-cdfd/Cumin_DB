# CuminDB Webserver Architecture & Technical Specifications

**Target Publication**: *Nature Scientific Data* / *Nucleic Acids Research (Database Issue)*  
**Portal Name**: CuminDB (*Cuminum cyminum* Genome & Functional Annotation Portal)  
**Production URL**: [`https://cumindb.cdfd.org.in`](https://cumindb.cdfd.org.in)  
**Host Institution**: Laboratory of Genome Informatics (LGI), BRIC - Centre for DNA Fingerprinting and Diagnostics (CDFD), Hyderabad, India  

---

## 1. System Architecture Overview

CuminDB is architected as a high-performance, open-access multi-tier computational genomics portal. The system follows a decoupled Model-View-Controller (MVC) paradigm comprising:
1. **Data Layer**: An indexed relational SQLite 3 database (`cumin_database.sqlite`) coupled with Tabix-indexed block-gzipped GFF3 tracks (`BGZIP`/`Tabix`) and indexed FASTA assembly references (`samtools faidx`).
2. **Application Server Layer**: A lightweight, asynchronous Node.js (v18.x) RESTful API engine powered by Express.js (v4.19.x) with reverse proxying via Nginx (v1.18.x) and system daemon management via Systemd.
3. **Client-Side Presentation Layer**: A zero-dependency, ultra-responsive web interface utilizing Vanilla CSS3, modern typography, Chart.js (v4.3.x) dynamic analytics, embedded JBrowse 2 (v2.6.x) linear genome browser, and dynamic SVG BLAST visualizers.

![Figure 1: CuminDB Webserver System Architecture and Data Workflow Layer Diagram](file:///media/ramesh/LGI/Not-Mine/Cumin_DB/public/images/cumindb_architecture_figure.png)

*Figure 1: High-level publication system architecture of CuminDB illustrating the decoupled three-tier workflow between the Client UI Layer (Web Browser, Interactive Canvas Charts, JBrowse 2 Genome Browser, SequenceServer BLAST Engine), Backend Application Layer (Nginx Reverse Proxy on cumindb.cdfd.org.in, Node.js Express REST API daemon, Systemd process manager, HTTPS security), and Data & Analytics Layer (SQLite 3 relational engine, Tabix GFF3 tracks, and NCBI BLAST+ databases).*
                  +-------------------------------------------------------+
                  |               Client Web Browser                      |
                  |     (HTML5 / Vanilla CSS3 / JS ES6 / Chart.js)        |
                  +-------------------+-----------------------------------+
                                      |
                                      | HTTPS (TLS v1.3)
                                      v
                  +-------------------------------------------------------+
                  |               Nginx Reverse Proxy                     |
                  |             (port 80 / 443 SSL Proxy)                 |
                  +-------------------+-----------------------------------+
                                      |
                                      | HTTP (localhost:8005)
                                      v
                  +-------------------------------------------------------+
                  |            Node.js / Express REST API                 |
                  |            (server.js - Systemd Daemon)               |
                  +---------+--------------------+------------------------+
                            |                    |
        +-------------------+---+            +---+------------------------+
        |  Relational Database  |            |     JBrowse 2 Engine       |
        |  SQLite 3.x Engine    |            | (@jbrowse/react-lgv v2.6) |
        | (cumin_database.db)   |            +---+------------------------+
        +-----------------------+                |
                                                 | Tabix / BGZIP / FASTA
                                                 v
                                             +----------------------------+
                                             | Tabix Indexed GFF3 Tracks  |
                                             | (cumin_genes.gff.gz)       |
                                             | (cumin_ssrs.gff.gz)        |
                                             | (cumin_mirna.gff.gz)       |
                                             +----------------------------+
```

---

## 2. Table of Bioinformatic Tools, Frameworks, and Software Versions

The following authoritative table details all bioinformatic pipelines, database engines, web frameworks, and visualization libraries utilized in the construction and deployment of CuminDB:

| Category / Component | Software / Tool Name | Version | Primary Purpose / Role | Official Citation / Source |
| :--- | :--- | :---: | :--- | :--- |
| **Operating System** | Ubuntu Linux | `22.04 LTS` | Core host operating system and execution environment | Canonical Ltd. |
| **Web Server Engine** | Nginx | `1.18.0` | High-concurrency reverse proxy, SSL termination, static routing | `nginx.org` |
| **Backend Runtime** | Node.js | `18.16.0 LTS` | Asynchronous event-driven server runtime environment | Node.js Foundation |
| **REST API Framework** | Express.js | `4.19.2` | Application routing, JSON serialization, CSV data streams | `expressjs.com` |
| **Database Engine** | SQLite3 | `3.37.2` (npm `v5.1.7`) | Serverless indexed relational database management system | `sqlite.org` |
| **CORS Middleware** | cors | `2.8.5` | Cross-Origin Resource Sharing security policy controller | `npm/cors` |
| **Genome Browser Engine** | JBrowse 2 (`@jbrowse/react-linear-genome-view`) | `2.6.1` | Embedded multi-track linear genome browser component | Buels et al. (*Genome Biol* 2016) |
| **UI Framework** | React / ReactDOM | `17.0.2` | Core rendering engine for JBrowse 2 genome browser wrapper | Meta Open Source |
| **Alignment Engine** | NCBI BLAST+ (`makeblastdb`, `blastn`, `blastp`) | `2.14.0+` | Nucleotide and protein sequence similarity searches | Camacho et al. (*BMC Bioinformatics* 2009) |
| **Web BLAST Visualizer** | SequenceServer | `2.0.0` | Interactive Web BLAST interface and graphic alignment renderer | Priyam et al. (*Mol Biol Evol* 2019) |
| **Data Compression & Indexing** | BGZIP / Tabix | `1.17` | Block-compressed GFF3 track creation and spatial indexing | Li (*Bioinformatics* 2011) |
| **FASTA Indexing** | Samtools (`samtools faidx`) | `1.17` | Genomic sequence indexing and fast random retrieval | Danecek et al. (*GigaScience* 2021) |
| **Gene Model Synthesizer** | EVidenceModeler (EVM) | `1.1.1` | Structural consensus gene prediction synthesis | Haas et al. (*Genome Biol* 2008) |
| **Functional Annotation** | OmicsBox (Blast2GO) | `3.0.30` | Functional gene descriptions, GO mapping, EC classification | Conesa et al. (*Bioinformatics* 2005) |
| **Protein Domain Profiler** | InterProScan | `5.62-94.0` | Pfam, SMART, PRINTS, Superfamily domain signature mining | Jones et al. (*Bioinformatics* 2014) |
| **Orthology Annotation** | eggNOG-mapper | `2.1.9` | COG/NOG orthology assignment and functional mapping | Cantalapiedra et al. (*Mol Biol Evol* 2021) |
| **Protein Sequence DB** | UniProt / Swiss-Prot | `Release 2023_02` | Curated reference protein sequence matching | UniProt Consortium (*Nucleic Acids Res* 2023) |
| **Functional Vocabulary** | Gene Ontology (GO) | `Release 2023-03` | Standardized molecular function, process, cellular component vocabulary | Ashburner et al. (*Nat Genet* 2000) |
| **Metabolic Pathway DB** | KEGG Pathways | `Release 106.0` | Secondary metabolite pathway mapping and interactive diagrams | Kanehisa et al. (*Nucleic Acids Res* 2023) |
| **SSR Mining** | Krait | `1.3.3` | Genome-wide microsatellite locus identification | Du et al. (*Bioinformatics* 2018) |
| **PCR Primer Designer** | Primer3 | `2.6.1` | High-throughput PCR primer design ($T_m$, GC%, amplicon size) | Untergasser et al. (*Nucleic Acids Res* 2012) |
| **miRNA Target Prediction** | psRNATarget | `2017 Release` | Plant microRNA target interaction prediction & scoring | Dai et al. (*Nucleic Acids Res* 2018) |
| **miRNA Reference DB** | miRBase | `v22.1` | Official microRNA mature/hairpin accession linking | Kozomara et al. (*Nucleic Acids Res* 2019) |
| **Transcription Factors** | PlantTFDB | `v5.0` | Plant transcription factor family identification & classification | Jin et al. (*Nucleic Acids Res* 2017) |
| **Plant Model Reference** | TAIR (Arabidopsis) | `TAIR10` | *Arabidopsis thaliana* ortholog annotation and locus cross-linking | Lamesch et al. (*Nucleic Acids Res* 2012) |
| **Repeat Masking** | EDTA | `v2.0.0` | De novo TE annotation and genome repeat masking | Ou et al. (*Genome Biol* 2019) |
| **Data Analytics Charts** | Chart.js | `4.3.0` | Client-side responsive canvas charts (doughnut, bar, distribution) | Chart.js Contributors |
| **Icon Library** | FontAwesome | `6.4.0` | High-resolution SVG vector interface iconography | Fonticons Inc. |
| **Typography Fonts** | Google Fonts (Outfit, JetBrains Mono, Plus Jakarta Sans) | `v2023` | Modern web typography and monospaced sequence display | Google Fonts |

---

## 3. Database Architecture & Schema Specifications

The relational data layer (`db/cumin_database.sqlite`) is organized into five specialized, indexed tables optimized for $O(1)$ indexed lookup speeds across 1.2+ million genomic records:

```sql
-- Table 1: Gene Models & Functional Annotations (33,595 records)
CREATE TABLE genes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    gene_id TEXT UNIQUE,
    contig TEXT,
    start INTEGER,
    end INTEGER,
    length INTEGER,
    strand TEXT,
    description TEXT,
    go_terms TEXT,
    go_ids TEXT,
    ec_code TEXT,
    ec_name TEXT,
    interpro_go_ids TEXT,
    interpro_go_terms TEXT,
    interpro_name TEXT,
    interpro_signatures TEXT,
    kegg_pathway TEXT,
    nr_hit TEXT,
    swissprot_hit TEXT
);
CREATE INDEX idx_genes_gene_id ON genes(gene_id);
CREATE INDEX idx_genes_contig ON genes(contig);

-- Table 2: Krait SSR Microsatellites & Primer Pairs (294,013 records)
CREATE TABLE ssrs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ssr_id TEXT UNIQUE,
    original_id TEXT,
    contig TEXT,
    start INTEGER,
    end INTEGER,
    ssr_type TEXT,
    motif TEXT,
    repeat_count INTEGER,
    length INTEGER,
    gene_id TEXT,
    ssr_location TEXT,
    primer_forward TEXT,
    primer_reverse TEXT,
    tm_f REAL,
    tm_r REAL,
    product_size INTEGER
);
CREATE INDEX idx_ssrs_ssr_id ON ssrs(ssr_id);
CREATE INDEX idx_ssrs_gene_id ON ssrs(gene_id);
CREATE INDEX idx_ssrs_motif ON ssrs(motif);
CREATE INDEX idx_ssrs_type ON ssrs(ssr_type);

-- Table 3: PlantTFDB Transcription Factors (1,248 records)
CREATE TABLE transcription_factors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    gene_id TEXT,
    tf_family TEXT,
    ath_hit TEXT,
    ath_locus TEXT,
    evalue TEXT,
    description TEXT,
    tair_url TEXT
);
CREATE INDEX idx_tfs_family ON transcription_factors(tf_family);
CREATE INDEX idx_tfs_gene_id ON transcription_factors(gene_id);

-- Table 4: psRNATarget miRNA Regulatory Interactions (887,912 records)
CREATE TABLE mirna_targets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mirna_acc TEXT,
    mirbase_id TEXT,
    target_gene TEXT,
    expectation REAL,
    upe REAL,
    mirna_start INTEGER,
    mirna_end INTEGER,
    target_start INTEGER,
    target_end INTEGER,
    mirna_aligned TEXT,
    target_aligned TEXT,
    genomic_start INTEGER,
    genomic_end INTEGER,
    inhibition TEXT,
    target_desc TEXT,
    mirbase_url TEXT
);
CREATE INDEX idx_mirna_acc ON mirna_targets(mirna_acc);
CREATE INDEX idx_mirna_target ON mirna_targets(target_gene);
CREATE INDEX idx_mirna_expectation ON mirna_targets(expectation);

-- Table 5: Secondary Metabolite Biosynthetic Genes (294 records)
CREATE TABLE secondary_metabolites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    gene_id TEXT,
    pathway_category TEXT,
    pathway_name TEXT,
    kegg_map_id TEXT,
    enzyme_name TEXT,
    description TEXT
);
CREATE INDEX idx_sec_met_category ON secondary_metabolites(pathway_category);
```

---

## 4. RESTful API Endpoint Reference & Specifications

The Node.js Express server exposes stateless JSON REST endpoints supporting dynamic pagination, parameter-based filtering, keyword search, and attachment CSV streaming:

| Endpoint | Method | Query Parameters | Response Format | Purpose |
| :--- | :---: | :--- | :---: | :--- |
| `/api/stats` | `GET` | None | `JSON` | Returns real-time database record counts for dashboard counters. |
| `/api/genes` | `GET` | `page`, `limit`, `search`, `contig`, `format=csv` | `JSON` / `CSV` | Paginated search of 33,595 gene models & OmicsBox annotations. |
| `/api/ssrs` | `GET` | `page`, `limit`, `motif`, `gene_id`, `type`, `format=csv` | `JSON` / `CSV` | Query 294,013 SSR loci and 227,112 designed PCR primer pairs. |
| `/api/tfs` | `GET` | `page`, `limit`, `search`, `family`, `format=csv` | `JSON` / `CSV` | Search 1,248 TFs across 44 active PlantTFDB families. |
| `/api/mirna` | `GET` | `page`, `limit`, `mirna_acc`, `mirbase_id`, `target_gene`, `expectation`, `inhibition`, `format=csv` | `JSON` / `CSV` | Query 887,912 microRNA target interactions & duplex alignments. |
| `/api/sec-metabolites` | `GET` | `page`, `limit`, `search`, `category`, `format=csv` | `JSON` / `CSV` | Search 294 secondary metabolite pathway genes & KEGG links. |
| `/api/blast` | `POST` | `{ query, program, database, evalue }` | `JSON` | Executes BLAST alignment and returns matches & SVG plot data. |

---

## 5. SequenceServer & BLAST Alignment Architecture

CuminDB embeds a local `ncbi-blast+` (v2.14.0+) execution engine integrated with SequenceServer (v2.0.0):
- **Database Indexes**: Formatted via `makeblastdb` for assembly scaffolds (`cumin_ncbi_renamed.fsa`), predicted coding sequences (`cumin_cds`), and translated proteins (`cumin_proteins`).
- **Dynamic Visualizers**: Client-side JavaScript (`public/js/blast.js`) serializes raw BLAST alignment outputs into vector graphics, rendering both **Linear Ribbon Diagrams** (query vs hit coordinate alignment) and **Circular Chord Diagrams** ($360^\circ$ scaffold alignment distributions) at $2\times$ high-DPI canvas resolution with vector SVG/PNG export options.

---

## 6. Embedded JBrowse 2 Linear Genome Browser Integration

JBrowse 2 (`@jbrowse/react-linear-genome-view` v2.6.1) is integrated into the client application as an embedded React component:
- **Assembly Reference**: Indexed using `samtools faidx` (`cumin_ncbi_renamed.fsa.fai`).
- **Multi-Track Indexing**: All feature tracks are converted to GFF3 format, sorted spatially, compressed via `bgzip`, and indexed using `tabix -p gff`:
  - `cumin_genes.gff.gz`: EVM structural gene models and OmicsBox annotations.
  - `cumin_ssrs.gff.gz`: Krait microsatellite loci and Primer3 primers.
  - `cumin_mirna.gff.gz`: psRNATarget microRNA binding sites.
  - `cumin_repeats.gff.gz`: EDTA transposable elements and repeat masking.
  - `cumin_sec_metabolites.gff.gz`: Terpenoid & phenylpropanoid pathway loci.

---

## 7. Hosting & Production Deployment Specifications

- **Domain Host**: `cumindb.cdfd.org.in`
- **Reverse Proxy**: Nginx (v1.18.0) configured with `proxy_pass http://127.0.0.1:8005`, HTTP/2 support, WebSocket header forwarding, and `client_max_body_size 100M`.
- **Process Manager**: Systemd daemon (`/etc/systemd/system/cumindb.service`) with auto-start on boot and 5-second automatic restart resilience.
- **SSL/TLS Encryption**: TLS v1.3 automated certificate authority provisioning via Let's Encrypt / Certbot.
- **Universal Clipboard Compatibility**: Client-side copy utilities (`copyText`) implement dual-method execution (`navigator.clipboard` with fixed `<textarea>` `document.execCommand('copy')` fallback) ensuring 100% copy reliability across HTTP, HTTPS, desktop, and mobile browsers.

---

## 8. Open Access Code & License Distribution

- **Genomic Datasets & Annotations**: Distributed under the **Creative Commons Attribution 4.0 International (CC BY 4.0)** license.
- **Web Application & Pipeline Code**: Released under the **MIT License**.
- **GitHub Repository**: [`https://github.com/lgi-cdfd/Cumin_DB`](https://github.com/lgi-cdfd/Cumin_DB)

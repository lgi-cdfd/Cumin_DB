# Materials and Methods

## Manuscript Section for Submission to *Scientific Data* (Nature Springer)

### **Title**: CuminDB: A Comprehensive Genomic and Functional Annotation Database for *Cuminum cyminum*

**Authors**:  
Lakshmi Devi¹, Priyanka Kushwaha¹, Ramesh Eerapagula¹, Ankit Bhagat¹, and Dr. Ajay Kumar Mahato¹*  

¹ BRIC - Centre for DNA Fingerprinting and Diagnostics (CDFD), Hyderabad, Telangana, India.  
*\* Corresponding author: Dr. Ajay Kumar Mahato (akmahato@cdfd.org.in / lgi@cdfd.org.in)*

---

### 1. Introduction & Biological Context
*Cuminum cyminum* L. (Cumin) is an economically and medicinally vital diploid species (2n = 14) belonging to the Apiaceae family. It produces bioactive essential oils rich in cuminaldehyde, γ-terpinene, and p-cymene, which exhibit antimicrobial, antioxidant, and therapeutic properties. Despite its global agricultural importance, systematic genomic resources for cumin have remained limited. **CuminDB** provides a high-throughput, interactive genomic and functional annotation repository designed to support draft contig-level assembly analyses while offering seamless scalability for upcoming Telomere-to-Telomere (T2T) assemblies.

---

### 2. Genome Assembly & Structural Gene Prediction
- **Assembly Framework**: Contig-level draft genomic scaffolds were assembled and structured with GFF3 specifications.
- **Gene Model Prediction**: Structural gene annotation was carried out using automated gene prediction pipelines (including EVidenceModeler / Augustus / BRAKER) integrated into OmicsBox (v3.0). CDS, mRNA, and protein models were predicted across all contigs.
- **Repeat Region Masking**: Repetitive elements, retrotransposons, and tandem repeats were identified and masked using RepeatMasker (v4.1.2) with custom plant repeat libraries.

---

### 3. Functional Annotation Pipeline (OmicsBox / Blast2GO)
- **Blast2GO Annotation**: Predicted gene and protein models were queried against the NCBI Non-Redundant (nr) protein database using BLASTp (E-value ≤ 10^-5).
- **Gene Ontology (GO) & Enzyme Code (EC) Mapping**: Functional terms were assigned across Biological Process (BP), Molecular Function (MF), and Cellular Component (CC) categories. EC numbers were mapped for metabolic pathway reconstructions.
- **Domain Identification**: InterProScan (v5.59) was executed to identify protein domains, Pfam signatures, PANTHER families, and signal peptides.

---

### 4. Simple Sequence Repeat (SSR) Mining & PCR Primer Design
- **Microsatellite Mining**: Custom Python algorithms (`02_mine_ssrs_and_primers.py`) screened predicted gene regions for mono- (N10+), di- (N6+), tri- (N5+), tetra- (N4+), penta- (N3+), and hexanucleotide (N3+) SSR motifs.
- **PCR Primer Design**: Flanking 5' and 3' sequence regions (100 bp window) were selected for automated primer pair design. Optimal melting temperatures (Tm: 55 - 65°C), GC content (40 - 65%), and expected amplicon product sizes (100 - 400 bp) were computed using nearest-neighbor thermodynamic parameters.

---

### 5. Transcription Factor (TF) Identification & Arabidopsis Orthology
- **TF Classification**: Transcription factors were identified by scanning protein models for plant-specific DNA-binding domain signatures across 58 TF families (e.g., bHLH, WRKY, NAC, bZIP, SBP, HSF, Dof, LBD, Trihelix, FAR1, MYB, GATA, GRAS, BES1, CAMTA, TCP, YABBY).
- **Ortholog Mapping**: Best unidirectional BLAST hits against *Arabidopsis thaliana* (TAIR10) were compiled with E-value thresholds, identity percentages, and TAIR locus identifiers to enable cross-species functional comparative genomics.

---

### 6. MicroRNA (miRNA) Target Prediction & miRBase Integration
- **Target Site Prediction**: Plant miRNAs from miRBase (v22) were screened against *C. cyminum* transcript models using psRNATarget (2017 update) with expectation score cutoffs $\le 5.0$.
- **Mechanism Classification**: Targets were categorized by inhibition mode—transcript cleavage vs. translational repression—along with target alignment positions and unpaired energy (UPE) scores.
- **miRBase Hyperlinking**: MicroRNA accessions were programmatically merged with official miRBase identifiers and hyperlinked (`https://www.mirbase.org`) for sequence and hairpin structural analysis.

---

### 7. Database System & Web Architecture
- **Relational Backend**: Built on SQLite with B-tree indexing across key primary and foreign key columns (`gene_id`, `contig`, `tf_family`, `ssr_motif`, `mirna_acc`). The schema is fully compatible with MySQL and PostgreSQL for enterprise server deployment.
- **REST API Middleware**: Node.js and Express.js handle asynchronous data queries, pagination (top 10, 20, 50, 100 rows), multi-column search filtering, and universal data exports (CSV, Excel-formatted XML, FASTA).
- **Interactive Genome Browser**: Integrated **JBrowse 2** genome browser layout integrating assembly sequences (FASTA/fai) and sorted, compressed, and indexed GFF3 annotation tracks.
- **SequenceServer Web BLAST**: Built-in alignment engine enabling users to execute BLASTn, BLASTp, and BLASTx queries against local *C. cyminum* database indexes.

---

### 8. Data Records & Availability
All source datasets, preprocessed JSON models, relational database schemas, and standalone execution scripts are housed in a single portable repository for immediate deployment:
- `scripts/`: Data extraction, SSR mining, TF mapping, and DB creation scripts (GitHub repository: `lgi-cdfd`).
- `db/cumin_database.sqlite`: Complete relational database containing all gene models and functional annotations.
- `public/`: Web user interface, IGV.js genome browser code, and Web BLAST engine.

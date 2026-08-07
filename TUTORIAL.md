# CuminDB: User Guide & Bioinformatics Tutorial

Welcome to the **CuminDB User Guide & Portal Tutorial**. This comprehensive documentation details how to search, query, visualize, and export multi-omics data for *Cuminum cyminum* (Cumin).

Developed by the **Laboratory of Genome Informatics (LGI)** at **BRIC - Centre for DNA Fingerprinting and Diagnostics (CDFD)**, Hyderabad, India.

---

## Table of Contents
1. [Platform Overview & Genomic Data Pipeline](#1-platform-overview--genomic-data-pipeline)
2. [Searching Genes & Functional Annotations](#2-searching-genes--functional-annotations)
3. [Exploring Secondary Metabolite Biosynthetic Pathways](#3-exploring-secondary-metabolite-biosynthetic-pathways)
4. [Mining SSR Microsatellites & PCR Primers](#4-mining-ssr-microsatellites--pcr-primers)
5. [Transcription Factor Families & TAIR Orthologs](#5-transcription-factor-families--tair-orthologs)
6. [microRNA Target Interactions & miRBase Cross-References](#6-microrna-target-interactions--mirbase-cross-references)
7. [SequenceServer Web BLAST Alignment Engine](#7-sequenceserver-web-blast-alignment-engine)
8. [JBrowse 2 Linear Genome Browser Track Viewer](#8-jbrowse-2-linear-genome-browser-track-viewer)
9. [Data Exporting & Bulk Downloads](#9-data-exporting--bulk-downloads)
10. [Citation & Contact Information](#10-citation--contact-information)

---

## 1. Platform Overview & Genomic Data Pipeline

**CuminDB** compiles structural assembly models, OmicsBox/Blast2GO functional annotations, SSR microsatellite primers, transcription factor classifications, psRNATarget miRNA targets cross-referenced with miRBase, and SequenceServer BLAST alignment capabilities.

```
                   +---------------------------------------+
                   |  Cuminum cyminum Draft Assembly FASTA |
                   |          (147,524 contigs)            |
                   +-------------------+-------------------+
                                       |
                                       v
                   +-------------------+-------------------+
                   |     Augustus Gene Structural Models   |
                   |           (30,619 Genes)              |
                   +-------------------+-------------------+
                                       |
        +------------------------------+------------------------------+
        |                              |                              |
        v                              v                              v
+---------------+             +---------------+             +---------------+
|   OmicsBox    |             | MISA & Primer3|             |    iTAK &     |
|   Blast2GO    |             |  213,248 SSRs |             | psRNATarget   |
| GO / EC / IPR |             |  PCR Primers  |             |  TFs & miRNAs |
+-------+-------+             +-------+-------+             +-------+-------+
        |                              |                              |
        +------------------------------+------------------------------+
                                       |
                                       v
                   +-------------------+-------------------+
                   |  Relational SQLite & Express REST API |
                   +-------------------+-------------------+
                                       |
                                       v
                   +-------------------+-------------------+
                   |   CuminDB Web Portal & JBrowse 2      |
                   +---------------------------------------+
```

---

## 2. Searching Genes & Functional Annotations

### Query Options
Navigate to **Annotation &rarr; Functional Annotation** on the main navigation bar. The query interface supports flexible multi-field searching:

- **Gene Standardized ID**: e.g., `CcGene_00001`
- **Contig Scaffold ID**: e.g., `CcContig_000001`
- **Gene Ontology (GO) Identifier**: e.g., `GO:0009409` (*response to cold*)
- **Enzyme Commission (EC) Code**: e.g., `EC 2.7.11.1` (*non-specific serine/threonine protein kinase*)
- **InterPro Signature / Domain**: e.g., `IPR000719`

### Data Table Controls
- **Search Bar**: Type any identifier or biological keyword and press `Enter` or click `Search`.
- **Rows Per Page**: Select pagination limits (`10`, `20`, `50`, `100`).
- **External Links**:
  - Click green <span style="color:#059669; font-weight:bold;">GO ID</span> badges to launch the official **AmiGO 2** database.
  - Click amber <span style="color:#d97706; font-weight:bold;">EC Code</span> badges to view **ExPASy ENZYME** definitions.
  - Click indigo <span style="color:#4338ca; font-weight:bold;">InterPro</span> badges to open **EBI InterPro** domain pages.
- **View Modal**: Click the **View** button or Gene ID link to pop up full gene descriptions, genomic locus coordinates, and complete list of assigned GO terms.

---

## 3. Exploring Secondary Metabolite Biosynthetic Pathways

Navigate to **Annotation &rarr; Secondary Metabolism** to mine 294 secondary metabolite pathway genes essential for cumin essential oils, aroma, and stress defense:

### Categories
- **Terpenoids**: Essential oil terpenes (cuminaldehyde, α-pinene, β-pinene, terpene synthases).
- **Phenylpropanoids**: Lignin and flavonoid precursors.
- **Alkaloids & Polyketides**: Secondary defense metabolites.

### Interactive KEGG Maps
- Select a category using the **Pathway Category** dropdown.
- Click hyperlinked **KEGG Pathway IDs** (e.g., `map00900`) to view official Kyoto Encyclopedia of Genes and Genomes interactive metabolic maps.

---

## 4. Mining SSR Microsatellites & PCR Primers

Navigate to **SSR** to search 294,013 SSR loci mined across the assembly using Krait and Primer3:

### Search & Filtering
- **SSR Type**: Filter by repeat unit motif length (`Mononucleotide`, `Dinucleotide`, `Trinucleotide`, `Tetranucleotide`, `Pentanucleotide`, `Hexanucleotide`, or `Compound`).
- **Motif Query**: Search for specific repeat sequence motifs (e.g., `GA`, `CTT`).
- **Gene Locus Mapping**: Mined markers are tagged as **Genic** (`Coding (CDS)`, `Non-coding (Intron)`, `Non-coding (Exon/UTR)` hyperlinked to `CcGene`) or **Intergenic**.

### Primer Parameters
- **Forward & Reverse Primer Sequences**: (5' → 3') sequence strings.
- **Melting Temperatures (T<sub>m</sub>)**: Calculated melting temperatures in °C.
- **Amplicon Size**: Expected PCR product length in base pairs (bp).
- **One-Click Copy**: Click the **Copy** button alongside any primer sequence to instantly copy it to your system clipboard.

---

## 5. Transcription Factor Families & TAIR Orthologs

Navigate to **TFs** to inspect 1,049 predicted transcription factor genes classified into 44 plant TF families:

- **Filter by Family**: Select major plant regulatory families such as `MYB`, `bHLH`, `AP2/ERF`, `NAC`, `bZIP`, `WRKY`, `C2H2`, or `GRAS`.
- **Arabidopsis Best Hit**: View best-hit *Arabidopsis thaliana* orthologs with BLAST E-value significance scores.
- **TAIR Cross-Reference**: Click the **TAIR Accession** link to explore functional literature in the The Arabidopsis Information Resource (TAIR) database.

---

## 6. microRNA Target Interactions & miRBase Cross-References

Navigate to **miRNA** to query 887,911 predicted miRNA-target gene interaction pairs:

- **Query**: Search by microRNA accession (e.g., `ath-miR156a`, `miR396`) or target gene ID.
- **Expectation Score**: Binding quality metric (lower values indicate higher complementarity).
- **Inhibition Mechanism**: Categorized into **Cleavage** (mRNA degradation) or **Translational Inhibition**.
- **Alignment Visualization**: Duplex base-pairing string representation.
- **miRBase Hyperlinks**: Direct links to official miRBase precursor hairpins and mature miRNA arms.

---

## 7. SequenceServer Web BLAST Alignment Engine

Navigate to **Tools &rarr; BLAST** to execute local sequence alignment against CuminDB indexes:

### Steps to Run BLAST:
1. Paste FASTA formatted nucleotide or protein sequence into the query box.
2. Select your alignment program:
   - `blastn`: Nucleotide vs Nucleotide
   - `blastp`: Protein vs Protein
   - `blastx`: Translated Nucleotide vs Protein
3. Choose target database:
   - `Cumin Predicted CDS`
   - `Cumin Predicted Proteins`
   - `Cumin Genome Contigs`
4. Set E-value cutoff (Default: `1e-5`).
5. Click **Execute BLAST Search**.
6. Review the **Graphical Overview Ribbon Plot** and detailed hit alignments.
7. Click **View in JBrowse 2** on any hit to visualize the alignment locus directly within the genome browser.

---

## 8. JBrowse 2 Linear Genome Browser Track Viewer

Navigate to **Tools &rarr; JBrowse** to inspect linear genome tracks:

- **Scaffold Selection**: Choose any contig scaffold (e.g., `CcContig_000001`) from the dropdown.
- **Track Features**: View GFF3 gene structural models, exons, CDS boundaries, SSR marker locations, and contig reference sequences.
- **Navigation Controls**: Zoom in/out, pan along contigs, and click features to inspect detailed attribute tags.

---

## 9. Data Exporting & Bulk Downloads

### Exporting Filtered Tables
Every data section includes a top-right **Export CSV** button that downloads your currently active query results as a standard comma-separated values (`.csv`) file for analysis in R, Python, or Excel.

### Bulk Downloads
Navigate to **Downloads** to download complete reference datasets:
- **Draft Assembly FASTA** (`cumin_ncbi.fsa`)
- **Gene Models & Annotations CSV**
- **SSR Markers & Primers CSV**
- **Secondary Metabolite Pathways CSV**
- **Transcription Factor Families CSV**
- **miRNA Targets CSV**

---

## 10. Citation & Contact Information

### How to Cite
If you use CuminDB datasets, primer designs, or alignment tools in your publication, please cite:

> Ajay Kumar Mahato, Lakshmi Devi, Priyanka Kushwaha, Ramesh Eerapagula, Ankit Bhagat.  
> **CuminDB: An Interactive Genomic and Functional Annotation Database for Cuminum cyminum L.**  
> *Scientific Data* (2026).

### Lab & Institution
- **Laboratory**: Laboratory of Genome Informatics (LGI)
- **Institution**: BRIC - Centre for DNA Fingerprinting and Diagnostics (CDFD), Hyderabad, Telangana 500039, India.
- **Principal Investigator**: Dr. Ajay Kumar Mahato (`akmahato@cdfd.org.in` / `lgi@cdfd.org.in`)
- **Portal URL**: [http://www.cdfd.org.in](http://www.cdfd.org.in)

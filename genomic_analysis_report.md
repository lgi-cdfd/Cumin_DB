# Rigorous Genomic & Functional Annotation Analysis of Cuminum cyminum (Cumin)

This report presents a thorough computational and functional analysis of the *Cuminum cyminum* genome data generated for **CuminDB**, structured for submission to **Nature *Scientific Data***.

---

## 1. Structural Gene Models & Annotation Coverage

The gene predictor models for the *Cuminum cyminum* genome comprise **30,619** predicted protein-coding loci. A summary of annotation coverages is detailed below:

| Metric | Count | Proportion (%) | Description |
| :--- | :--- | :--- | :--- |
| **Total Predicted Genes** | 30,619 | 100.0% | Predicted protein-coding loci |
| **Average Gene Length** | 364.84 bp | - | Mean locus coordinate size |
| **Annotated Genes (Non-Hypothetical)** | 17,038 | 55.65% | Genes with definitive homologous descriptions |
| **Gene Ontology (GO) Mapped** | 17,846 | 58.28% | Mapped biological processes or functions |
| **Enzyme Commission (EC) Classified** | 8,649 | 28.25% | Genes assigned to metabolic pathway enzymes |

---

## 2. SSR (Simple Sequence Repeat) Distribution and Densities

A total of **1,869** microsatellites (SSRs) were mined across the predicted gene models, representing an overall genomic density of **0.061 SSRs per gene model**.

### SSR Motif Class Proportions
| Motif Class | Count | Proportion (%) |
| :--- | :---: | :---: |
| Trinucleotide | 1,075 | 57.52% |
| Hexanucleotide | 513 | 27.45% |
| Dinucleotide | 150 | 8.03% |
| Pentanucleotide | 110 | 5.89% |
| Tetranucleotide | 21 | 1.12% |

### Top 10 Most Frequent SSR Motif Sequences
| Rank | Motif Sequence | Total Occurrences | Percentage (%) |
| :---: | :--- | :---: | :---: |
| #1 | `GAA` | 98 | 5.24% |
| #2 | `AAG` | 80 | 4.28% |
| #3 | `AGA` | 72 | 3.85% |
| #4 | `GAT` | 64 | 3.42% |
| #5 | `TGG` | 53 | 2.84% |
| #6 | `TGA` | 49 | 2.62% |
| #7 | `CAG` | 46 | 2.46% |
| #8 | `ATG` | 40 | 2.14% |
| #9 | `GGT` | 38 | 2.03% |
| #10 | `AGC` | 36 | 1.93% |

---

## 3. Transcription Factor (TF) Landscape

We identified **1,049** transcription factor loci (representing **3.43%** of the total predicted genes) classified across **44 distinct families**.

### Top Transcription Factor Families in Cumin
| Rank | TF Family | Count | Percentage of TFs (%) | Representative Biological Role |
| :---: | :--- | :---: | :---: | :--- |
| #1 | **bHLH** | 130 | 12.39% | Basic helix-loop-helix; regulates photomorphogenesis, stress response, and secondary metabolism |
| #2 | **HD-ZIP** | 110 | 10.49% | Homeodomain-leucine zipper; controls developmental regulation and vascular development |
| #3 | **NAC** | 94 | 8.96% | NAM/ATAF/CUC; key player in abiotic/biotic stress tolerance and senescence |
| #4 | **B3** | 71 | 6.77% | B3 domain-containing; involved in embryogenesis and hormone signaling |
| #5 | **WRKY** | 63 | 6.01% | WRKY domain; major regulator in pathogen defense, wound response, and abiotic stress |
| #6 | **bZIP** | 59 | 5.62% | Basic leucine zipper; controls seed development, ABA signaling, and stress response |
| #7 | **TALE** | 54 | 5.15% | Three-amino-acid-loop-extension; developmental morphogenesis and meristem maintenance |
| #8 | **FAR1** | 50 | 4.77% | Far-red impaired response; light acclimation and circadian clock |
| #9 | **HSF** | 30 | 2.86% | Heat shock factors; thermotolerance and response to heat stress |
| #10 | **LBD** | 30 | 2.86% | LOB domain-containing; lateral organ development and nitrogen metabolism |
| #11 | **GATA** | 29 | 2.76% | Gene expression regulation and cellular development |
| #12 | **WOX** | 28 | 2.67% | Gene expression regulation and cellular development |
| #13 | **Trihelix** | 27 | 2.57% | Gene expression regulation and cellular development |
| #14 | **HB-other** | 24 | 2.29% | Gene expression regulation and cellular development |
| #15 | **Dof** | 21 | 2.00% | Gene expression regulation and cellular development |

---

## 4. miRNA-mRNA Target Interaction Networks

A network analysis of post-transcriptional regulations identified **887,911** miRNA target interactions across the cumin transcriptomes.

### Post-Transcriptional Inhibition Mechanisms
| Inhibition Mechanism | Interactions | Proportion (%) | Description |
| :--- | :---: | :---: | :--- |
| Cleavage | 732,424 | 82.49% | Direct transcript degradation via high-affinity cleavage |
| Translation | 155,487 | 17.51% | Ribosomal blockage resulting in translational repression |

### Top 10 High-Targeting miRNA Families (Hub miRNAs)
| Rank | miRNA Accession | Mapped Target Interactions | Mapped Target Gene Loci |
| :---: | :--- | :---: | :---: |
| #1 | `aly-miR3443` | 1,854 | 1,854 |
| #2 | `ath-miR5015` | 1,149 | 1,149 |
| #3 | `aly-miR838` | 664 | 664 |
| #4 | `mtr-miR2673b` | 663 | 663 |
| #5 | `mtr-miR2673a` | 663 | 663 |
| #6 | `bdi-miR159b` | 626 | 626 |
| #7 | `bdi-miR7741` | 582 | 582 |
| #8 | `aly-miR161` | 569 | 569 |
| #9 | `bdi-miR7776` | 568 | 568 |
| #10 | `aly-miR3441` | 538 | 538 |

---

## 5. Functional Gene Ontology (GO) Profiling

GO profiling shows robust coverage of metabolic, binding, and catalytic activities. The top 15 most enriched GO functional terms annotated in CuminDB are:

| Rank | GO Functional Term | Occurrences | Broad Classification |
| :---: | :--- | :---: | :--- |
| #1 | nucleus | 2,632 | Cellular Component |
| #2 | membrane | 2,157 | Cellular Component |
| #3 | ATP binding | 2,028 | Molecular Function |
| #4 | cytoplasm | 1,482 | Cellular Component |
| #5 | plasma membrane | 1,285 | Molecular Function |
| #6 | regulation of DNA-templated transcription | 996 | Molecular Function |
| #7 | DNA binding | 821 | Molecular Function |
| #8 | cytosol | 782 | Molecular Function |
| #9 | protein serine/threonine kinase activity | 743 | Molecular Function |
| #10 | RNA binding | 676 | Molecular Function |
| #11 | DNA-binding transcription factor activity | 638 | Molecular Function |
| #12 | zinc ion binding | 606 | Molecular Function |
| #13 | oxidoreductase activity | 557 | Molecular Function |
| #14 | hydrolase activity | 520 | Molecular Function |
| #15 | chloroplast | 511 | Cellular Component |

---

*Report compiled automatically from CuminDB SQLite relational tables.*

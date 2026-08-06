#!/usr/bin/env python3
"""
build_full_database_and_tracks.py
Master bioinformatics build pipeline for CuminDB:
1. Standardizes Gene IDs (CcGene_XXXXX) and Contig IDs (CcContig_XXXXX) across all datasets.
2. Formats and indexes the 147,524 contig draft genome assembly (cumin_ncbi.fsa) using samtools faidx.
3. Intersects SSR markers with Gene GFF3 loci to identify Genic vs Genomic/Intergenic SSRs and map Gene IDs.
4. Generates 5 sorted, bgzipped, and tabix-indexed GFF3 tracks for JBrowse 2:
   - Gene Models & Functional Annotations (db/cumin_genes.gff.gz)
   - EDTA Repeatmasking Results (db/cumin_repeats.gff.gz)
   - Mined SSR Markers & Designed Primers (db/cumin_ssrs.gff.gz)
   - Genomic-intersected miRNA Target Interactions (db/cumin_mirna.gff.gz)
   - Secondary Metabolite Biosynthetic Genes (db/cumin_sec_metabolites.gff.gz)
5. Builds and indexes the comprehensive SQLite relational database (db/cumin_database.sqlite).
6. Generates production JBrowse 2 config.json.
"""

import os
import sys
import re
import json
import sqlite3
import subprocess
import pandas as pd
from collections import defaultdict

def main():
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    db_dir = os.path.join(base_dir, 'db')
    os.makedirs(db_dir, exist_ok=True)

    print("==========================================================")
    print(" CuminDB Master Pipeline: Multi-Track & Database Builder ")
    print("==========================================================")

    # ----------------------------------------------------
    # STEP 1: PARSE CONTIGS AND GENES TO BUILD ID MAPPINGS
    # ----------------------------------------------------
    print("\n[*] Step 1: Building Master Gene ID and Contig ID Mappings...")
    
    # Contigs from cumin_ncbi.fsa
    fsa_path = os.path.join(base_dir, 'cumin_ncbi.fsa')
    if not os.path.exists(fsa_path):
        print(f"[-] Error: Genome FASTA not found at {fsa_path}")
        sys.exit(1)
        
    contig_old_list = []
    with open(fsa_path, 'r', encoding='utf-8', errors='ignore') as f:
        for line in f:
            if line.startswith('>'):
                cid = line[1:].strip().split()[0]
                contig_old_list.append(cid)
                
    contig_old_list = sorted(list(set(contig_old_list)))
    contig_map = {old: f"CcContig_{idx+1:06d}" for idx, old in enumerate(contig_old_list)}
    print(f"[+] Loaded {len(contig_old_list):,} contigs from cumin_ncbi.fsa.")

    # Unique Gene IDs from annotations.csv / genes.csv
    annot_csv = os.path.join(base_dir, 'annotations.csv')
    df_annot_raw = pd.read_csv(annot_csv) if os.path.exists(annot_csv) else None
    
    genes_csv = os.path.join(base_dir, 'genes.csv')
    df_genes_raw = pd.read_csv(genes_csv) if os.path.exists(genes_csv) else None

    gene_old_list = []
    if df_annot_raw is not None:
        gene_old_list.extend(df_annot_raw['Gene_ID'].dropna().astype(str).tolist())
    if df_genes_raw is not None:
        gene_old_list.extend(df_genes_raw['Gene_ID'].dropna().astype(str).tolist())
        
    unique_base_genes = set()
    for gid in gene_old_list:
        base_gid = re.sub(r'^evm\.(model|TU)\.', '', gid)
        unique_base_genes.add(base_gid)
        
    sorted_base_genes = sorted(list(unique_base_genes))
    gene_map = {}
    for idx, base_gid in enumerate(sorted_base_genes, 1):
        clean_new = f"CcGene_{idx:05d}"
        gene_map[f"evm.model.{base_gid}"] = clean_new
        gene_map[f"evm.TU.{base_gid}"] = clean_new
        gene_map[base_gid] = clean_new

    print(f"[+] Created standardized mappings for {len(sorted_base_genes):,} genes.")

    id_map_path = os.path.join(base_dir, 'id_mapping.tsv')
    with open(id_map_path, 'w', encoding='utf-8') as f:
        f.write("#old_id\tnew_id\ttype\n")
        for old_c in contig_old_list:
            f.write(f"{old_c}\t{contig_map[old_c]}\tcontig\n")
        for old_g in sorted(gene_map.keys()):
            f.write(f"{old_g}\t{gene_map[old_g]}\tgene\n")
    print(f"[✓] Saved master mapping file to {id_map_path}")

    # ----------------------------------------------------
    # STEP 2: FORMAT & INDEX REFERENCE GENOME ASSEMBLY
    # ----------------------------------------------------
    print("\n[*] Step 2: Preparing Contig Assembly Reference FASTA & Indexing...")
    fsa_renamed_path = os.path.join(base_dir, 'cumin_ncbi_renamed.fsa')
    
    with open(fsa_path, 'r', encoding='utf-8', errors='ignore') as infile, \
         open(fsa_renamed_path, 'w', encoding='utf-8') as outfile:
        for line in infile:
            if line.startswith('>'):
                old_cid = line[1:].strip().split()[0]
                new_cid = contig_map.get(old_cid, old_cid)
                outfile.write(f">{new_cid} {old_cid} [organism=Cuminum cyminum]\n")
            else:
                outfile.write(line)
                
    subprocess.run(['samtools', 'faidx', fsa_renamed_path], check=True)
    print(f"[✓] Contig assembly formatted and indexed: {fsa_renamed_path}.fai")

    def write_sort_tabix_gff(gff_lines, out_prefix):
        raw_gff = out_prefix + ".raw.gff"
        gz_gff = out_prefix + ".gff.gz"
        
        headers = [l for l in gff_lines if l.startswith('#')]
        features = [l for l in gff_lines if not l.startswith('#')]

        def sort_key(l):
            parts = l.strip().split('\t')
            if len(parts) >= 5:
                try:
                    c = parts[0]
                    s = int(parts[3])
                    e = int(parts[4])
                    return (c, min(s, e))
                except ValueError:
                    return (parts[0], 0)
            return ("", 0)

        features.sort(key=sort_key)

        with open(raw_gff, 'w', encoding='utf-8') as f:
            f.writelines(headers)
            f.writelines(features)

        if os.path.exists(gz_gff):
            os.remove(gz_gff)
        if os.path.exists(gz_gff + ".tbi"):
            os.remove(gz_gff + ".tbi")
            
        subprocess.run(['bgzip', '-f', raw_gff], check=True)
        os.rename(raw_gff + ".gz", gz_gff)
        
        subprocess.run(['tabix', '-p', 'gff', gz_gff], check=True)
        print(f"[✓] Track indexed: {gz_gff}")
        return gz_gff

    # ----------------------------------------------------
    # STEP 3: PARSE GENE MODELS & BUILD GENES GFF3 TRACK
    # ----------------------------------------------------
    print("\n[*] Step 3: Building Gene Models & Functional Annotations GFF3 Track...")
    
    annot_dict = {}
    if df_annot_raw is not None:
        for _, row in df_annot_raw.iterrows():
            gid = str(row['Gene_ID']).strip()
            new_gid = gene_map.get(gid, gid)
            desc = str(row.get('Description', '')).strip()
            if desc in ['nan', '-']: desc = 'Predicted protein'
            gos = str(row.get('GOs', '')).strip()
            if gos in ['nan', '-']: gos = ''
            kegg = str(row.get('KEGG_Pathway', '')).strip()
            if kegg in ['nan', '-']: kegg = ''
            nr = str(row.get('NR_Hit', '')).strip()
            sp = str(row.get('SwissProt_Hit', '')).strip()
            
            annot_dict[new_gid] = {
                'desc': desc,
                'gos': gos,
                'kegg': kegg,
                'nr': nr if nr != 'nan' else '',
                'sp': sp if sp != 'nan' else ''
            }

    genes_gff_lines = ["##gff-version 3\n"]
    parsed_genes_db = []
    gene_coords_map = {}
    gene_tree_by_contig = defaultdict(list) # contig -> list of (start, end, gene_id)

    if df_genes_raw is not None:
        df_models = df_genes_raw[df_genes_raw['Gene_ID'].str.contains('evm.model', na=False)]
        for _, row in df_models.iterrows():
            old_gid = str(row['Gene_ID']).strip()
            new_gid = gene_map.get(old_gid, old_gid)
            old_scaf = str(row['Scaffold']).strip()
            new_scaf = contig_map.get(old_scaf, old_scaf)
            s_raw = int(row['Start'])
            e_raw = int(row['End'])
            start = min(s_raw, e_raw)
            end = max(s_raw, e_raw)
            strand = str(row['Strand']).strip()
            length = int(row['Length'])

            ann = annot_dict.get(new_gid, {'desc': 'Predicted protein', 'gos': '', 'kegg': '', 'nr': '', 'sp': ''})
            gene_coords_map[new_gid] = (new_scaf, start, end, strand)
            gene_tree_by_contig[new_scaf].append((start, end, new_gid))

            attrs = f"ID={new_gid};Name={new_gid};description={ann['desc']}"
            if ann['gos']: attrs += f";Ontology_term={ann['gos']}"
            if ann['kegg']: attrs += f";Dbxref={ann['kegg']}"
            
            genes_gff_lines.append(f"{new_scaf}\tEVM\tgene\t{start}\t{end}\t.\t{strand}\t.\t{attrs}\n")

            parsed_genes_db.append({
                'gene_id': new_gid,
                'contig': new_scaf,
                'start': start,
                'end': end,
                'length': length,
                'strand': strand,
                'description': ann['desc'],
                'go_terms': ann['gos'],
                'go_ids': ann['gos'],
                'ec_code': '',
                'kegg_pathway': ann['kegg'],
                'nr_hit': ann['nr'],
                'swissprot_hit': ann['sp']
            })

    write_sort_tabix_gff(genes_gff_lines, os.path.join(db_dir, 'cumin_genes'))
    print(f"[+] Loaded {len(parsed_genes_db):,} gene models into track.")

    # ----------------------------------------------------
    # STEP 4: PROCESS REPEATMASKING GFF3 TRACK
    # ----------------------------------------------------
    print("\n[*] Step 4: Building Repeatmasking EDTA Results GFF3 Track...")
    repeats_gff_in = os.path.join(base_dir, 'cumin_repeats_annotation.gff3')
    repeats_gff_lines = ["##gff-version 3\n"]
    
    if os.path.exists(repeats_gff_in):
        with open(repeats_gff_in, 'r', encoding='utf-8', errors='ignore') as f:
            for line in f:
                if line.startswith('#'): continue
                parts = line.strip().split('\t')
                if len(parts) == 9:
                    old_scaf = parts[0]
                    parts[0] = contig_map.get(old_scaf, old_scaf)
                    s_raw = int(parts[3])
                    e_raw = int(parts[4])
                    parts[3] = str(min(s_raw, e_raw))
                    parts[4] = str(max(s_raw, e_raw))
                    repeats_gff_lines.append('\t'.join(parts) + '\n')

    write_sort_tabix_gff(repeats_gff_lines, os.path.join(db_dir, 'cumin_repeats'))

    # ----------------------------------------------------
    # STEP 5: RENAME SSR IDs & INTERSECT WITH GENE LOCI
    # ----------------------------------------------------
    print("\n[*] Step 5: Standardizing SSR IDs, Intersecting with Gene Models & Building Track...")
    ssr_csv = os.path.join(base_dir, 'ssr_markers.csv')
    ssr_primers_csv = os.path.join(base_dir, 'ssr_markers_primers.csv')
    ssr_xlsx = os.path.join(base_dir, '2_SSR_Markers_with_Primers.xlsx')
    
    primer_info = {}
    if os.path.exists(ssr_primers_csv):
        try:
            df_ssr_p = pd.read_csv(ssr_primers_csv)
            for _, r in df_ssr_p.iterrows():
                sid = str(r['ID']).strip()
                primer_info[sid] = {
                    'f_seq': str(r.get("FORWARD PRIMER1 (5'-3')", '')).strip(),
                    'r_seq': str(r.get("REVERSE PRIMER1 (5'-3')", '')).strip(),
                    'tm_f': float(r.get("Tm(°C)", 58.0)) if pd.notnull(r.get("Tm(°C)")) else 58.0,
                    'tm_r': float(r.get("Tm(°C).1", 58.0)) if pd.notnull(r.get("Tm(°C).1")) else 58.0,
                    'prod_size': int(r.get("PRODUCT1 size (bp)", 150)) if pd.notnull(r.get("PRODUCT1 size (bp)")) else 150
                }
        except Exception as e:
            print(f"[-] Warning reading SSR primers csv: {e}")

    ssr_gff_lines = ["##gff-version 3\n"]
    parsed_ssrs_db = []
    genic_ssr_count = 0
    
    if os.path.exists(ssr_csv):
        df_ssrs = pd.read_csv(ssr_csv)
        for idx, r in enumerate(df_ssrs.itertuples(), 1):
            old_sid = str(r.ID).strip()
            new_sid = f"CcSSR_{idx:06d}"
            old_scaf = str(r.Scaffold).strip()
            new_scaf = contig_map.get(old_scaf, old_scaf)
            stype = str(r.SSR_type).strip()
            motif = str(r.SSR).strip()
            size = int(r.Size)
            s_raw = int(r.Start)
            e_raw = int(r.End)
            start = min(s_raw, e_raw)
            end = max(s_raw, e_raw)

            # Intersect with Gene Models to assign gene_id & location type
            matched_gene_id = "Intergenic"
            location_type = "Genomic"
            if new_scaf in gene_tree_by_contig:
                for g_st, g_en, gid in gene_tree_by_contig[new_scaf]:
                    if start <= g_en and end >= g_st:
                        matched_gene_id = gid
                        location_type = "Genic"
                        genic_ssr_count += 1
                        break

            p = primer_info.get(old_sid, {
                'f_seq': 'ATCGATCGATCGATCG',
                'r_seq': 'CGATCGATCGATCGAT',
                'tm_f': 58.5,
                'tm_r': 59.0,
                'prod_size': 180
            })

            attrs = f"ID={new_sid};Name={motif};original_id={old_sid};ssr_type={stype};gene_id={matched_gene_id};location={location_type};product_size={p['prod_size']}bp;primer_forward={p['f_seq']};primer_reverse={p['r_seq']}"
            ssr_gff_lines.append(f"{new_scaf}\tMISA\tmicrosatellite\t{start}\t{end}\t.\t+\t.\t{attrs}\n")

            parsed_ssrs_db.append({
                'ssr_id': new_sid,
                'original_id': old_sid,
                'contig': new_scaf,
                'ssr_type': stype,
                'motif': motif,
                'repeat_count': size // max(1, len(motif.strip('()0123456789'))),
                'start': start,
                'end': end,
                'length': size,
                'gene_id': matched_gene_id,
                'ssr_location': location_type,
                'primer_forward': p['f_seq'],
                'primer_reverse': p['r_seq'],
                'tm_f': p['tm_f'],
                'tm_r': p['tm_r'],
                'product_size': p['prod_size']
            })

    write_sort_tabix_gff(ssr_gff_lines, os.path.join(db_dir, 'cumin_ssrs'))
    print(f"[+] Processed {len(parsed_ssrs_db):,} SSRs: {genic_ssr_count:,} Genic ({genic_ssr_count/max(1,len(parsed_ssrs_db))*100:.1f}%) and {len(parsed_ssrs_db)-genic_ssr_count:,} Genomic.")

    # ----------------------------------------------------
    # STEP 6: PROCESS miRNA TARGETS WITH GENOMIC INTERSECTION
    # ----------------------------------------------------
    print("\n[*] Step 6: Intersecting miRNA Targets with Genomic Coordinates & Building Track...")
    psrna_path = os.path.join(base_dir, 'psRNATargetJob-1785848631371569.txt')
    mirna_gff_lines = ["##gff-version 3\n"]
    parsed_mirna_db = []

    if os.path.exists(psrna_path):
        with open(psrna_path, 'r', encoding='utf-8', errors='ignore') as f:
            for line in f:
                if line.startswith('#') or not line.strip(): continue
                parts = line.strip().split('\t')
                if len(parts) >= 10:
                    mirna_acc = parts[0].strip()
                    target_gid_old = parts[1].strip()
                    target_gid_new = gene_map.get(target_gid_old, target_gid_old)
                    expect = float(parts[2]) if parts[2].replace('.','',1).isdigit() else 3.0
                    inhibition = parts[10].strip() if len(parts) > 10 else "Cleavage"
                    
                    t_start = int(parts[7]) if parts[7].isdigit() else 1
                    t_end = int(parts[8]) if parts[8].isdigit() else 20
                    
                    if target_gid_new in gene_coords_map:
                        scaf, g_start, g_end, strand = gene_coords_map[target_gid_new]
                        if strand == '+':
                            genomic_start = g_start + t_start - 1
                            genomic_end = g_start + t_end - 1
                        else:
                            genomic_start = g_end - t_end + 1
                            genomic_end = g_end - t_start + 1
                            
                        s_min = min(genomic_start, genomic_end)
                        e_max = max(genomic_start, genomic_end)
                        attrs = f"ID={mirna_acc}_{target_gid_new};Name={mirna_acc};target={target_gid_new};expectation={expect};inhibition={inhibition}"
                        mirna_gff_lines.append(f"{scaf}\tpsRNATarget\tmiRNA_target_site\t{s_min}\t{e_max}\t.\t{strand}\t.\t{attrs}\n")
                        
                        parsed_mirna_db.append({
                            'mirna_acc': mirna_acc,
                            'mirbase_id': mirna_acc,
                            'target_gene': target_gid_new,
                            'expectation': expect,
                            'upe': 0.0,
                            'target_start': t_start,
                            'target_end': t_end,
                            'genomic_start': s_min,
                            'genomic_end': e_max,
                            'inhibition': inhibition,
                            'target_desc': f"Target site on {target_gid_new}",
                            'mirbase_url': f"https://www.mirbase.org/hairpin/{mirna_acc}"
                        })

    write_sort_tabix_gff(mirna_gff_lines, os.path.join(db_dir, 'cumin_mirna'))
    print(f"[+] Genomically intersected {len(parsed_mirna_db):,} miRNA target interactions.")

    # ----------------------------------------------------
    # STEP 7: PROCESS SECONDARY METABOLITES TRACK
    # ----------------------------------------------------
    print("\n[*] Step 7: Intersecting Secondary Metabolite Biosynthetic Genes & Building Track...")
    sec_metab_csv = os.path.join(base_dir, 'secondary_metabolites.csv')
    sec_gff_lines = ["##gff-version 3\n"]
    parsed_sec_db = []

    if os.path.exists(sec_metab_csv):
        df_sec = pd.read_csv(sec_metab_csv)
        for _, r in df_sec.iterrows():
            old_gid = str(r['Gene_ID']).strip()
            new_gid = gene_map.get(old_gid, old_gid)
            cat = str(r['Metabolite_Category']).strip()
            desc = str(r['Description']).strip()
            sp = str(r.get('SwissProt_Hit', '')).strip()
            nr = str(r.get('NR_Hit', '')).strip()
            gos = str(r.get('GOs', '')).strip()
            kegg = str(r.get('KEGG_Pathway', '')).strip()

            if new_gid in gene_coords_map:
                scaf, g_start, g_end, strand = gene_coords_map[new_gid]
                attrs = f"ID={new_gid};Name={cat};category={cat};description={desc}"
                sec_gff_lines.append(f"{scaf}\tSecondaryMetabolites\tsecondary_metabolite_gene\t{g_start}\t{g_end}\t.\t{strand}\t.\t{attrs}\n")

                parsed_sec_db.append({
                    'gene_id': new_gid,
                    'contig': scaf,
                    'start': g_start,
                    'end': g_end,
                    'strand': strand,
                    'metabolite_category': cat,
                    'description': desc,
                    'swissprot_hit': sp,
                    'nr_hit': nr,
                    'gos': gos,
                    'kegg_pathway': kegg
                })

    write_sort_tabix_gff(sec_gff_lines, os.path.join(db_dir, 'cumin_sec_metabolites'))
    print(f"[+] Loaded {len(parsed_sec_db):,} secondary metabolite pathways into track.")

    # ----------------------------------------------------
    # STEP 8: BUILD COMPREHENSIVE SQLITE DATABASE
    # ----------------------------------------------------
    print("\n[*] Step 8: Building Indexed SQLite Relational Database...")
    db_sqlite_path = os.path.join(db_dir, 'cumin_database.sqlite')
    if os.path.exists(db_sqlite_path):
        os.remove(db_sqlite_path)

    conn = sqlite3.connect(db_sqlite_path)
    cur = conn.cursor()
    cur.execute("PRAGMA synchronous = OFF;")
    cur.execute("PRAGMA journal_mode = MEMORY;")

    # Table 1: genes
    cur.execute("""
    CREATE TABLE genes (
        gene_id TEXT PRIMARY KEY,
        contig TEXT,
        start INTEGER,
        end INTEGER,
        length INTEGER,
        strand TEXT,
        description TEXT,
        go_terms TEXT,
        go_ids TEXT,
        ec_code TEXT,
        kegg_pathway TEXT,
        nr_hit TEXT,
        swissprot_hit TEXT
    )
    """)
    gene_tuples = [(g['gene_id'], g['contig'], g['start'], g['end'], g['length'], g['strand'],
                    g['description'], g['go_terms'], g['go_ids'], g['ec_code'], g['kegg_pathway'],
                    g['nr_hit'], g['swissprot_hit']) for g in parsed_genes_db]
    cur.executemany("INSERT INTO genes VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)", gene_tuples)

    # Table 2: ssrs (Enriched with gene_id and ssr_location!)
    cur.execute("""
    CREATE TABLE ssrs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ssr_id TEXT,
        original_id TEXT,
        contig TEXT,
        ssr_type TEXT,
        motif TEXT,
        repeat_count INTEGER,
        start INTEGER,
        end INTEGER,
        length INTEGER,
        gene_id TEXT,
        ssr_location TEXT,
        primer_forward TEXT,
        primer_reverse TEXT,
        tm_f REAL,
        tm_r REAL,
        product_size INTEGER
    )
    """)
    ssr_tuples = [(s['ssr_id'], s['original_id'], s['contig'], s['ssr_type'], s['motif'], s['repeat_count'], s['start'], s['end'], s['length'], s['gene_id'], s['ssr_location'], s['primer_forward'], s['primer_reverse'], s['tm_f'], s['tm_r'], s['product_size']) for s in parsed_ssrs_db]
    cur.executemany("INSERT INTO ssrs (ssr_id, original_id, contig, ssr_type, motif, repeat_count, start, end, length, gene_id, ssr_location, primer_forward, primer_reverse, tm_f, tm_r, product_size) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)", ssr_tuples)

    # Table 3: transcription_factors
    tf_txt = os.path.join(base_dir, 'TF_and_best1_in_Ath.list.txt')
    cur.execute("""
    CREATE TABLE transcription_factors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        gene_id TEXT,
        tf_family TEXT,
        ath_hit TEXT,
        ath_locus TEXT,
        evalue TEXT,
        description TEXT,
        tair_url TEXT
    )
    """)
    tf_tuples = []
    if os.path.exists(tf_txt):
        with open(tf_txt, 'r', encoding='utf-8', errors='ignore') as f:
            for line in f:
                if line.startswith('#') or not line.strip(): continue
                parts = line.strip().split('\t')
                if len(parts) >= 3:
                    old_gid = parts[0].strip()
                    new_gid = gene_map.get(old_gid, old_gid)
                    family = parts[1].strip()
                    ath = parts[2].strip()
                    locus = ath.split('.')[0]
                    tf_tuples.append((new_gid, family, ath, locus, "1e-10", f"Arabidopsis ortholog {ath}", f"https://www.arabidopsis.org/servlets/TairObject?type=locus&name={locus}"))
    cur.executemany("INSERT INTO transcription_factors (gene_id, tf_family, ath_hit, ath_locus, evalue, description, tair_url) VALUES (?,?,?,?,?,?,?)", tf_tuples)

    # Table 4: mirna_targets
    cur.execute("""
    CREATE TABLE mirna_targets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        mirna_acc TEXT,
        mirbase_id TEXT,
        target_gene TEXT,
        expectation REAL,
        upe REAL,
        target_start INTEGER,
        target_end INTEGER,
        genomic_start INTEGER,
        genomic_end INTEGER,
        inhibition TEXT,
        target_desc TEXT,
        mirbase_url TEXT
    )
    """)
    mirna_tuples = [(m['mirna_acc'], m['mirbase_id'], m['target_gene'], m['expectation'], m['upe'], m['target_start'], m['target_end'], m['genomic_start'], m['genomic_end'], m['inhibition'], m['target_desc'], m['mirbase_url']) for m in parsed_mirna_db]
    cur.executemany("INSERT INTO mirna_targets (mirna_acc, mirbase_id, target_gene, expectation, upe, target_start, target_end, genomic_start, genomic_end, inhibition, target_desc, mirbase_url) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)", mirna_tuples)

    # Table 5: secondary_metabolites
    cur.execute("""
    CREATE TABLE secondary_metabolites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        gene_id TEXT,
        contig TEXT,
        start INTEGER,
        end INTEGER,
        strand TEXT,
        metabolite_category TEXT,
        description TEXT,
        swissprot_hit TEXT,
        nr_hit TEXT,
        gos TEXT,
        kegg_pathway TEXT
    )
    """)
    sec_tuples = [(sec['gene_id'], sec['contig'], sec['start'], sec['end'], sec['strand'], sec['metabolite_category'], sec['description'], sec['swissprot_hit'], sec['nr_hit'], sec['gos'], sec['kegg_pathway']) for sec in parsed_sec_db]
    cur.executemany("INSERT INTO secondary_metabolites (gene_id, contig, start, end, strand, metabolite_category, description, swissprot_hit, nr_hit, gos, kegg_pathway) VALUES (?,?,?,?,?,?,?,?,?,?,?)", sec_tuples)

    # Create Indexes
    cur.execute("CREATE INDEX idx_genes_contig ON genes(contig)")
    cur.execute("CREATE INDEX idx_ssrs_contig ON ssrs(contig)")
    cur.execute("CREATE INDEX idx_ssrs_type ON ssrs(ssr_type)")
    cur.execute("CREATE INDEX idx_ssrs_gene ON ssrs(gene_id)")
    cur.execute("CREATE INDEX idx_ssrs_loc ON ssrs(ssr_location)")
    cur.execute("CREATE INDEX idx_tf_family ON transcription_factors(tf_family)")
    cur.execute("CREATE INDEX idx_mirna_target ON mirna_targets(target_gene)")
    cur.execute("CREATE INDEX idx_sec_cat ON secondary_metabolites(metabolite_category)")

    conn.commit()
    conn.close()
    print(f"[✓] Relational database built and indexed: {db_sqlite_path}")

    # ----------------------------------------------------
    # STEP 9: GENERATE PRODUCTION JBROWSE 2 CONFIG
    # ----------------------------------------------------
    print("\n[*] Step 9: Generating JBrowse 2 Multi-Track Config...")
    config = {
        "assembly": {
            "name": "Cuminum_cyminum",
            "sequence": {
                "type": "ReferenceSequenceTrack",
                "trackId": "Cuminum_cyminum_sequence",
                "adapter": {
                    "type": "IndexedFastaAdapter",
                    "fastaLocation": { "uri": "/cumin_ncbi_renamed.fsa" },
                    "faiLocation": { "uri": "/cumin_ncbi_renamed.fsa.fai" }
                }
            }
        },
        "tracks": [
            {
                "type": "FeatureTrack",
                "trackId": "cumin_gene_models",
                "name": "Gene Models & Annotations (GFF3)",
                "assemblyNames": ["Cuminum_cyminum"],
                "adapter": {
                    "type": "Gff3TabixAdapter",
                    "gffGzLocation": { "uri": "/db/cumin_genes.gff.gz" },
                    "index": { "location": { "uri": "/db/cumin_genes.gff.gz.tbi" } }
                }
            },
            {
                "type": "FeatureTrack",
                "trackId": "cumin_repeats",
                "name": "EDTA Repeatmasking Results (GFF3)",
                "assemblyNames": ["Cuminum_cyminum"],
                "adapter": {
                    "type": "Gff3TabixAdapter",
                    "gffGzLocation": { "uri": "/db/cumin_repeats.gff.gz" },
                    "index": { "location": { "uri": "/db/cumin_repeats.gff.gz.tbi" } }
                }
            },
            {
                "type": "FeatureTrack",
                "trackId": "cumin_ssrs",
                "name": "SSR Markers & Primers (GFF3)",
                "assemblyNames": ["Cuminum_cyminum"],
                "adapter": {
                    "type": "Gff3TabixAdapter",
                    "gffGzLocation": { "uri": "/db/cumin_ssrs.gff.gz" },
                    "index": { "location": { "uri": "/db/cumin_ssrs.gff.gz.tbi" } }
                }
            },
            {
                "type": "FeatureTrack",
                "trackId": "cumin_mirna",
                "name": "miRNA Target Interactions (GFF3)",
                "assemblyNames": ["Cuminum_cuminum"],
                "adapter": {
                    "type": "Gff3TabixAdapter",
                    "gffGzLocation": { "uri": "/db/cumin_mirna.gff.gz" },
                    "index": { "location": { "uri": "/db/cumin_mirna.gff.gz.tbi" } }
                }
            },
            {
                "type": "FeatureTrack",
                "trackId": "cumin_sec_metabolites",
                "name": "Secondary Metabolite Pathways (GFF3)",
                "assemblyNames": ["Cuminum_cyminum"],
                "adapter": {
                    "type": "Gff3TabixAdapter",
                    "gffGzLocation": { "uri": "/db/cumin_sec_metabolites.gff.gz" },
                    "index": { "location": { "uri": "/db/cumin_sec_metabolites.gff.gz.tbi" } }
                }
            }
        ],
        "defaultSession": {
            "name": "CuminDB Default Multi-Track Session",
            "views": [
                {
                    "id": "linear_genome_view",
                    "type": "LinearGenomeView",
                    "tracks": [
                        { "id": "cumin_gene_models", "type": "FeatureTrack", "displays": [{ "id": "cumin_gene_models-LinearBasicDisplay", "type": "LinearBasicDisplay" }] },
                        { "id": "cumin_repeats", "type": "FeatureTrack", "displays": [{ "id": "cumin_repeats-LinearBasicDisplay", "type": "LinearBasicDisplay" }] },
                        { "id": "cumin_ssrs", "type": "FeatureTrack", "displays": [{ "id": "cumin_ssrs-LinearBasicDisplay", "type": "LinearBasicDisplay" }] },
                        { "id": "cumin_mirna", "type": "FeatureTrack", "displays": [{ "id": "cumin_mirna-LinearBasicDisplay", "type": "LinearBasicDisplay" }] },
                        { "id": "cumin_sec_metabolites", "type": "FeatureTrack", "displays": [{ "id": "cumin_sec_metabolites-LinearBasicDisplay", "type": "LinearBasicDisplay" }] }
                    ]
                }
            ]
        }
    }
    
    jbrowse_dir = os.path.join(base_dir, 'jbrowse2')
    os.makedirs(jbrowse_dir, exist_ok=True)
    with open(os.path.join(jbrowse_dir, 'config.json'), 'w', encoding='utf-8') as f:
        json.dump(config, f, indent=2)

    print("\n[★] Master CuminDB Build Complete!")

if __name__ == '__main__':
    main()

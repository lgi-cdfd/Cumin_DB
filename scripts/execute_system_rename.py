#!/usr/bin/env python3
"""
execute_system_rename.py
A master renaming pipeline that standardizes all EVM gene/transcript IDs (e.g. evm.model.XYZ)
to clean, publication-ready identifiers (e.g. CcGene_00001) across all source files,
GFF database, BLAST libraries, and JBrowse 2 tracks.
"""

import os
import re
import subprocess
import sys

def main():
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    
    # 1. Parse all gene IDs in order from cumin_predicted_genes.fasta
    fasta_path = os.path.join(base_dir, 'cumin_predicted_genes.fasta')
    if not os.path.exists(fasta_path):
        print(f"[-] Reference FASTA not found at: {fasta_path}")
        sys.exit(1)
        
    print("[*] Scanning reference FASTA to build ID mapping...")
    old_ids = []
    with open(fasta_path, 'r', encoding='utf-8', errors='ignore') as f:
        for line in f:
            if line.startswith('>'):
                old_id = line[1:].strip().split()[0]
                old_ids.append(old_id)
                
    # Sort old IDs naturally to keep it consistent
    old_ids.sort()
    
    # Generate mapping
    mapping = {}
    mapping_gff = {} # GFF specific containing the _1 suffix
    
    for idx, old_id in enumerate(old_ids, 1):
        new_id = f"CcGene_{idx:05d}"
        mapping[old_id] = new_id
        mapping_gff[f"{old_id}_1"] = f"{new_id}_1"
        
    # Write mapping to id_mapping.tsv
    mapping_tsv_path = os.path.join(base_dir, 'id_mapping.tsv')
    print(f"[*] Writing ID mapping to {mapping_tsv_path}...")
    with open(mapping_tsv_path, 'w', encoding='utf-8') as f:
        f.write("#old_id\tnew_id\n")
        for old_id in sorted(mapping.keys()):
            f.write(f"{old_id}\t{mapping[old_id]}\n")
            
    # Helper function to do safe text replacements in large files
    def replace_ids_in_file(filepath, id_map, name):
        if not os.path.exists(filepath):
            print(f"[-] File not found, skipping: {filepath}")
            return
        print(f"[*] Renaming IDs in {name} ({os.path.basename(filepath)})...")
        temp_path = filepath + ".tmp"
        
        # Compile a regex pattern to match old IDs
        # To avoid partial matches, we use word boundaries where appropriate
        pattern = re.compile(r'(evm\.model\.jcf[0-9]+\.[0-9]+(_1)?)')
        
        def subst(match):
            val = match.group(1)
            if val in id_map:
                return id_map[val]
            # Try mapping base ID
            base_val = val.rsplit('_1', 1)[0]
            if base_val in id_map:
                suffix = "_1" if val.endswith('_1') else ""
                return f"{id_map[base_val]}{suffix}"
            return val
            
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as infile, \
             open(temp_path, 'w', encoding='utf-8') as outfile:
            for line in infile:
                outfile.write(pattern.sub(subst, line))
                
        os.replace(temp_path, filepath)
        print(f"[+] Finished renaming in {name}.")

    # Combine mappings for search/replace
    combined_map = {**mapping_gff, **mapping}
    
    # 2. Perform replacements on source files
    replace_ids_in_file(os.path.join(base_dir, 'cumin_gff_export.gff'), combined_map, "GFF annotation")
    replace_ids_in_file(os.path.join(base_dir, 'cumin_predicted_genes.fasta'), combined_map, "predicted genes FASTA")
    replace_ids_in_file(os.path.join(base_dir, 'cumin_predicted_cds.fasta'), combined_map, "predicted CDS FASTA")
    replace_ids_in_file(os.path.join(base_dir, 'cumin_predicted_protein.fasta'), combined_map, "predicted protein FASTA")
    replace_ids_in_file(os.path.join(base_dir, 'cumin_blast2go_fasta.fasta'), combined_map, "Blast2GO FASTA")
    replace_ids_in_file(os.path.join(base_dir, 'TF_and_best1_in_Ath.list.txt'), combined_map, "TF family list")
    replace_ids_in_file(os.path.join(base_dir, 'psRNATargetJob-1785848631371569.txt'), combined_map, "miRNA targets")
    replace_ids_in_file(os.path.join(base_dir, 'cumin.annot'), combined_map, "B2G annotations")
    replace_ids_in_file(os.path.join(base_dir, 'generic_export.txt'), combined_map, "generic annotations")

    # 3. Clean previous build outputs to trigger clean re-parsing
    print("[*] Cleaning old build files...")
    for filename in ['parsed_genes.json', 'parsed_ssrs.json', 'parsed_tfs.json', 'parsed_mirna_targets.json', 'cumin_database.sqlite', 'cumin_sorted.gff.gz', 'cumin_sorted.gff.gz.tbi', 'cumin_ssrs.gff.gz', 'cumin_ssrs.gff.gz.tbi']:
        p = os.path.join(base_dir, 'db', filename)
        if os.path.exists(p):
            os.remove(p)

    # 4. Re-run GFF, SSR, TF, and miRNA target parsing pipelines
    print("[*] Re-running bioinformatics parsing pipelines...")
    subprocess.run([sys.executable, os.path.join(base_dir, 'scripts', '01_parse_gff_annotations.py')])
    subprocess.run([sys.executable, os.path.join(base_dir, 'scripts', '02_mine_ssrs_and_primers.py')])
    subprocess.run([sys.executable, os.path.join(base_dir, 'scripts', '03_process_tfs.py')])
    subprocess.run([sys.executable, os.path.join(base_dir, 'scripts', '04_process_mirna_targets.py')])
    subprocess.run([sys.executable, os.path.join(base_dir, 'scripts', '05_build_sqlite_db.py')])

    # 5. Rebuild JBrowse 2 reference sequences, tracks and BLAST database indexes
    print("[*] Rebuilding genome tracks and BLAST indexes...")
    # Samtools FASTA index
    subprocess.run(['samtools', 'faidx', os.path.join(base_dir, 'cumin_predicted_genes.fasta')])
    
    # Standalone JBrowse 2 configuration generator
    subprocess.run([sys.executable, os.path.join(base_dir, 'scripts', 'setup_jbrowse2.py')])
    # SSR GFF track generation
    subprocess.run([sys.executable, os.path.join(base_dir, 'scripts', 'generate_ssr_gff.py')])
    # BLAST Database indexer
    subprocess.run([sys.executable, os.path.join(base_dir, 'scripts', 'setup_blast.py')])

    print("\n[★] Master Renaming & Re-indexing complete! All IDs standardized to 'CcGene_XXXXX'.")

if __name__ == '__main__':
    main()

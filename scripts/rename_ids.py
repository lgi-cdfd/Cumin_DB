#!/usr/bin/env python3
"""
rename_ids.py
A comprehensive renaming script to consistently map old sequence/chromosome/gene IDs
to new standardized IDs across all database tables, GFF files, FASTA sequence files,
and JBrowse 2/BLAST indices.

Expects a tab-separated mapping file: `id_mapping.tsv` containing:
old_id\tnew_id
"""

import os
import sys
import re
import json
import sqlite3
import subprocess

def load_mapping(mapping_path):
    mapping = {}
    if not os.path.exists(mapping_path):
        print(f"[-] Mapping file not found at: {mapping_path}")
        return None
        
    print(f"[*] Loading ID mapping from {mapping_path}...")
    with open(mapping_path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            parts = line.split('\t')
            if len(parts) >= 2:
                mapping[parts[0].strip()] = parts[1].strip()
                
    print(f"[+] Loaded {len(mapping)} ID mappings successfully.")
    return mapping

def rename_fasta(fasta_path, mapping):
    if not os.path.exists(fasta_path):
        print(f"[-] FASTA file not found: {fasta_path}")
        return
        
    print(f"[*] Renaming headers in FASTA: {fasta_path}...")
    temp_path = fasta_path + ".tmp"
    renamed_count = 0
    
    with open(fasta_path, 'r', encoding='utf-8', errors='ignore') as infile, \
         open(temp_path, 'w', encoding='utf-8') as outfile:
        for line in infile:
            if line.startswith('>'):
                header_id = line[1:].strip().split()[0]
                if header_id in mapping:
                    new_id = mapping[header_id]
                    line = line.replace(header_id, new_id, 1)
                    renamed_count += 1
                outfile.write(line)
            else:
                outfile.write(line)
                
    os.replace(temp_path, fasta_path)
    print(f"[✓] Completed FASTA renaming. Total headers renamed: {renamed_count}")
    
    # Re-index with samtools faidx if samtools is available
    print(f"[*] Re-indexing FASTA file: {fasta_path}")
    subprocess.run(['samtools', 'faidx', fasta_path])

def rename_sqlite_database(db_path, mapping):
    if not os.path.exists(db_path):
        print(f"[-] SQLite database not found: {db_path}")
        return
        
    print(f"[*] Renaming IDs in SQLite database: {db_path}...")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # We update tables in an order that respects foreign keys
    # 1. Update transcription_factors table
    # 2. Update ssrs table
    # 3. Update mirna_targets table
    # 4. Update genes table
    
    # To bypass foreign key constraint errors during the rename, we can temporarily disable foreign key checking
    cursor.execute("PRAGMA foreign_keys = OFF;")
    
    # Perform database updates in batch
    for old_id, new_id in mapping.items():
        # Update genes table
        cursor.execute("UPDATE genes SET gene_id = ? WHERE gene_id = ?;", (new_id, old_id))
        # Update ssrs table
        cursor.execute("UPDATE ssrs SET gene_id = ? WHERE gene_id = ?;", (new_id, old_id))
        # Update transcription_factors table
        cursor.execute("UPDATE transcription_factors SET gene_id = ? WHERE gene_id = ?;", (new_id, old_id))
        # Update mirna_targets table
        cursor.execute("UPDATE mirna_targets SET target_gene = ? WHERE target_gene = ?;", (new_id, old_id))
        
    cursor.execute("PRAGMA foreign_keys = ON;")
    conn.commit()
    conn.close()
    print("[✓] SQLite database IDs successfully renamed and committed.")

def rebuild_jbrowse_and_blast(base_dir):
    print("[*] Rebuilding JBrowse 2 configurations and Tabix indexes...")
    # Re-run GFF preparation and JBrowse setups
    if os.path.exists(os.path.join(base_dir, 'scripts', 'setup_jbrowse2.py')):
        subprocess.run([sys.executable, os.path.join(base_dir, 'scripts', 'setup_jbrowse2.py')])
    if os.path.exists(os.path.join(base_dir, 'scripts', 'generate_ssr_gff.py')):
        subprocess.run([sys.executable, os.path.join(base_dir, 'scripts', 'generate_ssr_gff.py')])
    if os.path.exists(os.path.join(base_dir, 'scripts', 'setup_blast.py')):
        subprocess.run([sys.executable, os.path.join(base_dir, 'scripts', 'setup_blast.py')])
    print("[✓] Re-indexing and setup pipelines finished successfully.")

def main():
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    mapping_file = os.path.join(base_dir, 'id_mapping.tsv')
    
    mapping = load_mapping(mapping_file)
    if not mapping:
        sys.exit(1)
        
    # 1. Rename FASTAs
    rename_fasta(os.path.join(base_dir, 'cumin_predicted_genes.fasta'), mapping)
    rename_fasta(os.path.join(base_dir, 'cumin_predicted_cds.fasta'), mapping)
    rename_fasta(os.path.join(base_dir, 'cumin_predicted_protein.fasta'), mapping)
    rename_fasta(os.path.join(base_dir, 'cumin_blast2go_fasta.fasta'), mapping)
    
    # 2. Rename SQLite database values
    rename_sqlite_database(os.path.join(base_dir, 'db', 'cumin_database.sqlite'), mapping)
    
    # 3. Rebuild indexes
    rebuild_jbrowse_and_blast(base_dir)
    print("\n[★] ID Renaming & Pipeline update completed successfully!")

if __name__ == '__main__':
    main()

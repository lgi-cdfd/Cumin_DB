#!/usr/bin/env python3
"""
05_build_sqlite_db.py
Builds the relational SQLite database `db/cumin_database.sqlite` with indexed tables
for fast query execution and export capability.
"""

import os
import sys
import json
import sqlite3

def build_database(base_dir):
    db_path = os.path.join(base_dir, 'db', 'cumin_database.sqlite')
    if os.path.exists(db_path):
        os.remove(db_path)
        
    print(f"[*] Creating SQLite Database at: {db_path}")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # 1. Genes Table
    print("[*] Creating table: genes")
    cursor.execute('''
        CREATE TABLE genes (
            gene_id TEXT PRIMARY KEY,
            contig TEXT,
            source TEXT,
            feature_type TEXT,
            start INTEGER,
            end INTEGER,
            length INTEGER,
            strand TEXT,
            description TEXT,
            go_terms TEXT,
            go_ids TEXT,
            ec_code TEXT,
            ec_name TEXT,
            interpro_name TEXT
        )
    ''')
    
    genes_json = os.path.join(base_dir, 'db', 'parsed_genes.json')
    if os.path.exists(genes_json):
        with open(genes_json, 'r', encoding='utf-8') as f:
            genes_data = json.load(f)
            gene_rows = []
            for gid, ginfo in genes_data.items():
                gene_rows.append((
                    ginfo.get('gene_id', ''),
                    ginfo.get('contig', ''),
                    ginfo.get('source', ''),
                    ginfo.get('feature_type', ''),
                    ginfo.get('start', 0),
                    ginfo.get('end', 0),
                    ginfo.get('length', 0),
                    ginfo.get('strand', '+'),
                    ginfo.get('description', ''),
                    ", ".join(ginfo.get('go_terms', [])),
                    ", ".join(ginfo.get('go_ids', [])),
                    ginfo.get('ec_code', ''),
                    ginfo.get('ec_name', ''),
                    ginfo.get('interpro_name', '')
                ))
            cursor.executemany('''
                INSERT INTO genes VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', gene_rows)
            print(f"[+] Inserted {len(gene_rows)} genes into database.")

    # 2. SSRs Table
    print("[*] Creating table: ssrs")
    cursor.execute('''
        CREATE TABLE ssrs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ssr_id TEXT,
            gene_id TEXT,
            ssr_type TEXT,
            motif TEXT,
            repeat_count INTEGER,
            start INTEGER,
            end INTEGER,
            length INTEGER,
            primer_forward TEXT,
            primer_reverse TEXT,
            tm_f REAL,
            tm_r REAL,
            product_size INTEGER,
            FOREIGN KEY (gene_id) REFERENCES genes (gene_id)
        )
    ''')
    
    ssrs_json = os.path.join(base_dir, 'db', 'parsed_ssrs.json')
    if os.path.exists(ssrs_json):
        with open(ssrs_json, 'r', encoding='utf-8') as f:
            ssrs_data = json.load(f)
            ssr_rows = []
            for item in ssrs_data:
                ssr_rows.append((
                    item.get('ssr_id', ''),
                    item.get('gene_id', ''),
                    item.get('ssr_type', ''),
                    item.get('motif', ''),
                    item.get('repeat_count', 0),
                    item.get('start', 0),
                    item.get('end', 0),
                    item.get('length', 0),
                    item.get('primer_forward', ''),
                    item.get('primer_reverse', ''),
                    item.get('tm_f', 0.0),
                    item.get('tm_r', 0.0),
                    item.get('product_size', 0)
                ))
            cursor.executemany('''
                INSERT INTO ssrs (ssr_id, gene_id, ssr_type, motif, repeat_count, start, end, length, primer_forward, primer_reverse, tm_f, tm_r, product_size)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', ssr_rows)
            print(f"[+] Inserted {len(ssr_rows)} SSR records into database.")

    # 3. Transcription Factors Table
    print("[*] Creating table: transcription_factors")
    cursor.execute('''
        CREATE TABLE transcription_factors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            gene_id TEXT,
            tf_family TEXT,
            ath_hit TEXT,
            ath_locus TEXT,
            evalue TEXT,
            description TEXT,
            tair_url TEXT,
            FOREIGN KEY (gene_id) REFERENCES genes (gene_id)
        )
    ''')
    
    tfs_json = os.path.join(base_dir, 'db', 'parsed_tfs.json')
    if os.path.exists(tfs_json):
        with open(tfs_json, 'r', encoding='utf-8') as f:
            tfs_data = json.load(f)
            tf_rows = []
            for item in tfs_data:
                tf_rows.append((
                    item.get('gene_id', ''),
                    item.get('tf_family', ''),
                    item.get('ath_hit', ''),
                    item.get('ath_locus', ''),
                    item.get('evalue', ''),
                    item.get('description', ''),
                    item.get('tair_url', '')
                ))
            cursor.executemany('''
                INSERT INTO transcription_factors (gene_id, tf_family, ath_hit, ath_locus, evalue, description, tair_url)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', tf_rows)
            print(f"[+] Inserted {len(tf_rows)} TF records into database.")

    # 4. miRNA Targets Table
    print("[*] Creating table: mirna_targets")
    cursor.execute('''
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
            inhibition TEXT,
            target_desc TEXT,
            mirbase_url TEXT,
            FOREIGN KEY (target_gene) REFERENCES genes (gene_id)
        )
    ''')
    
    mirna_json = os.path.join(base_dir, 'db', 'parsed_mirna_targets.json')
    if os.path.exists(mirna_json):
        with open(mirna_json, 'r', encoding='utf-8') as f:
            mirna_data = json.load(f)
            mirna_rows = []
            for item in mirna_data:
                mirna_rows.append((
                    item.get('mirna_acc', ''),
                    item.get('mirbase_id', ''),
                    item.get('target_gene', ''),
                    item.get('expectation', 0.0),
                    item.get('upe', -1.0),
                    item.get('mirna_start', 0),
                    item.get('mirna_end', 0),
                    item.get('target_start', 0),
                    item.get('target_end', 0),
                    item.get('mirna_aligned', ''),
                    item.get('target_aligned', ''),
                    item.get('inhibition', ''),
                    item.get('target_desc', ''),
                    item.get('mirbase_url', '')
                ))
            cursor.executemany('''
                INSERT INTO mirna_targets (mirna_acc, mirbase_id, target_gene, expectation, upe, mirna_start, mirna_end, target_start, target_end, mirna_aligned, target_aligned, inhibition, target_desc, mirbase_url)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', mirna_rows)
            print(f"[+] Inserted {len(mirna_rows)} miRNA target records into database.")

    # 5. Database Indexes for High-Speed Queries
    print("[*] Creating database indexes...")
    cursor.execute('CREATE INDEX idx_genes_contig ON genes(contig)')
    cursor.execute('CREATE INDEX idx_ssrs_gene_id ON ssrs(gene_id)')
    cursor.execute('CREATE INDEX idx_ssrs_motif ON ssrs(motif)')
    cursor.execute('CREATE INDEX idx_tfs_gene_id ON transcription_factors(gene_id)')
    cursor.execute('CREATE INDEX idx_tfs_family ON transcription_factors(tf_family)')
    cursor.execute('CREATE INDEX idx_mirna_target ON mirna_targets(target_gene)')
    cursor.execute('CREATE INDEX idx_mirna_acc ON mirna_targets(mirna_acc)')
    
    conn.commit()
    conn.close()
    print(f"[✓] Database building and indexing complete: {db_path}")

if __name__ == '__main__':
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    build_database(base_dir)

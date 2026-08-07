#!/usr/bin/env python3
"""
03_process_tfs.py
Processes Transcription Factor (TF) annotations for Cuminum cyminum vs Arabidopsis thaliana.
Generates TF family summary counts and hyperlinked ortholog lists.
"""

import os
import sys
import json
from collections import Counter

def parse_tf_list(tf_path):
    print(f"[*] Parsing TF list file: {tf_path}")
    VALID_PLANTTFDB_FAMILIES = {
        'AP2', 'ARF', 'ARR-B', 'B3', 'BBR-BPC', 'BES1', 'C2H2', 'C3H', 'CAMTA', 'CO-like', 
        'CPP', 'DBB', 'Dof', 'E2F/DP', 'EIL', 'ERF', 'FAR1', 'G2-like', 'GATA', 'GRAS', 
        'GRF', 'GeBP', 'HB-PHD', 'HB-other', 'HD-ZIP', 'HRT-like', 'HSF', 'LBD', 'LFY', 
        'LSD', 'M-type_MADS', 'MIKC_MADS', 'MYB', 'MYB_related', 'NAC', 'NF-X1', 'NF-YA', 
        'NF-YB', 'NF-YC', 'NZZ/SPL', 'Nin-like', 'RAV', 'S1Fa-like', 'SAP', 'SBP', 
        'SRS', 'STAT', 'TALE', 'TCP', 'Trihelix', 'VOZ', 'WOX', 'WRKY', 'Whirly', 
        'YABBY', 'ZF-HD', 'bHLH', 'bZIP'
    }

    tfs = []
    family_counts = Counter()
    
    with open(tf_path, 'r', encoding='utf-8', errors='ignore') as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            parts = line.split('\t')
            if len(parts) >= 5:
                gene_id = parts[0].strip()
                tf_family = parts[1].strip()
                ath_hit = parts[2].strip()
                evalue = parts[3].strip()
                description = parts[4].strip()
                
                # Enforce PlantTFDB official TF family validation
                if tf_family not in VALID_PLANTTFDB_FAMILIES or tf_family.startswith('CcGene'):
                    continue

                locus = ath_hit.split('.')[0] if '.' in ath_hit else ath_hit
                tair_url = f"https://www.arabidopsis.org/servlets/Search?type=general&search_action=detail&method=1&sub_type=gene&name={locus}"
                
                tf_entry = {
                    'gene_id': gene_id,
                    'tf_family': tf_family,
                    'ath_hit': ath_hit,
                    'ath_locus': locus,
                    'evalue': evalue,
                    'description': description,
                    'tair_url': tair_url
                }
                tfs.append(tf_entry)
                family_counts[tf_family] += 1
                
    print(f"[+] Total TFs parsed: {len(tfs)}")
    print(f"[+] Total PlantTFDB TF families identified: {len(family_counts)}")
    return tfs, dict(family_counts)

if __name__ == '__main__':
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    tf_file = os.path.join(base_dir, 'TF_and_best1_in_Ath.list.txt')
    
    tfs, family_counts = parse_tf_list(tf_file)
    
    output_json = os.path.join(base_dir, 'db', 'parsed_tfs.json')
    summary_json = os.path.join(base_dir, 'db', 'tf_family_summary.json')
    
    os.makedirs(os.path.dirname(output_json), exist_ok=True)
    with open(output_json, 'w', encoding='utf-8') as f:
        json.dump(tfs, f, indent=2)
        
    with open(summary_json, 'w', encoding='utf-8') as f:
        json.dump(family_counts, f, indent=2)
        
    print(f"[✓] Saved parsed TFs to: {output_json}")
    print(f"[✓] Saved TF family summary counts to: {summary_json}")

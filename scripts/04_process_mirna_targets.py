#!/usr/bin/env python3
"""
04_process_mirna_targets.py
Parses psRNATarget job outputs and intersects miRNA accessions with miRBase IDs and hyperlinks.
"""

import os
import sys
import json

def parse_mirna_targets(mirna_path):
    print(f"[*] Parsing psRNATarget file: {mirna_path}")
    targets = []
    
    with open(mirna_path, 'r', encoding='utf-8', errors='ignore') as f:
        header = None
        for line in f:
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            parts = line.split('\t')
            if len(parts) >= 11 and parts[0] != 'miRNA_Acc.':
                mirna_acc = parts[0].strip()
                target_acc = parts[1].strip()
                expectation = parts[2].strip()
                upe = parts[3].strip()
                mirna_start = parts[4].strip()
                mirna_end = parts[5].strip()
                target_start = parts[6].strip()
                target_end = parts[7].strip()
                mirna_align = parts[8].strip()
                target_align = parts[9].strip()
                inhibition = parts[10].strip()
                target_desc = parts[11].strip() if len(parts) > 11 else ""
                
                # Derive miRBase ID & Hyperlink
                # e.g., ath-miR156a-5p -> miRBase search term: ath-miR156a
                mirbase_query = mirna_acc.split('-5p')[0].split('-3p')[0]
                mirbase_url = f"https://www.mirbase.org/textsearch.shtml?q={mirbase_query}"
                
                entry = {
                    'mirna_acc': mirna_acc,
                    'mirbase_id': mirbase_query,
                    'target_gene': target_acc,
                    'expectation': float(expectation) if expectation else 0.0,
                    'upe': float(upe) if upe else -1.0,
                    'mirna_start': mirna_start,
                    'mirna_end': mirna_end,
                    'target_start': target_start,
                    'target_end': target_end,
                    'mirna_aligned': mirna_align,
                    'target_aligned': target_align,
                    'inhibition': inhibition,
                    'target_desc': target_desc,
                    'mirbase_url': mirbase_url
                }
                targets.append(entry)
                
    print(f"[+] Total miRNA target interactions parsed: {len(targets)}")
    return targets

if __name__ == '__main__':
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    mirna_file = os.path.join(base_dir, 'psRNATargetJob-1785848631371569.txt')
    
    mirna_data = parse_mirna_targets(mirna_file)
    
    output_json = os.path.join(base_dir, 'db', 'parsed_mirna_targets.json')
    os.makedirs(os.path.dirname(output_json), exist_ok=True)
    with open(output_json, 'w', encoding='utf-8') as f:
        json.dump(mirna_data, f, indent=2)
    print(f"[✓] Saved parsed miRNA targets to: {output_json}")

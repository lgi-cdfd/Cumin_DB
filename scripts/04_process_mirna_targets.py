#!/usr/bin/env python3
"""
04_process_mirna_targets.py
Parses psRNATarget job outputs, maps miRNA sequence IDs to official miRBase MIMAT/MI Accessions
using mature.fa and hairpin.fa, and generates production hyperlinks.
"""

import os
import sys
import re
import json

def load_mirbase_accession_maps(base_dir):
    mature_map = {}
    hairpin_map = {}

    mature_fa = os.path.join(base_dir, 'mature.fa')
    if os.path.exists(mature_fa):
        with open(mature_fa, 'r', encoding='utf-8', errors='ignore') as f:
            for line in f:
                if line.startswith('>'):
                    parts = line[1:].strip().split()
                    if len(parts) >= 2:
                        seq_id = parts[0]
                        acc = parts[1]
                        mature_map[seq_id.lower()] = acc
                        base_id = re.sub(r'-[35]p$', '', seq_id, flags=re.IGNORECASE)
                        if base_id.lower() not in mature_map:
                            mature_map[base_id.lower()] = acc

    hairpin_fa = os.path.join(base_dir, 'hairpin.fa')
    if os.path.exists(hairpin_fa):
        with open(hairpin_fa, 'r', encoding='utf-8', errors='ignore') as f:
            for line in f:
                if line.startswith('>'):
                    parts = line[1:].strip().split()
                    if len(parts) >= 2:
                        seq_id = parts[0]
                        acc = parts[1]
                        hairpin_map[seq_id.lower()] = acc

    print(f"[+] Loaded {len(mature_map):,} mature miRBase accessions and {len(hairpin_map):,} hairpin accessions.")
    return mature_map, hairpin_map

def get_mirbase_accession(acc, mature_map, hairpin_map):
    clean = acc.strip()
    candidates = [
        clean,
        re.sub(r'\.\d+$', '', clean),
        re.sub(r'-[35]p$', '', clean, flags=re.IGNORECASE),
        re.sub(r'-[35]p$', '', re.sub(r'\.\d+$', '', clean), flags=re.IGNORECASE),
        re.sub(r'miR', 'MIR', clean, flags=re.IGNORECASE),
        re.sub(r'MIR', 'miR', clean, flags=re.IGNORECASE),
        re.sub(r'-[35]p$', '', re.sub(r'miR', 'MIR', clean, flags=re.IGNORECASE), flags=re.IGNORECASE),
        re.sub(r'-[35]p$', '', re.sub(r'MIR', 'miR', clean, flags=re.IGNORECASE), flags=re.IGNORECASE)
    ]
    for cand in candidates:
        low = cand.lower()
        if low in mature_map:
            return mature_map[low]
        if low in hairpin_map:
            return hairpin_map[low]
    return None

def parse_mirna_targets(mirna_path, base_dir):
    print(f"[*] Parsing psRNATarget file: {mirna_path}")
    mature_map, hairpin_map = load_mirbase_accession_maps(base_dir)
    targets = []
    
    with open(mirna_path, 'r', encoding='utf-8', errors='ignore') as f:
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
                
                # Lookup official miRBase MIMAT / MI accession number
                maccession = get_mirbase_accession(mirna_acc, mature_map, hairpin_map)
                
                if maccession:
                    mirbase_id = maccession
                    mirbase_url = f"https://www.mirbase.org/hairpin/{maccession}"
                else:
                    mirbase_id = mirna_acc
                    mirbase_url = f"https://www.mirbase.org/textsearch.shtml?q={mirna_acc}"
                
                entry = {
                    'mirna_acc': mirna_acc,
                    'mirbase_id': mirbase_id,
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
                
    print(f"[+] Total miRNA target interactions parsed: {len(targets):,}")
    return targets

if __name__ == '__main__':
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    mirna_file = os.path.join(base_dir, 'psRNATargetJob-1785848631371569.txt')
    
    mirna_data = parse_mirna_targets(mirna_file, base_dir)
    
    output_json = os.path.join(base_dir, 'db', 'parsed_mirna_targets.json')
    os.makedirs(os.path.dirname(output_json), exist_ok=True)
    with open(output_json, 'w', encoding='utf-8') as f:
        json.dump(mirna_data, f, indent=2)
    print(f"[✓] Saved parsed miRNA targets to: {output_json}")

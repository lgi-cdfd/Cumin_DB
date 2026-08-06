#!/usr/bin/env python3
"""
02_mine_ssrs_and_primers.py
Parses Krait SSR mining output (krait-ssr) and designed primer pairs (krait-ssr-primers).
Converts numeric motif types (1..6) to standard names (Mononucleotide..Hexanucleotide)
and links top candidate PCR primer pairs (entry=1).
"""

import os
import sys
import json

def process_krait_ssrs_and_primers(base_dir):
    krait_ssr_path = os.path.join(base_dir, 'krait-ssr')
    krait_primers_path = os.path.join(base_dir, 'krait-ssr-primers')

    if not os.path.exists(krait_ssr_path):
        print(f"[-] File not found: {krait_ssr_path}")
        return []

    # 1. Parse top primer pairs (entry = 1) from krait-ssr-primers
    primer_info = {}
    if os.path.exists(krait_primers_path):
        print(f"[*] Parsing Krait primer pairs file: {krait_primers_path}")
        with open(krait_primers_path, 'r', encoding='utf-8', errors='ignore') as f:
            for line in f:
                parts = line.strip().split('\t')
                if len(parts) >= 12:
                    target = parts[1] # e.g. ssr-1-1
                    entry = parts[2]
                    if entry == '1': # Top candidate pair
                        row_id = target.split('-')[-1]
                        primer_info[row_id] = {
                            'product_size': int(parts[3]) if parts[3].isdigit() else 0,
                            'tm_f': float(parts[4]) if parts[4].replace('.','',1).isdigit() else 60.0,
                            'gc1': float(parts[5]) if parts[5].replace('.','',1).isdigit() else 50.0,
                            'primer_forward': parts[7],
                            'tm_r': float(parts[8]) if parts[8].replace('.','',1).isdigit() else 60.0,
                            'gc2': float(parts[9]) if parts[9].replace('.','',1).isdigit() else 50.0,
                            'primer_reverse': parts[11]
                        }
        print(f"[+] Loaded {len(primer_info):,} top Krait primer pairs (entry=1).")

    # 2. Motif type mapping (1..6 -> Mononucleotide..Hexanucleotide)
    type_map = {
        '1': 'Mononucleotide',
        '2': 'Dinucleotide',
        '3': 'Trinucleotide',
        '4': 'Tetranucleotide',
        '5': 'Pentanucleotide',
        '6': 'Hexanucleotide'
    }

    print(f"[*] Parsing Krait SSR loci file: {krait_ssr_path}")
    ssrs = []
    with open(krait_ssr_path, 'r', encoding='utf-8', errors='ignore') as f:
        for line in f:
            parts = line.strip().split('\t')
            if len(parts) >= 9:
                row_id = parts[0]
                scaf = parts[1].strip()
                start = int(parts[2])
                end = int(parts[3])
                motif = parts[4].strip()
                comp = parts[5].strip()
                raw_type = parts[6].strip()
                stype = type_map.get(raw_type, f"Type_{raw_type}")
                repeat_cnt = int(parts[7])
                length = int(parts[8])

                p = primer_info.get(row_id, {
                    'primer_forward': 'N/A',
                    'primer_reverse': 'N/A',
                    'tm_f': 0.0,
                    'tm_r': 0.0,
                    'product_size': 0
                })

                ssr_record = {
                    'ssr_id': f"CcSSR_{int(row_id):06d}",
                    'original_id': row_id,
                    'contig': scaf,
                    'start': start,
                    'end': end,
                    'motif': motif,
                    'ssr_type': stype,
                    'repeat_count': repeat_cnt,
                    'length': length,
                    'primer_forward': p['primer_forward'],
                    'primer_reverse': p['primer_reverse'],
                    'tm_f': p['tm_f'],
                    'tm_r': p['tm_r'],
                    'product_size': p['product_size']
                }
                ssrs.append(ssr_record)

    print(f"[+] Total Krait SSRs processed: {len(ssrs):,}")
    return ssrs

if __name__ == '__main__':
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    ssr_data = process_krait_ssrs_and_primers(base_dir)
    
    output_json = os.path.join(base_dir, 'db', 'parsed_ssrs.json')
    os.makedirs(os.path.dirname(output_json), exist_ok=True)
    with open(output_json, 'w', encoding='utf-8') as f:
        json.dump(ssr_data, f, indent=2)
    print(f"[✓] Saved parsed Krait SSRs and primers to: {output_json}")

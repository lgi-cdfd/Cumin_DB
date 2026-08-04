#!/usr/bin/env python3
"""
generate_ssr_gff.py
Generates a sorted, compressed, and indexed GFF3 file for the mined SSR markers
to be integrated as a track in JBrowse 2.
"""

import os
import json
import subprocess

def build_ssr_gff(base_dir):
    json_path = os.path.join(base_dir, 'db', 'parsed_ssrs.json')
    gff_path = os.path.join(base_dir, 'db', 'cumin_ssrs.gff')
    gff_gz_path = os.path.join(base_dir, 'db', 'cumin_ssrs.gff.gz')
    
    if not os.path.exists(json_path):
        print(f"[-] parsed_ssrs.json not found at {json_path}")
        return

    print("[*] Generating GFF3 file for SSR markers...")
    
    with open(json_path, 'r', encoding='utf-8') as f:
        ssrs = json.load(f)

    # Write GFF3 lines
    gff_lines = ["##gff-version 3\n"]
    
    for s in ssrs:
        seqid = s['gene_id']
        source = 'CuminDB_SSR'
        feature_type = 'repeat_region'
        start = s['start']
        end = s['end']
        score = '.'
        strand = '+'
        phase = '.'
        attributes = (
            f"ID={s['ssr_id']};"
            f"Name={s['ssr_id']};"
            f"Note=SSR_{s['ssr_type']}_Motif_{s['motif']}_Repeats_{s['repeat_count']};"
            f"motif={s['motif']};"
            f"repeats={s['repeat_count']};"
            f"primer_forward={s['primer_forward']};"
            f"primer_reverse={s['primer_reverse']}"
        )
        
        line = f"{seqid}\t{source}\t{feature_type}\t{start}\t{end}\t{score}\t{strand}\t{phase}\t{attributes}\n"
        gff_lines.append(line)

    # Sort GFF3 lines by SeqID and Start position
    header = gff_lines[0]
    data_lines = gff_lines[1:]
    
    # Sort helper key function
    def get_sort_key(line_str):
        parts = line_str.strip().split('\t')
        if len(parts) >= 4:
            try:
                return (parts[0], int(parts[3]))
            except ValueError:
                return (parts[0], 0)
        return ("", 0)

    data_lines.sort(key=get_sort_key)
    
    with open(gff_path, 'w', encoding='utf-8') as f:
        f.write(header)
        f.writelines(data_lines)
        
    print(f"[+] Saved sorted SSR GFF3 to: {gff_path}")

    # Compress with bgzip
    print("[*] Compressing SSR GFF3 with bgzip...")
    if os.path.exists(gff_gz_path):
        os.remove(gff_gz_path)
        
    subprocess.run(['bgzip', gff_path])
    
    # Index with tabix
    print("[*] Indexing SSR GFF3 with tabix...")
    subprocess.run(['tabix', '-p', 'gff', gff_gz_path])
    
    print("[✓] SSR JBrowse 2 track prepared successfully!")

if __name__ == '__main__':
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    build_ssr_gff(base_dir)

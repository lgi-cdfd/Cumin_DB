#!/usr/bin/env python3
"""
02_mine_ssrs_and_primers.py
Mines Simple Sequence Repeats (SSRs / Microsatellites) from Cuminum cyminum gene sequences
and designs PCR primer pairs (Forward, Reverse, Tm, Product Size).
"""

import os
import sys
import re
import json

def parse_fasta(fasta_path):
    sequences = {}
    current_id = None
    current_seq = []
    
    print(f"[*] Reading FASTA file: {fasta_path}")
    with open(fasta_path, 'r', encoding='utf-8', errors='ignore') as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            if line.startswith('>'):
                if current_id:
                    sequences[current_id] = "".join(current_seq)
                current_id = line[1:].split()[0]
                current_seq = []
            else:
                current_seq.append(line.upper())
        if current_id:
            sequences[current_id] = "".join(current_seq)
            
    print(f"[+] Total FASTA sequences loaded: {len(sequences)}")
    return sequences

def calculate_tm(primer_seq):
    """Calculates approximate melting temperature (Tm) using Wallace rule / standard GC formula."""
    a = primer_seq.count('A')
    t = primer_seq.count('T')
    g = primer_seq.count('G')
    c = primer_seq.count('C')
    if len(primer_seq) <= 14:
        return (a + t) * 2 + (g + c) * 4
    return round(64.9 + 41 * (g + c - 16.4) / len(primer_seq), 1)

def design_primer_pair(sequence, ssr_start, ssr_end):
    """
    Designs PCR forward and reverse primer pairs around the SSR region.
    Returns (forward_primer, reverse_primer, tm_f, tm_r, product_size)
    """
    seq_len = len(sequence)
    # Upstream 5' region for Forward Primer
    flank_left_start = max(0, ssr_start - 120)
    flank_left_end = max(0, ssr_start - 20)
    
    # Downstream 3' region for Reverse Primer
    flank_right_start = min(seq_len, ssr_end + 20)
    flank_right_end = min(seq_len, ssr_end + 120)
    
    left_sub = sequence[flank_left_start:flank_left_end]
    right_sub = sequence[flank_right_start:flank_right_end]
    
    # Find candidate Forward Primer (20 bp)
    f_primer = ""
    f_pos = 0
    for i in range(len(left_sub) - 20, -1, -1):
        cand = left_sub[i:i+20]
        gc = (cand.count('G') + cand.count('C')) / 20.0
        if 0.4 <= gc <= 0.65:
            f_primer = cand
            f_pos = flank_left_start + i
            break
    if not f_primer and len(left_sub) >= 20:
        f_primer = left_sub[-20:]
        f_pos = flank_left_end - 20

    # Find candidate Reverse Primer (20 bp reverse complement)
    r_primer = ""
    r_pos = 0
    comp = {'A': 'T', 'T': 'A', 'G': 'C', 'C': 'G', 'N': 'N'}
    for i in range(0, len(right_sub) - 20):
        cand_fw = right_sub[i:i+20]
        gc = (cand_fw.count('G') + cand_fw.count('C')) / 20.0
        if 0.4 <= gc <= 0.65:
            r_primer = "".join([comp.get(b, 'N') for b in reversed(cand_fw)])
            r_pos = flank_right_start + i + 20
            break
    if not r_primer and len(right_sub) >= 20:
        cand_fw = right_sub[:20]
        r_primer = "".join([comp.get(b, 'N') for b in reversed(cand_fw)])
        r_pos = flank_right_start + 20

    if f_primer and r_primer:
        tm_f = calculate_tm(f_primer)
        tm_r = calculate_tm(r_primer)
        product_size = max(0, r_pos - f_pos)
        return f_primer, r_primer, tm_f, tm_r, product_size
    else:
        return "N/A", "N/A", 0.0, 0.0, 0

def mine_ssrs(sequences):
    print("[*] Mining SSRs and designing PCR primers...")
    ssrs = []
    
    # SSR motif patterns and minimum repeat thresholds
    ssr_rules = [
        ('Dinucleotide', r'([ATGC]{2})\1{5,}', 6, 2),
        ('Trinucleotide', r'([ATGC]{3})\1{4,}', 5, 3),
        ('Tetranucleotide', r'([ATGC]{4})\1{3,}', 4, 4),
        ('Pentanucleotide', r'([ATGC]{5})\1{2,}', 3, 5),
        ('Hexanucleotide', r'([ATGC]{6})\1{2,}', 3, 6),
    ]
    
    ssr_counter = 1
    for gene_id, seq in sequences.items():
        if len(seq) < 100:
            continue
            
        found_in_gene = set()
        for ssr_type, pattern, min_repeats, motif_len in ssr_rules:
            for match in re.finditer(pattern, seq):
                start = match.start()
                end = match.end()
                matched_seq = match.group(0)
                motif = matched_seq[:motif_len]
                repeat_count = len(matched_seq) // motif_len
                
                # Check for overlap/duplicate
                pos_key = (start, end)
                if pos_key in found_in_gene:
                    continue
                found_in_gene.add(pos_key)
                
                # Design primers
                f_primer, r_primer, tm_f, tm_r, product_size = design_primer_pair(seq, start, end)
                
                ssr_record = {
                    'ssr_id': f"CC_SSR_{ssr_counter:06d}",
                    'gene_id': gene_id,
                    'ssr_type': ssr_type,
                    'motif': motif,
                    'repeat_count': repeat_count,
                    'start': start + 1,
                    'end': end,
                    'length': len(matched_seq),
                    'primer_forward': f_primer,
                    'primer_reverse': r_primer,
                    'tm_f': tm_f,
                    'tm_r': tm_r,
                    'product_size': product_size
                }
                ssrs.append(ssr_record)
                ssr_counter += 1
                
    print(f"[+] Total SSRs mined and primers designed: {len(ssrs)}")
    return ssrs

if __name__ == '__main__':
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    fasta_file = os.path.join(base_dir, 'cumin_predicted_genes.fasta')
    
    sequences = parse_fasta(fasta_file)
    ssr_data = mine_ssrs(sequences)
    
    output_json = os.path.join(base_dir, 'db', 'parsed_ssrs.json')
    os.makedirs(os.path.dirname(output_json), exist_ok=True)
    with open(output_json, 'w', encoding='utf-8') as f:
        json.dump(ssr_data, f, indent=2)
    print(f"[✓] Saved parsed SSRs and primers to: {output_json}")

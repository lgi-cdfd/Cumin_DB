#!/usr/bin/env python3
"""
01_parse_gff_annotations.py
Parses GFF3, Blast2GO annotations, and generic InterPro exports for Cuminum cyminum.
Outputs processed gene annotations to JSON / dict structure.
"""

import sys
import os
import re
import csv
import json

def parse_gff(gff_path):
    print(f"[*] Parsing GFF file: {gff_path}")
    genes = {}
    
    with open(gff_path, 'r', encoding='utf-8', errors='ignore') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            parts = line.split('\t')
            if len(parts) < 9:
                continue
            
            contig = parts[0]
            source = parts[1]
            feature_type = parts[2]
            start = int(parts[3])
            end = int(parts[4])
            score = parts[5]
            strand = parts[6]
            phase = parts[7]
            attr_str = parts[8]
            
            # Parse attributes
            attrs = {}
            for item in attr_str.split(';'):
                if '=' in item:
                    k, v = item.split('=', 1)
                    attrs[k.strip()] = v.strip()
            
            gene_id = attrs.get('ID', '')
            description = attrs.get('Description', '')
            gene_names = attrs.get('Gene', '')
            ontology_terms = attrs.get('Ontology_term', '')
            ontology_ids = attrs.get('Ontology_id', '')
            enzyme_code = attrs.get('Enzyme_code', '')
            enzyme_name = attrs.get('Enzyme_name', '')
            
            if gene_id:
                if gene_id not in genes:
                    genes[gene_id] = {
                        'gene_id': gene_id,
                        'contig': contig,
                        'source': source,
                        'feature_type': feature_type,
                        'start': start,
                        'end': end,
                        'length': abs(end - start) + 1,
                        'strand': strand if strand in ['+', '-'] else '+',
                        'description': description if description != '---NA---' else '',
                        'go_terms': ontology_terms.split(',') if ontology_terms else [],
                        'go_ids': ontology_ids.split(',') if ontology_ids else [],
                        'ec_code': enzyme_code,
                        'ec_name': enzyme_name
                    }
    print(f"[+] Total genes parsed from GFF: {len(genes)}")
    return genes

def enrich_annotations(genes, annot_path, generic_export_path):
    print(f"[*] Enriching annotations from {annot_path} and {generic_export_path}...")
    
    # Process cumin.annot
    if os.path.exists(annot_path):
        with open(annot_path, 'r', encoding='utf-8', errors='ignore') as f:
            for line in f:
                parts = line.strip().split('\t')
                if len(parts) >= 2:
                    gene_id = parts[0]
                    go_or_ec = parts[1]
                    desc = parts[2] if len(parts) >= 3 else ''
                    
                    if gene_id in genes:
                        if desc and not genes[gene_id]['description']:
                            genes[gene_id]['description'] = desc
                        if go_or_ec.startswith('GO:'):
                            if go_or_ec not in genes[gene_id]['go_ids']:
                                genes[gene_id]['go_ids'].append(go_or_ec)
                        elif go_or_ec.startswith('EC:'):
                            if not genes[gene_id]['ec_code']:
                                genes[gene_id]['ec_code'] = go_or_ec
    
    # Process generic_export.txt
    if os.path.exists(generic_export_path):
        with open(generic_export_path, 'r', encoding='utf-8', errors='ignore') as f:
            reader = csv.reader(f)
            header = next(reader, None)
            for row in reader:
                if len(row) >= 2:
                    gene_id = row[0]
                    seq_desc = row[1] if len(row) > 1 else ''
                    interpro_name = row[11] if len(row) > 11 else ''
                    
                    if gene_id in genes:
                        if seq_desc and seq_desc != '---NA---' and not genes[gene_id]['description']:
                            genes[gene_id]['description'] = seq_desc
                        if interpro_name and 'interpro' not in genes[gene_id]:
                            genes[gene_id]['interpro_name'] = interpro_name

    print(f"[+] Annotation enrichment complete for {len(genes)} genes.")
    return genes

if __name__ == '__main__':
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    gff_file = os.path.join(base_dir, 'cumin_gff_export.gff')
    annot_file = os.path.join(base_dir, 'cumin.annot')
    generic_file = os.path.join(base_dir, 'generic_export.txt')
    
    genes_data = parse_gff(gff_file)
    genes_data = enrich_annotations(genes_data, annot_file, generic_file)
    
    output_json = os.path.join(base_dir, 'db', 'parsed_genes.json')
    os.makedirs(os.path.dirname(output_json), exist_ok=True)
    with open(output_json, 'w', encoding='utf-8') as f:
        json.dump(genes_data, f, indent=2)
    print(f"[✓] Saved parsed gene annotations to: {output_json}")

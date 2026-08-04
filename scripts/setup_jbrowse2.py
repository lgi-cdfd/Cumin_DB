#!/usr/bin/env python3
"""
setup_jbrowse2.py
Prepares GFF3 and FASTA index files, sorts/bgzips/tabix-indexes GFF3 models,
and generates a production-ready JBrowse 2 config.json.
"""

import os
import json
import subprocess

def prepare_gff_tracks(base_dir):
    gff_in = os.path.join(base_dir, 'cumin_gff_export.gff')
    gff_sorted = os.path.join(base_dir, 'db', 'cumin_sorted.gff')
    gff_gz = os.path.join(base_dir, 'db', 'cumin_sorted.gff.gz')
    
    if not os.path.exists(gff_in):
        print(f"[-] Reference GFF3 not found at: {gff_in}")
        return

    print("[*] Sorting GFF3 gene models...")
    with open(gff_in, 'r', encoding='utf-8', errors='ignore') as infile:
        lines = infile.readlines()

    headers = [l for l in lines if l.startswith('#')]
    features = [l for l in lines if not l.startswith('#')]

    def get_feat_sort_key(line_str):
        parts = line_str.strip().split('\t')
        if len(parts) >= 4:
            try:
                return (parts[0], int(parts[3]))
            except ValueError:
                return (parts[0], 0)
        return ("", 0)

    features.sort(key=get_feat_sort_key)

    os.makedirs(os.path.dirname(gff_sorted), exist_ok=True)
    with open(gff_sorted, 'w', encoding='utf-8') as outfile:
        outfile.writelines(headers)
        outfile.writelines(features)
        
    print(f"[+] Saved sorted GFF3 to: {gff_sorted}")

    # Compress with bgzip
    print("[*] Compressing GFF3 with bgzip...")
    if os.path.exists(gff_gz):
        os.remove(gff_gz)
    subprocess.run(['bgzip', gff_sorted])

    # Index with tabix
    print("[*] Indexing GFF3 with tabix...")
    subprocess.run(['tabix', '-p', 'gff', gff_gz])
    print("[✓] GFF3 track prepared successfully!")

def generate_jbrowse_config(base_dir):
    config = {
        "assembly": {
            "name": "Cuminum_cyminum",
            "sequence": {
                "type": "ReferenceSequenceTrack",
                "trackId": "Cuminum_cyminum_sequence",
                "adapter": {
                    "type": "IndexedFastaAdapter",
                    "fastaLocation": {
                        "uri": "/cumin_predicted_genes.fasta"
                    },
                    "faiLocation": {
                        "uri": "/cumin_predicted_genes.fasta.fai"
                    }
                }
            }
        },
        "tracks": [
            {
                "type": "FeatureTrack",
                "trackId": "cumin_gene_models",
                "name": "Gene Models (GFF3)",
                "assemblyNames": ["Cuminum_cyminum"],
                "adapter": {
                    "type": "Gff3TabixAdapter",
                    "gffGzLocation": {
                        "uri": "/db/cumin_sorted.gff.gz"
                    },
                    "index": {
                        "location": {
                            "uri": "/db/cumin_sorted.gff.gz.tbi"
                        }
                    }
                }
            },
            {
                "type": "FeatureTrack",
                "trackId": "cumin_ssrs",
                "name": "SSR Markers (GFF3)",
                "assemblyNames": ["Cuminum_cyminum"],
                "adapter": {
                    "type": "Gff3TabixAdapter",
                    "gffGzLocation": {
                        "uri": "/db/cumin_ssrs.gff.gz"
                    },
                    "index": {
                        "location": {
                            "uri": "/db/cumin_ssrs.gff.gz.tbi"
                        }
                    }
                }
            }
        ],
        "defaultSession": {
            "name": "CuminDB Default Session",
            "views": [
                {
                    "id": "linear_genome_view",
                    "type": "LinearGenomeView",
                    "tracks": [
                        {
                            "id": "cumin_gene_models",
                            "type": "FeatureTrack",
                            "displays": [
                                {
                                    "id": "cumin_gene_models-LinearBasicDisplay",
                                    "type": "LinearBasicDisplay"
                                }
                            ]
                        },
                        {
                            "id": "cumin_ssrs",
                            "type": "FeatureTrack",
                            "displays": [
                                {
                                    "id": "cumin_ssrs-LinearBasicDisplay",
                                    "type": "LinearBasicDisplay"
                                }
                            ]
                        }
                    ]
                }
            ]
        }
    }
    
    jbrowse_dir = os.path.join(base_dir, 'jbrowse2')
    os.makedirs(jbrowse_dir, exist_ok=True)
    config_path = os.path.join(jbrowse_dir, 'config.json')
    
    with open(config_path, 'w', encoding='utf-8') as f:
        json.dump(config, f, indent=2)
        
    print(f"[✓] JBrowse 2 config.json generated successfully at: {config_path}")

if __name__ == '__main__':
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    prepare_gff_tracks(base_dir)
    generate_jbrowse_config(base_dir)

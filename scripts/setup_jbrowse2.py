#!/usr/bin/env python3
"""
setup_jbrowse2.py
Prepares GFF3 and FASTA index files and generates a production-ready JBrowse 2 config.json.
"""

import os
import json

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
    generate_jbrowse_config(base_dir)

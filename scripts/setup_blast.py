#!/usr/bin/env python3
"""
setup_blast.py
Indexes the Cuminum cyminum FASTA files for BLAST using makeblastdb
and creates commands for starting SequenceServer.
"""

import os
import subprocess

def setup_blast_databases(base_dir):
    print("[*] Formatting BLAST Databases...")
    
    # 1. Format Predicted CDS
    cds_fasta = os.path.join(base_dir, 'cumin_predicted_cds.fasta')
    if os.path.exists(cds_fasta):
        cmd1 = [
            'makeblastdb',
            '-in', cds_fasta,
            '-dbtype', 'nucl',
            '-title', 'Cuminum cyminum Predicted CDS',
            '-out', os.path.join(base_dir, 'db', 'cumin_cds')
        ]
        subprocess.run(cmd1)
        print("[+] CDS database indexed successfully.")

    # 2. Format Predicted Proteins
    protein_fasta = os.path.join(base_dir, 'cumin_predicted_protein.fasta')
    if os.path.exists(protein_fasta):
        cmd2 = [
            'makeblastdb',
            '-in', protein_fasta,
            '-dbtype', 'prot',
            '-title', 'Cuminum cyminum Predicted Proteins',
            '-out', os.path.join(base_dir, 'db', 'cumin_proteins')
        ]
        subprocess.run(cmd2)
        print("[+] Protein database indexed successfully.")

    print("\n[✓] BLAST databases formatted in 'db/' folder.")
    print("To launch SequenceServer, run the following command:")
    print(f"sequenceserver -d {os.path.join(base_dir, 'db')}\n")

if __name__ == '__main__':
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    setup_blast_databases(base_dir)

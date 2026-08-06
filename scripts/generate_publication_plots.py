#!/usr/bin/env python3
"""
generate_publication_plots.py
Generates 600 DPI ultra high-resolution publication-quality PNG figures
for CuminDB multi-omic distributions using Matplotlib and SQLite data.
Eliminates all text label overlapping on Donut and Pie charts via clean side-legends.
"""

import os
import sqlite3
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np

def generate_plots(base_dir):
    db_path = os.path.join(base_dir, 'db', 'cumin_database.sqlite')
    output_dir = os.path.join(base_dir, 'public', 'plots')
    os.makedirs(output_dir, exist_ok=True)

    if not os.path.exists(db_path):
        print(f"[-] SQLite database not found at {db_path}")
        return

    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    # Styling defaults for high-resolution publication plots
    plt.rcParams['font.sans-serif'] = 'DejaVu Sans'
    plt.rcParams['axes.edgecolor'] = '#cbd5e1'
    plt.rcParams['axes.linewidth'] = 1.2

    print("[*] Generating 600 DPI publication plots...")

    # ----------------------------------------------------
    # 1. TOP 10 TRANSCRIPTION FACTOR FAMILIES (600 DPI)
    # ----------------------------------------------------
    tf_rows = cur.execute('SELECT tf_family, COUNT(*) as count FROM transcription_factors GROUP BY tf_family ORDER BY count DESC LIMIT 10').fetchall()
    if tf_rows:
        families = [r[0] for r in tf_rows]
        counts = [r[1] for r in tf_rows]

        fig, ax = plt.subplots(figsize=(8.5, 5), dpi=600)
        bars = ax.bar(families, counts, color='#0284c7', edgecolor='#0369a1', linewidth=1.2, width=0.6, zorder=3)
        
        ax.set_title('Top 10 Transcription Factor Families in Cuminum cyminum', fontsize=12, fontweight='bold', pad=15, color='#0f172a')
        ax.set_xlabel('Transcription Factor Family', fontsize=10, fontweight='bold', color='#334155', labelpad=8)
        ax.set_ylabel('Number of Identified TFs', fontsize=10, fontweight='bold', color='#334155', labelpad=8)
        ax.grid(axis='y', linestyle='--', alpha=0.5, zorder=0)
        ax.set_axisbelow(True)
        ax.tick_params(colors='#475569', labelsize=9)

        # Value labels on top of bars
        for bar in bars:
            height = bar.get_height()
            ax.annotate(f'{height:,}',
                        xy=(bar.get_x() + bar.get_width() / 2, height),
                        xytext=(0, 4),
                        textcoords="offset points",
                        ha='center', va='bottom', fontsize=8.5, fontweight='bold', color='#0f172a')

        plt.tight_layout()
        tf_out = os.path.join(output_dir, 'cumin_tf_distribution.png')
        plt.savefig(tf_out, dpi=600, bbox_inches='tight', facecolor='white')
        plt.close()
        print(f"[✓] Saved 600 DPI plot: {tf_out}")

    # ----------------------------------------------------
    # 2. SSR MOTIF PROPORTIONS (600 DPI DONUT - ZERO OVERLAP)
    # ----------------------------------------------------
    ssr_rows = cur.execute('SELECT ssr_type, COUNT(*) as count FROM ssrs GROUP BY ssr_type ORDER BY count DESC').fetchall()
    if ssr_rows:
        types = [r[0] for r in ssr_rows]
        counts = [r[1] for r in ssr_rows]
        total_ssrs = sum(counts)
        colors = ['#4F46E5', '#10B981', '#F59E0B', '#EC4899', '#06B6D4', '#8B5CF6']

        fig, ax = plt.subplots(figsize=(8.5, 5.5), dpi=600)
        
        # Donut slices without radial text labels (prevents text overlap)
        wedges, texts, autotexts = ax.pie(
            counts, labels=None, colors=colors[:len(types)],
            autopct=lambda pct: f'{pct:.1f}%' if pct > 3.5 else '',
            pctdistance=0.75, startangle=140,
            wedgeprops=dict(width=0.4, edgecolor='white', linewidth=2)
        )

        for autotext in autotexts:
            autotext.set_color('white')
            autotext.set_fontsize(9)
            autotext.set_fontweight('bold')

        ax.set_title('SSR Microsatellite Repeat Motif Distribution', fontsize=12, fontweight='bold', pad=15, color='#0f172a')
        
        # Center Circle Text
        centre_circle = plt.Circle((0,0), 0.55, fc='white')
        fig.gca().add_artist(centre_circle)
        ax.text(0, 0, f'Total SSRs\n{total_ssrs:,}', ha='center', va='center', fontsize=10, fontweight='bold', color='#0f172a')

        # Clean non-overlapping legend box on right
        legend_labels = [f'{t}: {c:,} ({(c/total_ssrs)*100:.1f}%)' for t, c in zip(types, counts)]
        ax.legend(wedges, legend_labels, title="Motif Class", loc="center left", bbox_to_anchor=(0.95, 0.5),
                  fontsize=9, title_fontsize=9.5, frameon=True, facecolor='#ffffff', edgecolor='#cbd5e1')

        plt.tight_layout()
        ssr_out = os.path.join(output_dir, 'cumin_ssr_distribution.png')
        plt.savefig(ssr_out, dpi=600, bbox_inches='tight', facecolor='white')
        plt.close()
        print(f"[✓] Saved 600 DPI plot (zero-overlap legend): {ssr_out}")

    # ----------------------------------------------------
    # 3. miRNA INHIBITION MECHANISM BREAKDOWN (600 DPI DONUT)
    # ----------------------------------------------------
    mirna_rows = cur.execute('SELECT inhibition, COUNT(*) as count FROM mirna_targets GROUP BY inhibition').fetchall()
    if mirna_rows:
        modes = [r[0] if r[0] else 'Cleavage' for r in mirna_rows]
        counts = [r[1] for r in mirna_rows]
        total_mirna = sum(counts)
        colors = ['#10B981', '#F59E0B', '#3B82F6']

        fig, ax = plt.subplots(figsize=(8.5, 5.5), dpi=600)
        wedges, texts, autotexts = ax.pie(
            counts, labels=None, colors=colors[:len(modes)],
            autopct=lambda pct: f'{pct:.1f}%' if pct > 3 else '',
            pctdistance=0.72, startangle=90,
            wedgeprops=dict(width=0.4, edgecolor='white', linewidth=2)
        )

        for autotext in autotexts:
            autotext.set_color('white')
            autotext.set_fontsize(9.5)
            autotext.set_fontweight('bold')

        ax.set_title('miRNA Target Inhibition Mechanism Breakdown', fontsize=12, fontweight='bold', pad=15, color='#0f172a')
        
        centre_circle = plt.Circle((0,0), 0.55, fc='white')
        fig.gca().add_artist(centre_circle)
        ax.text(0, 0, f'Interactions\n{total_mirna:,}', ha='center', va='center', fontsize=10, fontweight='bold', color='#0f172a')

        legend_labels = [f'{m}: {c:,} ({(c/total_mirna)*100:.1f}%)' for m, c in zip(modes, counts)]
        ax.legend(wedges, legend_labels, title="Inhibition Mode", loc="center left", bbox_to_anchor=(0.95, 0.5),
                  fontsize=9, title_fontsize=9.5, frameon=True, facecolor='#ffffff', edgecolor='#cbd5e1')

        plt.tight_layout()
        mirna_out = os.path.join(output_dir, 'cumin_mirna_inhibition.png')
        plt.savefig(mirna_out, dpi=600, bbox_inches='tight', facecolor='white')
        plt.close()
        print(f"[✓] Saved 600 DPI plot (zero-overlap legend): {mirna_out}")

    # ----------------------------------------------------
    # 4. SECONDARY METABOLITE CATEGORIES (600 DPI)
    # ----------------------------------------------------
    sec_rows = cur.execute('SELECT metabolite_category, COUNT(*) as count FROM secondary_metabolites GROUP BY metabolite_category ORDER BY count DESC').fetchall()
    if sec_rows:
        cats = [r[0] for r in sec_rows]
        counts = [r[1] for r in sec_rows]

        fig, ax = plt.subplots(figsize=(8.5, 5), dpi=600)
        bars = ax.bar(cats, counts, color='#059669', edgecolor='#047857', linewidth=1.2, width=0.55, zorder=3)
        
        ax.set_title('Secondary Metabolite Biosynthetic Categories', fontsize=12, fontweight='bold', pad=15, color='#0f172a')
        ax.set_ylabel('Number of Genes', fontsize=10, fontweight='bold', color='#334155', labelpad=8)
        plt.xticks(rotation=90, ha='right', fontsize=9, color='#475569', fontweight='semibold')
        ax.grid(axis='y', linestyle='--', alpha=0.5, zorder=0)
        ax.set_axisbelow(True)
        ax.tick_params(colors='#475569', labelsize=9)

        for bar in bars:
            height = bar.get_height()
            ax.annotate(f'{height:,}',
                        xy=(bar.get_x() + bar.get_width() / 2, height),
                        xytext=(0, 3),
                        textcoords="offset points",
                        ha='center', va='bottom', fontsize=8.5, fontweight='bold', color='#0f172a')

        plt.tight_layout()
        sec_out = os.path.join(output_dir, 'cumin_secondary_metabolites.png')
        plt.savefig(sec_out, dpi=600, bbox_inches='tight', facecolor='white')
        plt.close()
        print(f"[✓] Saved 600 DPI plot: {sec_out}")

    conn.close()

if __name__ == '__main__':
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    generate_plots(base_dir)

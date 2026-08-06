// CuminDB SequenceServer BLAST Controller (blast.js)

let currentBlastResults = null;

function runBlast() {
    const query = document.getElementById('blast-query-input').value;
    const program = document.getElementById('blast-program').value;
    const database = document.getElementById('blast-database').value;
    const evalue = document.getElementById('blast-evalue').value;
    
    if (!query || query.trim().length < 10) {
        alert('Please enter a valid FASTA sequence (minimum 10 nucleotides/amino acids).');
        return;
    }
    
    const resultsContainer = document.getElementById('blast-results-container');
    const hitsList = document.getElementById('blast-hits-list');
    resultsContainer.style.display = 'block';
    hitsList.innerHTML = '<div style="text-align:center; padding:30px; color:var(--text-secondary);"><i class="fa-solid fa-spinner fa-spin" style="font-size:1.5rem; margin-bottom:10px; display:block;"></i> Running SequenceServer BLAST alignment against CuminDB indexes...</div>';

    fetch('/api/blast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, program, database, max_evalue: evalue })
    })
    .then(res => res.json())
    .then(res => {
        if (res.status === 'success' && res.hits) {
            currentBlastResults = res;
            hitsList.innerHTML = '';
            
            if (res.hits.length === 0) {
                hitsList.innerHTML = '<p style="color:var(--text-secondary); padding:20px; text-align:center; background:#ffffff; border:1px solid var(--border-color); border-radius:var(--radius-lg);">No significant BLAST hits found below E-value threshold.</p>';
                document.getElementById('blast-graphic-container').style.display = 'none';
                document.getElementById('sequence-server-summary-table').style.display = 'none';
                return;
            }
            
            // Show Graphic Overview and Summary Table
            document.getElementById('blast-graphic-container').style.display = 'block';
            document.getElementById('sequence-server-summary-table').style.display = 'block';
            
            // 1. Render SequenceServer Graphical Overview
            drawSequenceServerRibbonPlot(res.query_length || 500, res.hits);

            // 2. Render SequenceServer Tabular Hit Summary
            renderSequenceServerHitTable(res.hits);

            // 3. Render Pairwise Alignment Cards
            res.hits.forEach((hit, i) => {
                const card = document.createElement('div');
                card.id = `hit-card-${i}`;
                card.style.background = '#ffffff';
                card.style.border = '1px solid var(--border-color)';
                card.style.borderRadius = 'var(--radius-lg)';
                card.style.padding = '20px';
                card.style.marginBottom = '20px';
                card.style.boxShadow = 'var(--shadow-card)';
                
                let scoreBadgeBg = '#ef4444'; // Red >= 200
                if (hit.score < 40) scoreBadgeBg = '#374151';
                else if (hit.score < 50) scoreBadgeBg = '#2563eb';
                else if (hit.score < 80) scoreBadgeBg = '#10b981';
                else if (hit.score < 200) scoreBadgeBg = '#ec4899';

                // Extract contig ID for JBrowse navigation
                const contigId = hit.hit_id.split('.')[0];
                const jbrowseLoc = `${contigId}:${hit.subject_start}-${hit.subject_end}`;

                card.innerHTML = `
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; border-bottom: 1px solid var(--border-color); padding-bottom: 10px; flex-wrap:wrap; gap:10px;">
                        <div>
                            <strong class="mono-text" style="font-size:1.05rem; color: var(--text-primary);">Hit #${i+1}: ${hit.hit_id}</strong>
                            <span style="font-size:0.82rem; color:var(--text-secondary); margin-left:10px;">Length: ${hit.alignment.sbjct ? hit.alignment.sbjct.length : 0} bp</span>
                        </div>
                        <div style="display:flex; gap:8px; align-items:center;">
                            <span class="badge" style="background:${scoreBadgeBg}; color:#ffffff; font-weight:700;">Score: ${hit.score}</span>
                            <span class="badge badge-indigo">Identity: ${hit.identity}</span>
                            <span class="badge badge-amber">E-value: ${hit.evalue}</span>
                            <button class="btn btn-sm btn-primary" onclick="navigateToJBrowseHit('${contigId}', ${hit.subject_start}, ${hit.subject_end})" style="padding:4px 10px; font-size:0.78rem;">
                                View in JBrowse 2
                            </button>
                        </div>
                    </div>
                    <p style="font-size:0.88rem; color:var(--text-secondary); margin-bottom:12px; line-height:1.4;">
                        <strong>Description:</strong> ${hit.title || 'Cuminum cyminum genomic sequence'}
                    </p>
                    <div style="font-size:0.82rem; color:var(--text-secondary); margin-bottom:12px; display:flex; gap:18px; flex-wrap:wrap; background:var(--bg-main); padding:8px 12px; border-radius:var(--radius-md);">
                        <span><strong>Query Range:</strong> ${hit.query_start || 1} - ${hit.query_end || (res.query_length || 500)}</span>
                        <span><strong>Subject Range:</strong> ${hit.subject_start} - ${hit.subject_end}</span>
                        <span><strong>Strand:</strong> ${hit.strand === '+' ? 'Plus (+)' : 'Minus (-)'}</span>
                    </div>
                    
                    <!-- SequenceServer Pairwise Visual Alignment Box -->
                    <div style="background:#0f172a; color:#f8fafc; padding:16px; border-radius:var(--radius-md); font-family:'JetBrains Mono', 'Courier New', monospace; font-size:0.82rem; overflow-x: auto; border:1px solid #1e293b; line-height:1.6;">
                        <div style="white-space: pre;"><span style="color:#64748b; display:inline-block; width:65px;">Query</span><span style="color:#38bdf8; display:inline-block; width:55px; text-align:right; margin-right:12px;">${hit.query_start || 1}</span><span style="color:#f8fafc;">${hit.alignment.query}</span><span style="color:#38bdf8; display:inline-block; width:55px; text-align:left; margin-left:12px;">${hit.query_end || (res.query_length || 500)}</span></div>
                        <div style="white-space: pre;"><span style="color:#64748b; display:inline-block; width:65px;"></span><span style="color:#64748b; display:inline-block; width:55px; margin-right:12px;"></span><span style="color:#4ade80;">${hit.alignment.match}</span></div>
                        <div style="white-space: pre;"><span style="color:#64748b; display:inline-block; width:65px;">Sbjct</span><span style="color:#38bdf8; display:inline-block; width:55px; text-align:right; margin-right:12px;">${hit.subject_start}</span><span style="color:#f8fafc;">${hit.alignment.sbjct}</span><span style="color:#38bdf8; display:inline-block; width:55px; text-align:left; margin-left:12px;">${hit.subject_end}</span></div>
                    </div>
                `;
                hitsList.appendChild(card);
            });
        } else {
            hitsList.innerHTML = `<p style="color:#ef4444; padding:16px; background:#ffffff; border:1px solid #fca5a5; border-radius:var(--radius-lg);">Error: ${res.error || 'Failed to execute BLAST search.'}</p>`;
            document.getElementById('blast-graphic-container').style.display = 'none';
            document.getElementById('sequence-server-summary-table').style.display = 'none';
        }
    })
    .catch(err => {
        hitsList.innerHTML = `<p style="color:#ef4444; padding:16px; background:#ffffff; border:1px solid #fca5a5; border-radius:var(--radius-lg);">Error running BLAST query: ${err.message}</p>`;
        document.getElementById('blast-graphic-container').style.display = 'none';
        document.getElementById('sequence-server-summary-table').style.display = 'none';
    });
}

function renderSequenceServerHitTable(hits) {
    const tableContainer = document.getElementById('sequence-server-summary-table');
    if (!tableContainer) return;

    let html = `
    <div style="background:#ffffff; border:1px solid var(--border-color); border-radius:var(--radius-lg); padding:20px; margin-bottom:24px; box-shadow:var(--shadow-card);">
        <div style="display:flex; justify-style:space-between; align-items:center; margin-bottom:14px;">
            <h4 style="font-size:0.95rem; font-weight:700; color:var(--text-primary);">SequenceServer Hit Summary Table</h4>
            <div style="display:flex; gap:10px;">
                <button class="btn btn-sm" onclick="exportBlastTSV()" style="font-size:0.78rem;">Export TSV</button>
            </div>
        </div>
        <div class="table-responsive">
            <table class="data-table" style="font-size:0.85rem;">
                <thead>
                    <tr>
                        <th>Hit ID</th>
                        <th>Description</th>
                        <th>Score</th>
                        <th>E-value</th>
                        <th>Identity</th>
                        <th>Subject Coordinates</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
    `;

    hits.forEach((h, idx) => {
        const contigId = h.hit_id.split('.')[0];
        html += `
        <tr>
            <td class="mono-text"><strong>${h.hit_id}</strong></td>
            <td>${h.title || 'Cuminum cyminum locus'}</td>
            <td><span class="badge badge-emerald">${h.score}</span></td>
            <td>${h.evalue}</td>
            <td>${h.identity}</td>
            <td>${h.subject_start} - ${h.subject_end} (${h.strand})</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="navigateToJBrowseHit('${contigId}', ${h.subject_start}, ${h.subject_end})" style="padding:2px 8px; font-size:0.75rem;">
                    JBrowse 2
                </button>
            </td>
        </tr>
        `;
    });

    html += `
                </tbody>
            </table>
        </div>
    </div>
    `;

    tableContainer.innerHTML = html;
}

function drawSequenceServerRibbonPlot(queryLength, hits) {
    const container = document.getElementById('blast-ribbon-plot');
    if (!container) return;

    const width = 850;
    const rowHeight = 28;
    const queryY = 55;
    const tracksStart = 95;
    const height = tracksStart + (hits.length * rowHeight) + 20;

    let svg = `<svg viewBox="0 0 ${width} ${height}" width="100%" height="${height}" xmlns="http://www.w3.org/2000/svg" style="font-family:inherit; background:#ffffff; border-radius:8px;">`;

    // 1. SequenceServer Score Color Bar Legend (Top)
    svg += `
    <g transform="translate(140, 10)">
        <text x="0" y="12" font-size="10" font-weight="700" fill="#374151">Score Color Legend:</text>
        <rect x="110" y="3" width="50" height="12" fill="#374151" rx="2"/><text x="135" y="12" font-size="9" fill="#ffffff" text-anchor="middle">&lt;40</text>
        <rect x="165" y="3" width="50" height="12" fill="#2563eb" rx="2"/><text x="190" y="12" font-size="9" fill="#ffffff" text-anchor="middle">40-50</text>
        <rect x="220" y="3" width="50" height="12" fill="#10b981" rx="2"/><text x="245" y="12" font-size="9" fill="#ffffff" text-anchor="middle">50-80</text>
        <rect x="275" y="3" width="50" height="12" fill="#ec4899" rx="2"/><text x="300" y="12" font-size="9" fill="#ffffff" text-anchor="middle">80-200</text>
        <rect x="330" y="3" width="50" height="12" fill="#ef4444" rx="2"/><text x="355" y="12" font-size="9" fill="#ffffff" text-anchor="middle">&gt;=200</text>
    </g>
    `;

    // 2. Draw Query Ruler
    const rulerPadding = 140;
    const rulerWidth = width - rulerPadding - 40;
    
    const scale = (val) => rulerPadding + ((val / queryLength) * rulerWidth);

    // Query line
    svg += `<rect x="${rulerPadding}" y="${queryY}" width="${rulerWidth}" height="8" rx="3" fill="#475569" />`;
    svg += `<text x="${rulerPadding}" y="${queryY - 10}" font-size="11" font-weight="700" fill="#0f172a">Query sequence (Length: ${queryLength} bp)</text>`;

    // Query ruler ticks
    const tickCount = 6;
    for (let i = 0; i < tickCount; i++) {
        const val = Math.round((i / (tickCount - 1)) * queryLength);
        const x = scale(val);
        svg += `<line x1="${x}" y1="${queryY}" x2="${x}" y2="${queryY + 12}" stroke="#64748b" stroke-width="1.5" />`;
        svg += `<text x="${x}" y="${queryY + 24}" font-size="9" font-weight="600" fill="#475569" text-anchor="middle">${val} bp</text>`;
    }

    // 3. Draw SequenceServer Ribbon HSP Alignment Bars
    hits.forEach((hit, idx) => {
        const y = tracksStart + (idx * rowHeight);
        
        const qStart = hit.query_start || 1;
        const qEnd = hit.query_end || queryLength;
        
        const xStart = scale(qStart);
        const xEnd = scale(qEnd);
        const barWidth = Math.max(6, xEnd - xStart);

        let color = '#ef4444'; // Red >= 200
        if (hit.score < 40) color = '#374151';
        else if (hit.score < 50) color = '#2563eb';
        else if (hit.score < 80) color = '#10b981';
        else if (hit.score < 200) color = '#ec4899';

        svg += `
        <g class="blast-hit-group" style="cursor:pointer;" onclick="document.getElementById('hit-card-${idx}').scrollIntoView({behavior:'smooth'})">
            <title>${hit.hit_id} &#13;Score: ${hit.score} &#13;E-value: ${hit.evalue} &#13;Identity: ${hit.identity} &#13;Click to jump to alignment</title>
            
            <text x="${rulerPadding - 12}" y="${y + 10}" font-size="10" font-weight="600" fill="#1e293b" text-anchor="end">${hit.hit_id}</text>
            
            <rect x="${rulerPadding}" y="${y - 3}" width="${rulerWidth}" height="18" fill="transparent" />
            
            <rect x="${xStart}" y="${y}" width="${barWidth}" height="10" rx="3" fill="${color}" opacity="0.85" style="transition: opacity 0.2s;" onmouseover="this.setAttribute('opacity','1')" onmouseout="this.setAttribute('opacity','0.85')" />
        </g>
        `;
    });

    svg += '</svg>';
    container.innerHTML = svg;
}

function navigateToJBrowseHit(contig, start, end) {
    // Switch to Browser Tab
    switchTab('browser');
    
    // Set scaffold select dropdown if possible
    const select = document.getElementById('browser-contig-select');
    if (select) {
        select.value = contig;
    }
    
    // Navigate JBrowse view
    if (window.jbrowseViewState) {
        window.jbrowseViewState.session.view.navigate(`${contig}:${Math.max(1, start-200)}-${end+200}`);
    }
}

function exportBlastTSV() {
    if (!currentBlastResults || !currentBlastResults.hits) return;
    let tsv = "Hit_ID\tDescription\tBit_Score\tE_Value\tIdentity\tSubject_Start\tSubject_End\tStrand\n";
    currentBlastResults.hits.forEach(h => {
        tsv += `${h.hit_id}\t${h.title || ''}\t${h.score}\t${h.evalue}\t${h.identity}\t${h.subject_start}\t${h.subject_end}\t${h.strand}\n`;
    });
    
    const blob = new Blob([tsv], { type: 'text/tab-separated-values' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "cumin_sequenceserver_blast_hits.tsv";
    a.click();
}

function loadSampleBlast() {
    const sampleFasta = `>sample_cumin_cds_query
ATGGCCACCACCATGCAAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGC
GATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATC
GATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATC`;
    document.getElementById('blast-query-input').value = sampleFasta;
}

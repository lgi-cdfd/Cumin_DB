// CuminDB SequenceServer BLAST Controller & Auto-Detector (blast.js)

let currentBlastResults = null;

document.addEventListener('DOMContentLoaded', () => {
    autoDetectSequenceType();
});

// ----------------------------------------------------
// 1. AUTOMATIC SEQUENCE TYPE & PROGRAM SELECTION
// ----------------------------------------------------
function autoDetectSequenceType() {
    const inputEl = document.getElementById('blast-query-input');
    if (!inputEl) return;

    const raw = inputEl.value;
    const statusText = document.getElementById('detected-seq-type');
    const badge = document.getElementById('detected-program-badge');
    const programSelect = document.getElementById('blast-program');
    const dbSelect = document.getElementById('blast-database');
    
    if (!raw || raw.trim().length === 0) {
        if (statusText) {
            statusText.textContent = 'Waiting for input...';
            statusText.style.color = '#64748b';
        }
        if (badge) badge.style.display = 'none';
        return;
    }

    // Clean FASTA headers and strip non-alphabetical whitespace
    const cleanSeq = raw.replace(/^>.*$/gm, '').replace(/[^A-Z]/gi, '').toUpperCase();
    if (cleanSeq.length < 5) {
        if (statusText) {
            statusText.textContent = 'Sequence too short...';
            statusText.style.color = '#64748b';
        }
        if (badge) badge.style.display = 'none';
        return;
    }

    // Count nucleotide bases (A, T, C, G, U, N) vs Amino Acid specific letters
    let nucCount = 0;
    let protSpecificCount = 0;
    const protChars = new Set(['E', 'F', 'I', 'L', 'P', 'Q', 'Z', 'X', 'K', 'M', 'V', 'W', 'Y', 'D', 'H', 'R', 'S']);

    for (let i = 0; i < cleanSeq.length; i++) {
        const char = cleanSeq[i];
        if (['A', 'T', 'C', 'G', 'U', 'N'].includes(char)) {
            nucCount++;
        } else if (protChars.has(char)) {
            protSpecificCount++;
        }
    }

    const nucRatio = nucCount / cleanSeq.length;

    if (nucRatio >= 0.85 && protSpecificCount === 0) {
        // NUCLEOTIDE SEQUENCE DETECTED
        if (statusText) {
            statusText.textContent = `Nucleotide Sequence (${cleanSeq.length.toLocaleString()} bp)`;
            statusText.style.color = '#059669';
        }
        if (badge) {
            badge.style.display = 'inline-block';
            badge.textContent = 'Auto-Selected: blastn';
            badge.className = 'badge badge-emerald';
        }
        if (programSelect && programSelect.value !== 'blastx') {
            programSelect.value = 'blastn';
        }
        if (dbSelect && dbSelect.value === 'Cumin_Predicted_Proteins') {
            dbSelect.value = 'Cumin_Predicted_CDS';
        }
    } else {
        // PROTEIN SEQUENCE DETECTED
        if (statusText) {
            statusText.textContent = `Protein Sequence (${cleanSeq.length.toLocaleString()} aa)`;
            statusText.style.color = '#d97706';
        }
        if (badge) {
            badge.style.display = 'inline-block';
            badge.textContent = 'Auto-Selected: blastp';
            badge.className = 'badge badge-amber';
        }
        if (programSelect) programSelect.value = 'blastp';
        if (dbSelect) dbSelect.value = 'Cumin_Predicted_Proteins';
    }
}

// ----------------------------------------------------
// 2. EXECUTE BLAST ALIGNMENT
// ----------------------------------------------------
function runBlast() {
    const query = document.getElementById('blast-query-input').value;
    const program = document.getElementById('blast-program').value;
    const database = document.getElementById('blast-database').value;
    const evalue = document.getElementById('blast-evalue').value;
    
    if (!query || query.trim().length < 10) {
        alert('Please enter a valid FASTA sequence (minimum 10 bases/amino acids).');
        return;
    }
    
    const resultsContainer = document.getElementById('blast-results-container');
    const hitsList = document.getElementById('blast-hits-list');
    resultsContainer.style.display = 'block';
    hitsList.innerHTML = '<div style="text-align:center; padding:30px; color:var(--text-secondary);">Running SequenceServer BLAST alignment against CuminDB indexes...</div>';

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
            
            // 1. Render Linear Ribbon Plot
            drawSequenceServerRibbonPlot(res.query_length || 500, res.hits);

            // 2. Render Circular Chord Plot
            drawSequenceServerChordPlot(res.query_length || 500, res.hits);

            // 3. Render Tabular Hit Summary
            renderSequenceServerHitTable(res.hits);

            // 4. Render Pairwise Alignment Cards
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

                const contigId = hit.contig || hit.hit_id.split('.')[0];

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
                    
                    <!-- SequenceServer Pairwise Alignment Box -->
                    <div style="background:#0f172a; color:#f8fafc; padding:16px; border-radius:var(--radius-md); font-family:'JetBrains Mono', monospace; font-size:0.82rem; overflow-x: auto; border:1px solid #1e293b; line-height:1.6;">
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

// ----------------------------------------------------
// 3. PLOT VIEW SWITCHER (RIBBON / CHORD / BOTH)
// ----------------------------------------------------
function switchBlastPlotView(mode) {
    const ribbonWrapper = document.getElementById('blast-ribbon-plot-wrapper');
    const chordWrapper = document.getElementById('blast-chord-plot-wrapper');
    const btnRibbon = document.getElementById('btn-view-ribbon');
    const btnChord = document.getElementById('btn-view-chord');
    const btnBoth = document.getElementById('btn-view-both');

    if (!ribbonWrapper || !chordWrapper) return;

    btnRibbon.style.background = '#ffffff'; btnRibbon.style.color = 'var(--text-primary)';
    btnChord.style.background = '#ffffff'; btnChord.style.color = 'var(--text-primary)';
    btnBoth.style.background = '#ffffff'; btnBoth.style.color = 'var(--text-primary)';

    if (mode === 'ribbon') {
        ribbonWrapper.style.display = 'block';
        chordWrapper.style.display = 'none';
        btnRibbon.style.background = '#0f172a'; btnRibbon.style.color = '#ffffff';
    } else if (mode === 'chord') {
        ribbonWrapper.style.display = 'none';
        chordWrapper.style.display = 'block';
        btnChord.style.background = '#0f172a'; btnChord.style.color = '#ffffff';
    } else {
        ribbonWrapper.style.display = 'block';
        chordWrapper.style.display = 'block';
        btnBoth.style.background = '#0f172a'; btnBoth.style.color = '#ffffff';
    }
}

// ----------------------------------------------------
// 4. SEQUENCESERVER LINEAR RIBBON OVERVIEW PLOT
// ----------------------------------------------------
function drawSequenceServerRibbonPlot(queryLength, hits) {
    const container = document.getElementById('blast-ribbon-plot');
    if (!container) return;

    const width = 850;
    const rowHeight = 28;
    const queryY = 55;
    const tracksStart = 95;
    const height = tracksStart + (hits.length * rowHeight) + 20;

    let svg = `<svg viewBox="0 0 ${width} ${height}" width="100%" height="${height}" xmlns="http://www.w3.org/2000/svg" style="font-family:inherit; background:#ffffff; border-radius:8px;">`;

    // Color Bar Legend (Top)
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

    const rulerPadding = 140;
    const rulerWidth = width - rulerPadding - 40;
    const scale = (val) => rulerPadding + ((val / queryLength) * rulerWidth);

    svg += `<rect x="${rulerPadding}" y="${queryY}" width="${rulerWidth}" height="8" rx="3" fill="#475569" />`;
    svg += `<text x="${rulerPadding}" y="${queryY - 10}" font-size="11" font-weight="700" fill="#0f172a">Query sequence (Length: ${queryLength.toLocaleString()} bases)</text>`;

    const tickCount = 6;
    for (let i = 0; i < tickCount; i++) {
        const val = Math.round((i / (tickCount - 1)) * queryLength);
        const x = scale(val);
        svg += `<line x1="${x}" y1="${queryY}" x2="${x}" y2="${queryY + 12}" stroke="#64748b" stroke-width="1.5" />`;
        svg += `<text x="${x}" y="${queryY + 24}" font-size="9" font-weight="600" fill="#475569" text-anchor="middle">${val.toLocaleString()}</text>`;
    }

    hits.forEach((hit, idx) => {
        const y = tracksStart + (idx * rowHeight);
        const qStart = hit.query_start || 1;
        const qEnd = hit.query_end || queryLength;
        const xStart = scale(qStart);
        const xEnd = scale(qEnd);
        const barWidth = Math.max(6, xEnd - xStart);

        let color = '#ef4444';
        if (hit.score < 40) color = '#374151';
        else if (hit.score < 50) color = '#2563eb';
        else if (hit.score < 80) color = '#10b981';
        else if (hit.score < 200) color = '#ec4899';

        svg += `
        <g class="blast-hit-group" style="cursor:pointer;" onclick="document.getElementById('hit-card-${idx}').scrollIntoView({behavior:'smooth'})">
            <title>${hit.hit_id} &#13;Score: ${hit.score} &#13;E-value: ${hit.evalue} &#13;Identity: ${hit.identity} &#13;Click to jump to alignment</title>
            <text x="${rulerPadding - 12}" y="${y + 10}" font-size="10" font-weight="600" fill="#1e293b" text-anchor="end">${hit.hit_id}</text>
            <rect x="${rulerPadding}" y="${y - 3}" width="${rulerWidth}" height="18" fill="transparent" />
            <rect x="${xStart}" y="${y}" width="${barWidth}" height="10" rx="3" fill="${color}" opacity="0.85" />
        </g>
        `;
    });

    svg += '</svg>';
    container.innerHTML = svg;
}

// ----------------------------------------------------
// 5. SEQUENCESERVER CIRCULAR CHORD DIAGRAM PLOT
// ----------------------------------------------------
function drawSequenceServerChordPlot(queryLength, hits) {
    const container = document.getElementById('blast-chord-plot');
    if (!container) return;

    const width = 640;
    const height = 640;
    const cx = width / 2;
    const cy = height / 2;
    const outerR = 220;
    const innerR = 205;

    let svg = `<svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" style="font-family:inherit; background:#ffffff; border-radius:12px;">`;

    // Query Arc spans top angle from -135 deg to -45 deg (90 degrees)
    const qStartAngle = -135 * (Math.PI / 180);
    const qEndAngle = -45 * (Math.PI / 180);

    const polarToCartesian = (centerX, centerY, radius, angleInRadians) => {
        return {
            x: centerX + (radius * Math.cos(angleInRadians)),
            y: centerY + (radius * Math.sin(angleInRadians))
        };
    };

    const describeArc = (x, y, radius, startAngle, endAngle) => {
        const start = polarToCartesian(x, y, radius, endAngle);
        const end = polarToCartesian(x, y, radius, startAngle);
        const largeArcFlag = endAngle - startAngle <= Math.PI ? "0" : "1";
        return [
            "M", start.x, start.y,
            "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
        ].join(" ");
    };

    // Draw Query Outer Arc (Dark Blue / Slate)
    const queryArcPath = describeArc(cx, cy, outerR, qStartAngle, qEndAngle);
    svg += `<path d="${queryArcPath}" fill="none" stroke="#0f172a" stroke-width="14" stroke-linecap="round" />`;

    // Label Query Arc
    const queryMidAngle = (qStartAngle + qEndAngle) / 2;
    const queryLabelPos = polarToCartesian(cx, cy, outerR + 24, queryMidAngle);
    svg += `<text x="${queryLabelPos.x}" y="${queryLabelPos.y}" font-size="12" font-weight="800" fill="#0f172a" text-anchor="middle">FASTA Query Arc</text>`;

    // Target Hit Arcs distributed along perimeter (-30 deg to 210 deg = 240 degrees)
    const targetStartAngle = -30 * (Math.PI / 180);
    const targetEndAngle = 210 * (Math.PI / 180);
    const totalTargetSpan = targetEndAngle - targetStartAngle;
    const hitCount = hits.length;
    const arcGap = (hitCount > 1) ? 0.08 : 0;
    const hitSpan = (totalTargetSpan - (arcGap * (hitCount - 1))) / hitCount;

    hits.forEach((hit, idx) => {
        const hStartAngle = targetStartAngle + idx * (hitSpan + arcGap);
        const hEndAngle = hStartAngle + hitSpan;

        let color = '#ef4444'; // Red >= 200
        if (hit.score < 40) color = '#374151';
        else if (hit.score < 50) color = '#2563eb';
        else if (hit.score < 80) color = '#10b981';
        else if (hit.score < 200) color = '#ec4899';

        // Draw Target Arc
        const targetArcPath = describeArc(cx, cy, outerR, hStartAngle, hEndAngle);
        svg += `<path d="${targetArcPath}" fill="none" stroke="${color}" stroke-width="12" stroke-linecap="round" />`;

        // Label Target Arc
        const midAngle = (hStartAngle + hEndAngle) / 2;
        const labelPos = polarToCartesian(cx, cy, outerR + 22, midAngle);
        
        let textAnchor = "start";
        if (Math.cos(midAngle) < -0.2) textAnchor = "end";
        else if (Math.abs(Math.cos(midAngle)) <= 0.2) textAnchor = "middle";

        svg += `<text x="${labelPos.x}" y="${labelPos.y}" font-size="10" font-weight="700" fill="#334155" text-anchor="${textAnchor}">${hit.hit_id}</text>`;

        // Draw Ribbon Chord (Quadratic Bezier Curve passing through center)
        const qPosRatio = (hit.query_start || 1) / queryLength;
        const qChordAngle = qStartAngle + qPosRatio * (qEndAngle - qStartAngle);
        const pQuery = polarToCartesian(cx, cy, innerR, qChordAngle);
        const pTarget = polarToCartesian(cx, cy, innerR, midAngle);

        svg += `
        <g class="chord-ribbon-group" style="cursor:pointer;" onclick="document.getElementById('hit-card-${idx}').scrollIntoView({behavior:'smooth'})">
            <title>Hit: ${hit.hit_id} &#13;Score: ${hit.score} &#13;E-value: ${hit.evalue} &#13;Identity: ${hit.identity} &#13;Click to view alignment</title>
            <path d="M ${pQuery.x} ${pQuery.y} Q ${cx} ${cy} ${pTarget.x} ${pTarget.y}" fill="none" stroke="${color}" stroke-width="3" opacity="0.65" style="transition: all 0.2s;" onmouseover="this.setAttribute('stroke-width','6'); this.setAttribute('opacity','0.95');" onmouseout="this.setAttribute('stroke-width','3'); this.setAttribute('opacity','0.65');" />
        </g>
        `;
    });

    // Center Branding / Metric Badge
    svg += `
    <circle cx="${cx}" cy="${cy}" r="45" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2" />
    <text x="${cx}" y="${cy - 6}" font-size="11" font-weight="800" fill="#0f172a" text-anchor="middle">CuminDB</text>
    <text x="${cx}" y="${cy + 10}" font-size="9" font-weight="600" fill="#64748b" text-anchor="middle">${hitCount} Hits</text>
    `;

    svg += '</svg>';
    container.innerHTML = svg;
}

// ----------------------------------------------------
// 6. HELPER UTILITIES
// ----------------------------------------------------
function renderSequenceServerHitTable(hits) {
    const tableContainer = document.getElementById('sequence-server-summary-table');
    if (!tableContainer) return;

    let html = `
    <div style="background:#ffffff; border:1px solid var(--border-color); border-radius:var(--radius-lg); padding:20px; margin-bottom:24px; box-shadow:var(--shadow-card);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
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
        const contigId = h.contig || h.hit_id.split('.')[0];
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

function navigateToJBrowseHit(contig, start, end) {
    switchTab('browser');
    const select = document.getElementById('browser-contig-select');
    if (select) {
        select.value = contig;
    }
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

function loadSampleBlast(type = 'cds') {
    const input = document.getElementById('blast-query-input');
    const dbSelect = document.getElementById('blast-database');
    if (!input) return;

    if (type === 'protein') {
        input.value = `>CcGene_00001_Protein_Sample Cuminum cyminum predicted protein sequence (prot)
MATTMQASASASASASASASASASASAMATTMQASASASASASASASASASASAIDRSID
RSIDRSIDRSIDRSIDRSIDRSIDRSIDRSIDRSIDRSIDRSIDRSLGIKMAHATOLGI`;
        if (dbSelect) dbSelect.value = 'Cumin_Predicted_Proteins';
    } else if (type === 'genome') {
        input.value = `>CcContig_000001_Genome_Sample Cuminum cyminum genomic scaffold contig (nucl)
GCTAAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGC
TAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAG
AATTCCGGTTCCAAGGTTAACCGGTTCCAAGGTTAACCGGTTCCAAGGTTAACCGGTTC`;
        if (dbSelect) dbSelect.value = 'Cumin_Assembly_Contigs';
    } else {
        input.value = `>CcGene_00001_CDS_Sample Cuminum cyminum predicted coding sequence (nucl)
ATGGCCACCACCATGCAAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAG
ATGGCCACCACCATGCAAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAG
GATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATC`;
        if (dbSelect) dbSelect.value = 'Cumin_Predicted_CDS';
    }

    autoDetectSequenceType();
}

// ----------------------------------------------------
// 7. HIGH-RESOLUTION GRAPHIC PLOT EXPORT (SVG / PNG)
// ----------------------------------------------------
function getActivePlotSvg() {
    const ribbonWrapper = document.getElementById('blast-ribbon-plot-wrapper');
    const chordWrapper = document.getElementById('blast-chord-plot-wrapper');

    if (chordWrapper && chordWrapper.style.display !== 'none') {
        const chordSvg = chordWrapper.querySelector('svg');
        if (chordSvg) return chordSvg;
    }
    if (ribbonWrapper && ribbonWrapper.style.display !== 'none') {
        const ribbonSvg = ribbonWrapper.querySelector('svg');
        if (ribbonSvg) return ribbonSvg;
    }
    return document.querySelector('#blast-graphic-container svg');
}

function downloadBlastPlotSVG() {
    const svgEl = getActivePlotSvg();
    if (!svgEl) {
        alert('No active BLAST graphic plot found to download. Please run a BLAST search first.');
        return;
    }

    const svgData = new XMLSerializer().serializeToString(svgEl);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cumin_blast_alignment_plot.svg';
    a.click();
    URL.revokeObjectURL(url);
}

function downloadBlastPlotPNG() {
    // Download Python Matplotlib 600 DPI publication alignment plot
    const targetUrl = 'plots/cumin_blast_alignment_plot.png';
    const a = document.createElement('a');
    a.href = targetUrl;
    a.download = 'cumin_blast_alignment_plot_600dpi.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}


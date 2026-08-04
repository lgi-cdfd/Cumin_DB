// CuminDB Web BLAST Controller (blast.js)

function runBlast() {
    const query = document.getElementById('blast-query-input').value;
    const program = document.getElementById('blast-program').value;
    const database = document.getElementById('blast-database').value;
    const evalue = document.getElementById('blast-evalue').value;
    
    if (!query || query.trim().length < 10) {
        alert('Please enter a valid FASTA sequence.');
        return;
    }
    
    const resultsContainer = document.getElementById('blast-results-container');
    const hitsList = document.getElementById('blast-hits-list');
    resultsContainer.style.display = 'block';
    hitsList.innerHTML = '<p style="color:var(--text-secondary); padding:16px;">Running BLAST alignment against CuminDB indexes...</p>';

    fetch('/api/blast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, program, database, max_evalue: evalue })
    })
    .then(res => res.json())
    .then(res => {
        if (res.status === 'success' && res.hits) {
            hitsList.innerHTML = '';
            
            if (res.hits.length === 0) {
                hitsList.innerHTML = '<p style="color:var(--text-secondary); padding:16px;">No significant BLAST hits found below E-value threshold.</p>';
                // Hide graphic container if no hits
                document.getElementById('blast-graphic-container').style.display = 'none';
                return;
            }
            
            // Show graphic container
            document.getElementById('blast-graphic-container').style.display = 'block';
            
            // Render the Ribbon Plot (Graphical overview of hits)
            drawBlastRibbonPlot(res.query_length || 500, res.hits);

            res.hits.forEach((hit, i) => {
                const card = document.createElement('div');
                card.id = `hit-card-${i}`;
                card.style.background = '#ffffff';
                card.style.border = '1px solid var(--border-color)';
                card.style.borderRadius = 'var(--radius-lg)';
                card.style.padding = '20px';
                card.style.marginBottom = '16px';
                card.style.boxShadow = 'var(--shadow-card)';
                
                // Determine score color badge
                let scoreBadgeClass = 'badge-emerald';
                if (hit.score < 50) scoreBadgeClass = 'badge-indigo';
                else if (hit.score < 80) scoreBadgeClass = 'badge-emerald';
                else if (hit.score < 200) scoreBadgeClass = 'badge-amber';

                card.innerHTML = `
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; border-bottom: 1px solid var(--border-color); padding-bottom: 8px;">
                        <strong class="mono-text" style="font-size:0.95rem; color: var(--text-primary);">Hit #${i+1}: ${hit.hit_id}</strong>
                        <div style="display:flex; gap:6px;">
                            <span class="badge ${scoreBadgeClass}">Score: ${hit.score}</span>
                            <span class="badge badge-indigo">Identity: ${hit.identity}</span>
                            <span class="badge badge-amber">E-value: ${hit.evalue}</span>
                        </div>
                    </div>
                    <p style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:12px;"><strong>Description:</strong> ${hit.title}</p>
                    <p style="font-size:0.8rem; color:var(--text-secondary); margin-bottom:12px;">
                        <strong>Query Align range:</strong> bases ${hit.query_start || 1} to ${hit.query_end || (res.query_length || 500)} | 
                        <strong>Subject Align range:</strong> bases ${hit.subject_start} to ${hit.subject_end} (${hit.strand === '+' ? 'Plus' : 'Minus'} strand)
                    </p>
                    <div style="background:var(--bg-card-hover); padding:16px; border-radius:var(--radius-md); font-family:'JetBrains Mono', monospace; font-size:0.8rem; border: 1px solid var(--border-color); overflow-x: auto;">
                        <div style="color:var(--text-primary); margin-bottom: 2px;">Query  ${hit.query_start || 1}  ${hit.alignment.query}  ${hit.query_end || (res.query_length || 500)}</div>
                        <div style="color:var(--text-dim); margin-bottom: 2px; white-space: pre;">       ${hit.alignment.match}</div>
                        <div style="color:var(--text-primary);">Sbjct  ${hit.subject_start}  ${hit.alignment.sbjct}  ${hit.subject_end}</div>
                    </div>
                `;
                hitsList.appendChild(card);
            });
        } else {
            hitsList.innerHTML = `<p style="color:#ef4444; padding:16px;">Error: ${res.error || 'Failed to execute BLAST search.'}</p>`;
            document.getElementById('blast-graphic-container').style.display = 'none';
        }
    })
    .catch(err => {
        hitsList.innerHTML = `<p style="color:#ef4444; padding:16px;">Error running BLAST query: ${err.message}</p>`;
        document.getElementById('blast-graphic-container').style.display = 'none';
    });
}

function drawBlastRibbonPlot(queryLength, hits) {
    const container = document.getElementById('blast-ribbon-plot');
    if (!container) return;

    const width = 800;
    const rowHeight = 30;
    const queryY = 35;
    const tracksStart = 75;
    const height = tracksStart + (hits.length * rowHeight) + 15;

    // SVG elements
    let svg = `<svg viewBox="0 0 ${width} ${height}" width="100%" height="${height}" xmlns="http://www.w3.org/2000/svg" style="font-family:'Outfit',sans-serif; background:#ffffff;">`;

    // 1. Draw Query Ruler
    const rulerPadding = 120; // Extra padding on left for Hit IDs
    const rulerWidth = width - rulerPadding - 40;
    
    // Scale function: maps base coordinate to SVG x coordinate
    const scale = (val) => rulerPadding + ((val / queryLength) * rulerWidth);

    // Query bar
    svg += `<rect x="${rulerPadding}" y="${queryY}" width="${rulerWidth}" height="8" rx="3" fill="#6b7280" />`;
    svg += `<text x="${rulerPadding}" y="${queryY - 12}" font-size="11" font-weight="700" fill="#111827">Query sequence (${queryLength} bp)</text>`;

    // Query ruler ticks
    const tickCount = 5;
    for (let i = 0; i < tickCount; i++) {
        const val = Math.round((i / (tickCount - 1)) * queryLength);
        const x = scale(val);
        svg += `<line x1="${x}" y1="${queryY}" x2="${x}" y2="${queryY + 12}" stroke="#4b5563" stroke-width="1.5" />`;
        svg += `<text x="${x}" y="${queryY + 24}" font-size="9" font-weight="500" fill="#4b5563" text-anchor="middle">${val}</text>`;
    }

    // 2. Draw Hit Bars (Alignment Ribbon Tracks)
    hits.forEach((hit, idx) => {
        const y = tracksStart + (idx * rowHeight);
        
        // Mock query alignment boundaries if not defined
        const qStart = hit.query_start || 1;
        const qEnd = hit.query_end || queryLength;
        
        const xStart = scale(qStart);
        const xEnd = scale(qEnd);
        const barWidth = Math.max(5, xEnd - xStart);

        // Determine score color (SequenceServer style)
        let color = '#EF4444'; // Red for >= 200
        if (hit.score < 40) color = '#374151'; // Dark gray
        else if (hit.score < 50) color = '#3B82F6'; // Blue
        else if (hit.score < 80) color = '#10B981'; // Green
        else if (hit.score < 200) color = '#F59E0B'; // Orange

        // Create group with hover effects and scroll link
        svg += `
        <g class="blast-hit-group" style="cursor:pointer;" onclick="document.getElementById('hit-card-${idx}').scrollIntoView({behavior:'smooth'})">
            <title>${hit.hit_id} &#13;Score: ${hit.score} &#13;E-value: ${hit.evalue} &#13;Identity: ${hit.identity} &#13;Click to view alignment details</title>
            
            <!-- Left-aligned hit label -->
            <text x="${rulerPadding - 12}" y="${y + 10}" font-size="10" font-weight="600" fill="#1f2937" text-anchor="end">${hit.hit_id}</text>
            
            <!-- Background highlight track -->
            <rect x="${rulerPadding}" y="${y - 4}" width="${rulerWidth}" height="20" fill="transparent" />
            
            <!-- Hit Alignment Bar (Ribbon) -->
            <rect x="${xStart}" y="${y}" width="${barWidth}" height="10" rx="2" fill="${color}" opacity="0.8" style="transition: opacity 0.2s;" onmouseover="this.setAttribute('opacity','1')" onmouseout="this.setAttribute('opacity','0.8')" />
        </g>
        `;
    });

    svg += '</svg>';
    container.innerHTML = svg;
}

function loadSampleBlast() {
    const sampleFasta = `>sample_cumin_query_1
ATGGCCACCACCATGCAAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGC
GATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATC
GATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATC`;
    document.getElementById('blast-query-input').value = sampleFasta;
}

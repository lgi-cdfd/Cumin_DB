// CuminDB Web Application Controller (app.js)

let currentGenePage = 1;
let currentSsrPage = 1;
let currentTfPage = 1;
let currentMirnaPage = 1;

document.addEventListener('DOMContentLoaded', () => {
    fetchStats();
    loadGenes(1);
    loadSecMetabolites(1);
    loadSsrs(1);
    loadTfs(1);
    loadMirna(1);
    loadContigList();
});

// Tab Switcher
function switchTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.style.display = 'none');
    
    const activeBtn = Array.from(document.querySelectorAll('.tab-btn')).find(b => b.getAttribute('onclick').includes(tabId));
    if (activeBtn) activeBtn.classList.add('active');
    
    const targetTab = document.getElementById(`tab-${tabId}`);
    if (targetTab) targetTab.style.display = 'block';

    if (tabId === 'browser') {
        renderGenomeBrowserCanvas();
    }
}

// ----------------------------------------------------
// 1. FETCH STATS & INITIALIZE DASHBOARD
// ----------------------------------------------------
function fetchStats() {
    fetch('/api/stats')
        .then(res => res.json())
        .then(data => {
            if (data.status === 'success') {
                document.getElementById('stat-genes').textContent = Number(data.stats.total_genes).toLocaleString();
                document.getElementById('stat-tfs').textContent = Number(data.stats.total_tfs).toLocaleString();
                document.getElementById('stat-ssrs').textContent = Number(data.stats.total_ssrs).toLocaleString();
                document.getElementById('stat-mirna').textContent = Number(data.stats.total_mirna_targets).toLocaleString();
                
                // Initialize Charts
                if (window.renderCharts) {
                    window.renderCharts(data.tf_distribution, data.ssr_distribution, data.mirna_distribution, data.sec_metab_distribution);
                }
            }
        })
        .catch(err => console.error('Error fetching stats:', err));
}

// ----------------------------------------------------
// 2. GENE MODELS DATA TABLE & PAGINATION
// ----------------------------------------------------
let currentGenesCache = [];

function formatGoBadges(goIdsStr, goTermsStr) {
    if (!goIdsStr) return '<span style="color:#94a3b8;">-</span>';
    const ids = goIdsStr.split(/[;,]/).map(s => s.trim()).filter(Boolean);
    const terms = goTermsStr ? goTermsStr.split(/[;,]/).map(s => s.trim()) : [];
    const maxShow = 2;
    const badgesHtml = ids.slice(0, maxShow).map((id, i) => {
        const title = terms[i] || id;
        return `<a href="https://amigo.geneontology.org/amigo/term/${id}" target="_blank" class="badge badge-emerald" style="text-decoration:none; display:inline-block; margin:2px;" title="${title}">${id}</a>`;
    }).join(' ');
    
    if (ids.length > maxShow) {
        return badgesHtml + ` <span style="font-size:0.75rem; color:#64748b; font-weight:600;" title="${ids.join(', ')}">+${ids.length - maxShow}</span>`;
    }
    return badgesHtml;
}

function formatEcBadges(ecStr, ecNameStr) {
    if (!ecStr) return '<span style="color:#94a3b8;">-</span>';
    const ecs = ecStr.split(/[;,]/).map(s => s.trim().replace(/^EC:/i, '')).filter(Boolean);
    const maxShow = 2;
    const badgesHtml = ecs.slice(0, maxShow).map(ec => {
        return `<a href="https://enzyme.expasy.org/EC/${ec}" target="_blank" class="badge badge-amber" style="text-decoration:none; display:inline-block; margin:2px;" title="${ecNameStr || 'Enzyme'}">EC ${ec}</a>`;
    }).join(' ');

    if (ecs.length > maxShow) {
        return badgesHtml + ` <span style="font-size:0.75rem; color:#64748b; font-weight:600;" title="${ecs.join(', ')}">+${ecs.length - maxShow}</span>`;
    }
    return badgesHtml;
}

function formatInterProBadges(sigsStr, nameStr) {
    if (!sigsStr) return '<span style="color:#94a3b8;">-</span>';
    const sigs = sigsStr.split(/[;,]/).map(s => s.trim()).filter(Boolean);
    const maxShow = 2;
    const badgesHtml = sigs.slice(0, maxShow).map(sig => {
        const cleanSig = sig.split(' ')[0];
        return `<a href="https://www.ebi.ac.uk/interpro/search/text/${cleanSig}" target="_blank" class="badge badge-indigo" style="text-decoration:none; display:inline-block; margin:2px;" title="${nameStr || cleanSig}">${cleanSig}</a>`;
    }).join(' ');

    if (sigs.length > maxShow) {
        return badgesHtml + ` <span style="font-size:0.75rem; color:#64748b; font-weight:600;" title="${sigs.join(', ')}">+${sigs.length - maxShow}</span>`;
    }
    return badgesHtml;
}

function loadGenes(page = 1) {
    currentGenePage = page;
    const limit = document.getElementById('gene-limit-select').value;
    const search = document.getElementById('gene-search-input').value;
    
    const tbody = document.getElementById('genes-table-body');
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; padding:30px;">Loading genes...</td></tr>';
    
    fetch(`/api/genes?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`)
        .then(res => res.json())
        .then(res => {
            if (res.status === 'success') {
                tbody.innerHTML = '';
                currentGenesCache = res.data;

                if (res.data.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; padding:30px;">No matching genes found.</td></tr>';
                    return;
                }
                
                res.data.forEach(gene => {
                    const tr = document.createElement('tr');
                    const goBadges = formatGoBadges(gene.go_ids, gene.go_terms);
                    const ecBadges = formatEcBadges(gene.ec_code, gene.ec_name);
                    const iprBadges = formatInterProBadges(gene.interpro_signatures, gene.interpro_name);
                    const descText = gene.description || 'Predicted protein';

                    tr.innerHTML = `
                        <td class="mono-text"><a href="#" onclick="openGeneModal('${gene.gene_id}'); return false;" style="color:var(--accent-indigo); font-weight:700;">${gene.gene_id}</a></td>
                        <td class="mono-text" style="font-size:0.82rem;">${gene.contig}</td>
                        <td style="font-size:0.82rem;">${gene.start.toLocaleString()} - ${gene.end.toLocaleString()} (${gene.length.toLocaleString()} bp)</td>
                        <td><span class="badge ${gene.strand === '+' ? 'badge-emerald' : 'badge-indigo'}">${gene.strand}</span></td>
                        <td style="font-size:0.85rem; line-height:1.4; max-width:320px; white-space:normal; word-break:break-word;">${descText}</td>
                        <td>${goBadges}</td>
                        <td>${ecBadges}</td>
                        <td>${iprBadges}</td>
                        <td><button class="btn btn-primary" style="padding:4px 12px; font-size:0.78rem;" onclick="openGeneModal('${gene.gene_id}')">View</button></td>
                    `;
                    tbody.appendChild(tr);
                });

                document.getElementById('genes-pagination-info').textContent = `Page ${res.page} of ${res.total_pages} (${res.total.toLocaleString()} total genes)`;
                document.getElementById('genes-prev-btn').disabled = res.page <= 1;
                document.getElementById('genes-next-btn').disabled = res.page >= res.total_pages;
            }
        });
}

function openGeneModal(geneId) {
    const gene = currentGenesCache.find(g => g.gene_id === geneId);
    if (!gene) return;

    document.getElementById('modal-gene-title').textContent = `${gene.gene_id} - Functional Annotation`;
    
    const goList = gene.go_ids ? gene.go_ids.split(/[;,]/).map((id, i) => {
        const term = (gene.go_terms ? gene.go_terms.split(/[;,]/)[i] : '') || '';
        return `<li><a href="https://amigo.geneontology.org/amigo/term/${id.trim()}" target="_blank" style="color:#0284c7; font-weight:600; text-decoration:none;">${id.trim()}</a> ${term ? '- ' + term.trim() : ''}</li>`;
    }).join('') : '<p style="color:#94a3b8;">No GO terms assigned.</p>';

    const ecList = gene.ec_code ? gene.ec_code.split(/[;,]/).map(ec => {
        const cleanEc = ec.trim().replace(/^EC:/i, '');
        return `<li><a href="https://enzyme.expasy.org/EC/${cleanEc}" target="_blank" style="color:#d97706; font-weight:600; text-decoration:none;">EC ${cleanEc}</a> ${gene.ec_name ? '- ' + gene.ec_name : ''}</li>`;
    }).join('') : '<p style="color:#94a3b8;">No EC number assigned.</p>';

    const iprList = gene.interpro_signatures ? gene.interpro_signatures.split(/[;,]/).map(sig => {
        const cleanSig = sig.trim().split(' ')[0];
        return `<li><a href="https://www.ebi.ac.uk/interpro/search/text/${cleanSig}" target="_blank" style="color:#6366f1; font-weight:600; text-decoration:none;">${cleanSig}</a> ${sig.trim()}</li>`;
    }).join('') : '<p style="color:#94a3b8;">No InterPro signatures found.</p>';

    const body = document.getElementById('modal-gene-body');
    body.innerHTML = `
        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:16px; margin-bottom:16px;">
            <h4 style="margin-top:0; color:#0f172a; font-size:0.95rem;">Protein Description</h4>
            <p style="margin:0; font-size:0.9rem; color:#334155; line-height:1.4;">${gene.description || 'Predicted protein'}</p>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px;">
            <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:14px;">
                <span style="font-size:0.8rem; color:#64748b; font-weight:600;">Contig Locus</span>
                <p style="margin:4px 0 0; font-family:monospace; font-weight:700; color:#0f172a;">${gene.contig}:${gene.start}-${gene.end} (${gene.strand})</p>
            </div>
            <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:14px;">
                <span style="font-size:0.8rem; color:#64748b; font-weight:600;">Sequence Length</span>
                <p style="margin:4px 0 0; font-weight:700; color:#0f172a;">${gene.length.toLocaleString()} bp</p>
            </div>
        </div>

        <div style="margin-bottom:16px;">
            <h4 style="margin-bottom:8px; color:#0369a1; font-size:0.92rem;">Gene Ontology (GO) Terms (AmiGO 2 Links)</h4>
            <ul style="margin:0; padding-left:20px; font-size:0.88rem; line-height:1.5;">${goList}</ul>
        </div>

        <div style="margin-bottom:16px;">
            <h4 style="margin-bottom:8px; color:#b45309; font-size:0.92rem;">Enzyme Classification (ExPASy ENZYME Links)</h4>
            <ul style="margin:0; padding-left:20px; font-size:0.88rem; line-height:1.5;">${ecList}</ul>
        </div>

        <div>
            <h4 style="margin-bottom:8px; color:#4338ca; font-size:0.92rem;">InterPro Domains & Signatures (EBI InterPro Links)</h4>
            ${gene.interpro_name ? `<p style="font-size:0.85rem; color:#475569; margin-bottom:8px;"><strong>InterPro Name:</strong> ${gene.interpro_name}</p>` : ''}
            <ul style="margin:0; padding-left:20px; font-size:0.88rem; line-height:1.5;">${iprList}</ul>
        </div>
    `;

    document.getElementById('gene-detail-modal').style.display = 'flex';
}

function closeGeneModal() {
    document.getElementById('gene-detail-modal').style.display = 'none';
}

function handleGeneSearch(e) {
    if (e.key === 'Enter') loadGenes(1);
}
function prevGenePage() { if (currentGenePage > 1) loadGenes(currentGenePage - 1); }
function nextGenePage() { loadGenes(currentGenePage + 1); }

// ----------------------------------------------------
// SECONDARY METABOLITES DATA TABLE
// ----------------------------------------------------
let currentSecPage = 1;
let currentSecCache = [];

function formatKeggBadges(keggStr) {
    if (!keggStr || keggStr === '-') return '<span style="color:#94a3b8;">-</span>';
    const maps = keggStr.split(/[;,]/).map(s => s.trim()).filter(Boolean);
    return maps.map(m => {
        const cleanMap = m.replace(/^(ko|map)/i, 'map');
        return `<a href="https://www.genome.jp/dbget-bin/www_bget?pathway:${cleanMap}" target="_blank" class="badge badge-amber" style="text-decoration:none; display:inline-block; margin:2px;" title="KEGG Pathway ${m}">${m}</a>`;
    }).join(' ');
}

function loadSecMetabolites(page = 1) {
    currentSecPage = page;
    const limit = document.getElementById('sec-limit-select').value;
    const search = document.getElementById('sec-search-input').value;
    const category = document.getElementById('sec-cat-select').value;
    
    const tbody = document.getElementById('sec-table-body');
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:30px;">Loading secondary metabolites...</td></tr>';
    
    fetch(`/api/sec-metabolites?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}&category=${encodeURIComponent(category)}`)
        .then(res => res.json())
        .then(res => {
            if (res.status === 'success') {
                tbody.innerHTML = '';
                currentSecCache = res.data;

                // Populate Category Select dropdown if empty
                const catSelect = document.getElementById('sec-cat-select');
                if (catSelect && catSelect.children.length <= 1 && res.categories) {
                    res.categories.forEach(c => {
                        const opt = document.createElement('option');
                        opt.value = c.metabolite_category;
                        opt.textContent = `${c.metabolite_category} (${c.count})`;
                        catSelect.appendChild(opt);
                    });
                }

                if (res.data.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:30px;">No matching secondary metabolite pathways found.</td></tr>';
                    return;
                }
                
                res.data.forEach(sec => {
                    const tr = document.createElement('tr');
                    const goBadges = formatGoBadges(sec.gos, sec.gos);
                    const keggBadges = formatKeggBadges(sec.kegg_pathway);

                    tr.innerHTML = `
                        <td class="mono-text"><a href="#" onclick="searchGeneById('${sec.gene_id}'); return false;" style="color:var(--accent-indigo); font-weight:700;">${sec.gene_id}</a></td>
                        <td class="mono-text" style="font-size:0.82rem;">${sec.contig}:${sec.start.toLocaleString()}-${sec.end.toLocaleString()} (${sec.strand})</td>
                        <td><span class="badge badge-indigo">${sec.metabolite_category}</span></td>
                        <td style="font-size:0.85rem; line-height:1.4; max-width:300px; white-space:normal; word-break:break-word;">${sec.description || 'Secondary metabolite gene'}</td>
                        <td>${goBadges}</td>
                        <td>${keggBadges}</td>
                        <td><button class="btn btn-primary" style="padding:4px 12px; font-size:0.78rem;" onclick="searchGeneById('${sec.gene_id}')">View Gene</button></td>
                    `;
                    tbody.appendChild(tr);
                });

                document.getElementById('sec-pagination-info').textContent = `Page ${res.page} of ${res.total_pages} (${res.total.toLocaleString()} total pathways)`;
                document.getElementById('sec-prev-btn').disabled = res.page <= 1;
                document.getElementById('sec-next-btn').disabled = res.page >= res.total_pages;
            }
        });
}

function handleSecSearch(e) { if (e.key === 'Enter') loadSecMetabolites(1); }
function prevSecPage() { if (currentSecPage > 1) loadSecMetabolites(currentSecPage - 1); }
function nextSecPage() { loadSecMetabolites(currentSecPage + 1); }

// ----------------------------------------------------
// 3. SSR MARKERS DATA TABLE & PRIMERS
// ----------------------------------------------------
function loadSsrs(page = 1) {
    currentSsrPage = page;
    const limit = document.getElementById('ssr-limit-select') ? document.getElementById('ssr-limit-select').value : 20;
    const motif = document.getElementById('ssr-motif-input') ? document.getElementById('ssr-motif-input').value.trim() : '';
    const geneId = document.getElementById('ssr-gene-input') ? document.getElementById('ssr-gene-input').value.trim() : '';
    const type = document.getElementById('ssr-type-select') ? document.getElementById('ssr-type-select').value : '';
    
    const tbody = document.getElementById('ssrs-table-body');
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; padding:30px;">Loading SSR primers...</td></tr>';
    
    fetch(`/api/ssrs?page=${page}&limit=${limit}&motif=${encodeURIComponent(motif)}&gene_id=${encodeURIComponent(geneId)}&type=${encodeURIComponent(type)}`)
        .then(res => res.json())
        .then(res => {
            if (res.status === 'success') {
                tbody.innerHTML = '';
                
                const pagInfo = document.getElementById('ssrs-pagination-info');
                const prevBtn = document.getElementById('ssrs-prev-btn');
                const nextBtn = document.getElementById('ssrs-next-btn');

                if (pagInfo) pagInfo.textContent = `Page ${res.page} of ${res.total_pages || 1} (${res.total.toLocaleString()} total markers)`;
                if (prevBtn) prevBtn.disabled = res.page <= 1;
                if (nextBtn) nextBtn.disabled = res.page >= res.total_pages;

                if (res.data.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; padding:30px;">No matching SSR markers found.</td></tr>';
                    return;
                }
                
                res.data.forEach(ssr => {
                    const tr = document.createElement('tr');
                    const geneHtml = (ssr.gene_id && ssr.gene_id !== 'Intergenic')
                        ? `<a href="#" onclick="searchGeneById('${ssr.gene_id}'); return false;" class="mono-text" style="color:var(--accent-indigo); font-weight:700;">${ssr.gene_id}</a>`
                        : `<span style="color:var(--text-muted); font-weight:600; padding-left:12px;">-</span>`;
                    
                    let locBadge = `<span class="badge" style="background:#f1f5f9; color:#475569;">Intergenic</span>`;
                    if (ssr.ssr_location === 'Coding (CDS)') {
                        locBadge = `<span class="badge" style="background:#dcfce7; color:#15803d; font-weight:700;">Coding (CDS)</span>`;
                    } else if (ssr.ssr_location === 'Non-coding (Intron)') {
                        locBadge = `<span class="badge" style="background:#e0f2fe; color:#0369a1; font-weight:600;">Non-coding (Intron)</span>`;
                    } else if (ssr.ssr_location === 'Non-coding (Exon/UTR)') {
                        locBadge = `<span class="badge" style="background:#f3e8ff; color:#7e22ce; font-weight:600;">Non-coding (Exon/UTR)</span>`;
                    }

                    tr.innerHTML = `
                        <td class="mono-text" title="Original Raw ID: ${ssr.original_id || ''}"><strong>${ssr.ssr_id}</strong></td>
                        <td class="mono-text" style="font-size:0.8rem;">${ssr.contig}:${ssr.start}-${ssr.end}</td>
                        <td>${geneHtml}</td>
                        <td>${locBadge}</td>
                        <td><span class="badge badge-amber">${ssr.ssr_type}</span></td>
                        <td class="mono-text"><strong>${ssr.motif}</strong> (${ssr.repeat_count}x)</td>
                        <td class="mono-text" style="font-size:0.8rem;">
                            ${ssr.primer_forward}
                            <br><span style="font-size:0.75rem; color:var(--text-muted);">Tm: ${ssr.tm_f}°C</span>
                            <button class="copy-btn" onclick="copyText('${ssr.primer_forward}', this)">Copy</button>
                        </td>
                        <td class="mono-text" style="font-size:0.8rem;">
                            ${ssr.primer_reverse}
                            <br><span style="font-size:0.75rem; color:var(--text-muted);">Tm: ${ssr.tm_r}°C</span>
                            <button class="copy-btn" onclick="copyText('${ssr.primer_reverse}', this)">Copy</button>
                        </td>
                        <td><strong>${ssr.product_size} bp</strong></td>
                    `;
                    tbody.appendChild(tr);
                });
            }
        });
}

function searchGeneById(geneId) {
    switchTab('genes');
    const input = document.getElementById('gene-search-input');
    if (input) {
        input.value = geneId;
        loadGenes(1);
    }
}

function handleSsrSearch(e) { if (e.key === 'Enter') loadSsrs(1); }
function prevSsrPage() { if (currentSsrPage > 1) loadSsrs(currentSsrPage - 1); }
function nextSsrPage() { loadSsrs(currentSsrPage + 1); }

function clearSsrFilters() {
    if (document.getElementById('ssr-motif-input')) document.getElementById('ssr-motif-input').value = '';
    if (document.getElementById('ssr-gene-input')) document.getElementById('ssr-gene-input').value = '';
    if (document.getElementById('ssr-type-select')) document.getElementById('ssr-type-select').value = '';
    loadSsrs(1);
}

// ----------------------------------------------------
// 4. TRANSCRIPTION FACTORS DATA TABLE
// ----------------------------------------------------
function loadTfs(page = 1) {
    currentTfPage = page;
    const limit = document.getElementById('tf-limit-select').value;
    const search = document.getElementById('tf-search-input').value;
    const family = document.getElementById('tf-family-select').value;
    
    const tbody = document.getElementById('tfs-table-body');
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:30px;">Loading transcription factors...</td></tr>';
    
    fetch(`/api/tfs?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}&family=${encodeURIComponent(family)}`)
        .then(res => res.json())
        .then(res => {
            if (res.status === 'success') {
                tbody.innerHTML = '';
                
                // Populate TF Family Select dropdown if empty
                const familySelect = document.getElementById('tf-family-select');
                if (familySelect.children.length <= 1 && res.families) {
                    res.families.forEach(f => {
                        const opt = document.createElement('option');
                        opt.value = f.tf_family;
                        opt.textContent = `${f.tf_family} (${f.count})`;
                        familySelect.appendChild(opt);
                    });
                }

                if (res.data.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:30px;">No matching transcription factors found.</td></tr>';
                    return;
                }
                
                res.data.forEach(tf => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td class="mono-text"><strong>${tf.gene_id}</strong></td>
                        <td><span class="badge badge-indigo">${tf.tf_family}</span></td>
                        <td class="mono-text">${tf.ath_hit}</td>
                        <td class="mono-text" style="color:var(--accent-amber);">${tf.evalue}</td>
                        <td>${tf.description || 'Transcription factor'}</td>
                        <td><a href="${tf.tair_url}" target="_blank" class="external-link">TAIR Accession</a></td>
                    `;
                    tbody.appendChild(tr);
                });

                document.getElementById('tfs-pagination-info').textContent = `Page ${res.page} of ${res.total_pages} (${res.total.toLocaleString()} total TFs)`;
                document.getElementById('tfs-prev-btn').disabled = res.page <= 1;
                document.getElementById('tfs-next-btn').disabled = res.page >= res.total_pages;
            }
        });
}

function handleTfSearch(e) { if (e.key === 'Enter') loadTfs(1); }
function prevTfPage() { if (currentTfPage > 1) loadTfs(currentTfPage - 1); }
function nextTfPage() { loadTfs(currentTfPage + 1); }

// ----------------------------------------------------
// 5. miRNA TARGETS DATA TABLE
// ----------------------------------------------------
function loadMirna(page = 1) {
    currentMirnaPage = page;
    const limit = document.getElementById('mirna-limit-select') ? document.getElementById('mirna-limit-select').value : 20;
    const mirnaAcc = document.getElementById('mirna-acc-input') ? document.getElementById('mirna-acc-input').value.trim() : '';
    const mirbaseId = document.getElementById('mirna-mirbase-input') ? document.getElementById('mirna-mirbase-input').value.trim() : '';
    const targetGene = document.getElementById('mirna-gene-input') ? document.getElementById('mirna-gene-input').value.trim() : '';
    const expectSelect = document.getElementById('mirna-expect-select');
    const expect = expectSelect ? expectSelect.value : '';
    const inhibSelect = document.getElementById('mirna-inhibition-select');
    const inhibition = inhibSelect ? inhibSelect.value : '';
    
    const tbody = document.getElementById('mirna-table-body');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="10" style="text-align:center; padding:30px;">Loading miRNA targets...</td></tr>';
    
    const queryParams = new URLSearchParams({
        page: page,
        limit: limit,
        mirna_acc: mirnaAcc,
        mirbase_id: mirbaseId,
        target_gene: targetGene,
        expectation: expect,
        inhibition: inhibition
    });

    fetch(`/api/mirna?${queryParams.toString()}`)
        .then(res => res.json())
        .then(res => {
            if (res.status === 'success') {
                tbody.innerHTML = '';
                if (res.data.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="10" style="text-align:center; padding:30px;">No matching miRNA targets found.</td></tr>';
                    return;
                }
                
                res.data.forEach(m => {
                    const tr = document.createElement('tr');
                    
                    const expVal = Number(m.expectation);
                    const expectLabel = (expVal % 1 === 0) ? expVal.toFixed(1) : String(expVal);
                    
                    let expectBadgeClass = 'badge-emerald';
                    if (expVal > 3.5) expectBadgeClass = 'badge-secondary';
                    else if (expVal > 2.5) expectBadgeClass = 'badge-amber';
                    else if (expVal > 1.0) expectBadgeClass = 'badge-indigo';

                    const geneLink = (m.target_gene && m.target_gene.startsWith('CcGene'))
                        ? `<a href="#" onclick="searchGeneById('${m.target_gene}'); return false;" class="mono-text" style="color:var(--accent-indigo); font-weight:700;">${m.target_gene}</a>`
                        : `<span class="mono-text">${m.target_gene || '-'}</span>`;

                    const duplexHtml = (m.mirna_aligned && m.target_aligned)
                        ? `<div style="font-family:'JetBrains Mono',monospace; font-size:0.75rem; line-height:1.3; white-space:nowrap; background:#f8fafc; padding:4px 8px; border-radius:4px; border:1px solid #e2e8f0;">
                             <span style="color:#0284c7; font-weight:600;">m:</span> ${m.mirna_aligned}<br>
                             <span style="color:#059669; font-weight:600;">t:</span> ${m.target_aligned}
                           </div>`
                        : '-';

                    tr.innerHTML = `
                        <td class="mono-text"><strong>${m.mirna_acc}</strong></td>
                        <td class="mono-text">${m.mirbase_id}</td>
                        <td>${geneLink}</td>
                        <td><span class="badge ${expectBadgeClass}">${expectLabel}</span></td>
                        <td class="mono-text" style="font-size:0.8rem;">${m.upe !== undefined && m.upe !== null ? m.upe : '-1.0'}</td>
                        <td class="mono-text" style="font-size:0.8rem;">${m.mirna_start || 1} - ${m.mirna_end || 20}</td>
                        <td class="mono-text" style="font-size:0.8rem;">${m.target_start} - ${m.target_end}</td>
                        <td>${duplexHtml}</td>
                        <td><span class="badge ${m.inhibition === 'Cleavage' ? 'badge-emerald' : 'badge-amber'}">${m.inhibition || 'Cleavage'}</span></td>
                        <td><a href="${m.mirbase_url}" target="_blank" class="external-link" title="Open official miRBase ${m.mirbase_id}">miRBase Link</a></td>
                    `;
                    tbody.appendChild(tr);
                });

                document.getElementById('mirna-pagination-info').textContent = `Page ${res.page} of ${res.total_pages} (${res.total.toLocaleString()} total interactions)`;
                document.getElementById('mirna-prev-btn').disabled = res.page <= 1;
                document.getElementById('mirna-next-btn').disabled = res.page >= res.total_pages;
            }
        });
}

function clearMirnaFilters() {
    if (document.getElementById('mirna-acc-input')) document.getElementById('mirna-acc-input').value = '';
    if (document.getElementById('mirna-mirbase-input')) document.getElementById('mirna-mirbase-input').value = '';
    if (document.getElementById('mirna-gene-input')) document.getElementById('mirna-gene-input').value = '';
    if (document.getElementById('mirna-expect-select')) document.getElementById('mirna-expect-select').value = '';
    if (document.getElementById('mirna-inhibition-select')) document.getElementById('mirna-inhibition-select').value = '';
    loadMirna(1);
}

function handleMirnaSearch(e) { if (e.key === 'Enter') loadMirna(1); }
function prevMirnaPage() { if (currentMirnaPage > 1) loadMirna(currentMirnaPage - 1); }
function nextMirnaPage() { loadMirna(currentMirnaPage + 1); }

// Helper Utilities
function copyText(text, btnElement) {
    if (!text) return;

    function showSuccessFeedback() {
        if (btnElement && btnElement.innerText !== undefined) {
            const originalText = btnElement.innerText;
            const originalBg = btnElement.style.background;
            const originalColor = btnElement.style.color;

            btnElement.innerText = 'Copied!';
            btnElement.style.background = '#10b981';
            btnElement.style.color = '#ffffff';

            setTimeout(() => {
                btnElement.innerText = originalText;
                btnElement.style.background = originalBg;
                btnElement.style.color = originalColor;
            }, 1500);
        }
    }

    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(() => {
            showSuccessFeedback();
        }).catch(() => {
            fallbackCopyTextToClipboard(text, showSuccessFeedback);
        });
    } else {
        fallbackCopyTextToClipboard(text, showSuccessFeedback);
    }
}

function fallbackCopyTextToClipboard(text, callback) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
        const successful = document.execCommand('copy');
        if (successful && callback) callback();
    } catch (err) {
        console.error('Fallback copy failed:', err);
    }

    document.body.removeChild(textArea);
}

function exportData(type) {
    if (type === 'ssrs') {
        const motif = document.getElementById('ssr-motif-input') ? document.getElementById('ssr-motif-input').value.trim() : '';
        const geneId = document.getElementById('ssr-gene-input') ? document.getElementById('ssr-gene-input').value.trim() : '';
        const ssrType = document.getElementById('ssr-type-select') ? document.getElementById('ssr-type-select').value : '';
        window.location.href = `/api/ssrs?format=csv&motif=${encodeURIComponent(motif)}&gene_id=${encodeURIComponent(geneId)}&type=${encodeURIComponent(ssrType)}`;
    } else if (type === 'mirna') {
        const mirnaAcc = document.getElementById('mirna-acc-input') ? document.getElementById('mirna-acc-input').value.trim() : '';
        const mirbaseId = document.getElementById('mirna-mirbase-input') ? document.getElementById('mirna-mirbase-input').value.trim() : '';
        const targetGene = document.getElementById('mirna-gene-input') ? document.getElementById('mirna-gene-input').value.trim() : '';
        const expect = document.getElementById('mirna-expect-select') ? document.getElementById('mirna-expect-select').value : '';
        const inhibition = document.getElementById('mirna-inhibition-select') ? document.getElementById('mirna-inhibition-select').value : '';
        window.location.href = `/api/mirna?format=csv&mirna_acc=${encodeURIComponent(mirnaAcc)}&mirbase_id=${encodeURIComponent(mirbaseId)}&target_gene=${encodeURIComponent(targetGene)}&expectation=${encodeURIComponent(expect)}&inhibition=${encodeURIComponent(inhibition)}`;
    } else {
        window.location.href = `/api/${type}?format=csv`;
    }
}

// ----------------------------------------------------
// 6. FOOTER OVERLAY MODALS CONTROLLER
// ----------------------------------------------------
function showFooterModal(type) {
    const modal = document.getElementById('footer-modal');
    const title = document.getElementById('modal-title');
    const body = document.getElementById('modal-body-content');
    if (!modal || !title || !body) return;

    if (type === 'privacy') {
        title.textContent = 'Privacy Policy';
        body.innerHTML = `
            <div style="font-size: 0.9rem; line-height: 1.6; color: var(--text-secondary);">
                <p style="margin-bottom: 12px;"><strong>CuminDB Privacy Statement</strong></p>
                <p style="margin-bottom: 12px;">The CuminDB Genome and Functional Annotation Portal is hosted and maintained by the Laboratory of Genome Informatics (LGI) at the Centre for DNA Fingerprinting and Diagnostics (CDFD), Hyderabad, India.</p>
                <p style="margin-bottom: 12px;">We value open science and visitor privacy. CuminDB does not deploy user-tracking cookie suites, marketing tools, or collect any personal identifying information from its visitors.</p>
                <p>Standard web server usage metadata (such as IP addresses, user-agent strings, and request timestamps) is recorded temporarily in web access logs for security audits, traffic statistics, and performance optimization purposes.</p>
            </div>
        `;
    } else if (type === 'terms') {
        title.textContent = 'Terms of Use';
        body.innerHTML = `
            <div style="font-size: 0.9rem; line-height: 1.6; color: var(--text-secondary);">
                <p style="margin-bottom: 12px;"><strong>Terms & License Agreements</strong></p>
                <p style="margin-bottom: 12px;">All genomic resources, structural assembly coordinates, simple sequence repeat markers, PCR primers, transcription factors, and miRNA target coordinates hosted within CuminDB are freely available for public use.</p>
                <p style="margin-bottom: 12px;">Data downloads, BLAST query alignments, and JBrowse track visualization exports are distributed under the <strong>Creative Commons Attribution 4.0 International (CC BY 4.0)</strong> license.</p>
                <p>Users are free to copy, redistribute, remix, and build upon these datasets for both academic and commercial applications, provided proper credit/citation is attributed to CuminDB.</p>
            </div>
        `;
    } else if (type === 'citation') {
        title.textContent = 'Citation Guide';
        body.innerHTML = `
            <div style="font-size: 0.9rem; line-height: 1.6; color: var(--text-secondary);">
                <p style="margin-bottom: 12px;"><strong>How to Cite CuminDB</strong></p>
                <p style="margin-bottom: 14px;">If you utilize datasets, PCR primer designs, annotation tracks, or comparative mapping outputs from CuminDB in your publication, please cite the database as follows:</p>
                <div id="citation-text" style="background: var(--bg-card-hover); padding: 14px; border-radius: var(--radius-md); border: 1px solid var(--border-color); font-family: 'JetBrains Mono', monospace; font-size: 0.8rem; color: var(--text-primary); line-height: 1.5; margin-bottom: 16px; word-break: break-all;">
Ajay Kumar Mahato, Lakshmi Devi, Priyanka Kushwaha, Ramesh Eerapagula, Ankit Bhagat. CuminDB: An Interactive Genomic and Functional Annotation Database for Cuminum cyminum L. Scientific Data (2026).
                </div>
                <button class="btn btn-primary" onclick="copyCitationText(this)">Copy Citation to Clipboard</button>
            </div>
        `;
    }

    modal.style.display = 'flex';
}

function closeFooterModal() {
    const modal = document.getElementById('footer-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function copyCitationText(btnElement) {
    const citeDiv = document.getElementById('citation-text');
    if (citeDiv) {
        copyText(citeDiv.textContent.trim(), btnElement);
    }
}

// ----------------------------------------------------
// 7. INTERACTIVE TUTORIAL HELPER FUNCTIONS
// ----------------------------------------------------
function tutorialSearch(tab, query, selectId, selectVal) {
    switchTab(tab);
    if (selectId && selectVal !== undefined && selectVal !== null) {
        const sel = document.getElementById(selectId);
        if (sel) {
            sel.value = selectVal;
        }
    }
    
    if (tab === 'genes') {
        const input = document.getElementById('gene-search-input');
        if (input) input.value = query || '';
        loadGenes(1);
    } else if (tab === 'sec-metabolites') {
        const input = document.getElementById('sec-search-input');
        if (input) input.value = query || '';
        loadSecMetabolites(1);
    } else if (tab === 'ssrs') {
        const input = document.getElementById('ssr-motif-input');
        if (input) input.value = query || '';
        loadSsrs(1);
    } else if (tab === 'tfs') {
        const input = document.getElementById('tf-search-input');
        if (input) input.value = query || '';
        loadTfs(1);
    } else if (tab === 'mirna') {
        const input = document.getElementById('mirna-search-input');
        if (input) input.value = query || '';
        loadMirna(1);
    }
}

function loadBlastSampleSequence(fastaSeq) {
    switchTab('blast');
    const input = document.getElementById('blast-query-input');
    if (input) {
        input.value = fastaSeq;
    }
    const container = document.getElementById('tab-blast');
    if (container) {
        container.scrollIntoView({ behavior: 'smooth' });
    }
}

function toggleFaqAccordion(headerEl) {
    const item = headerEl.parentElement;
    const isExpanded = item.classList.contains('active');
    document.querySelectorAll('.faq-item').forEach(el => el.classList.remove('active'));
    if (!isExpanded) {
        item.classList.add('active');
    }
}

function scrollToTutorialSection(sectionId) {
    const el = document.getElementById(sectionId);
    if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}


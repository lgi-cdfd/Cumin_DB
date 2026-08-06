// CuminDB Web Application Controller (app.js)

let currentGenePage = 1;
let currentSsrPage = 1;
let currentTfPage = 1;
let currentMirnaPage = 1;

document.addEventListener('DOMContentLoaded', () => {
    fetchStats();
    loadGenes(1);
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
                    window.renderCharts(data.tf_distribution, data.ssr_distribution, data.mirna_distribution);
                }
            }
        })
        .catch(err => console.error('Error fetching stats:', err));
}

// ----------------------------------------------------
// 2. GENE MODELS DATA TABLE & PAGINATION
// ----------------------------------------------------
function loadGenes(page = 1) {
    currentGenePage = page;
    const limit = document.getElementById('gene-limit-select').value;
    const search = document.getElementById('gene-search-input').value;
    
    const tbody = document.getElementById('genes-table-body');
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:30px;">Loading genes...</td></tr>';
    
    fetch(`/api/genes?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`)
        .then(res => res.json())
        .then(res => {
            if (res.status === 'success') {
                tbody.innerHTML = '';
                if (res.data.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:30px;">No matching genes found.</td></tr>';
                    return;
                }
                
                res.data.forEach(gene => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td class="mono-text"><strong>${gene.gene_id}</strong></td>
                        <td>${gene.contig}</td>
                        <td>${gene.start.toLocaleString()} - ${gene.end.toLocaleString()} (${gene.length} bp)</td>
                        <td><span class="badge ${gene.strand === '+' ? 'badge-emerald' : 'badge-indigo'}">${gene.strand}</span></td>
                        <td>${gene.description || '<span style="color:#6b7280;">Uncharacterized protein</span>'}</td>
                        <td style="max-width:250px; overflow:hidden; text-overflow:ellipsis;">${gene.go_terms ? gene.go_terms.substring(0, 80) + '...' : '-'}</td>
                        <td class="mono-text">${gene.ec_code || '-'}</td>
                    `;
                    tbody.appendChild(tr);
                });

                document.getElementById('genes-pagination-info').textContent = `Page ${res.page} of ${res.total_pages} (${res.total.toLocaleString()} total genes)`;
                document.getElementById('genes-prev-btn').disabled = res.page <= 1;
                document.getElementById('genes-next-btn').disabled = res.page >= res.total_pages;
            }
        });
}

function handleGeneSearch(e) {
    if (e.key === 'Enter') loadGenes(1);
}
function prevGenePage() { if (currentGenePage > 1) loadGenes(currentGenePage - 1); }
function nextGenePage() { loadGenes(currentGenePage + 1); }

// ----------------------------------------------------
// 3. SSR MARKERS DATA TABLE & PRIMERS
// ----------------------------------------------------
function loadSsrs(page = 1) {
    currentSsrPage = page;
    const limit = document.getElementById('ssr-limit-select').value;
    const search = document.getElementById('ssr-search-input').value;
    const type = document.getElementById('ssr-type-select').value;
    
    const tbody = document.getElementById('ssrs-table-body');
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:30px;">Loading SSR primers...</td></tr>';
    
    fetch(`/api/ssrs?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}&type=${encodeURIComponent(type)}`)
        .then(res => res.json())
        .then(res => {
            if (res.status === 'success') {
                tbody.innerHTML = '';
                if (res.data.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:30px;">No matching SSR markers found.</td></tr>';
                    return;
                }
                
                res.data.forEach(ssr => {
                    const tr = document.createElement('tr');
                    const geneHtml = (ssr.gene_id && ssr.gene_id !== 'Intergenic')
                        ? `<a href="#" onclick="searchGeneById('${ssr.gene_id}'); return false;" class="mono-text" style="color:var(--accent-indigo); font-weight:700;">${ssr.gene_id}</a>`
                        : `<span style="color:var(--text-secondary); font-size:0.8rem;">Intergenic</span>`;
                    
                    tr.innerHTML = `
                        <td class="mono-text" title="Original Raw ID: ${ssr.original_id || ''}"><strong>${ssr.ssr_id}</strong></td>
                        <td class="mono-text" style="font-size:0.8rem;">${ssr.contig}:${ssr.start}-${ssr.end}</td>
                        <td>${geneHtml}</td>
                        <td><span class="badge badge-amber">${ssr.ssr_type}</span></td>
                        <td class="mono-text"><strong>${ssr.motif}</strong> (${ssr.repeat_count}x)</td>
                        <td class="mono-text" style="font-size:0.8rem;">
                            ${ssr.primer_forward}
                            <br><span style="font-size:0.75rem; color:var(--text-muted);">Tm: ${ssr.tm_f}°C</span>
                            <button class="copy-btn" onclick="copyText('${ssr.primer_forward}')">Copy</button>
                        </td>
                        <td class="mono-text" style="font-size:0.8rem;">
                            ${ssr.primer_reverse}
                            <br><span style="font-size:0.75rem; color:var(--text-muted);">Tm: ${ssr.tm_r}°C</span>
                            <button class="copy-btn" onclick="copyText('${ssr.primer_reverse}')">Copy</button>
                        </td>
                        <td><strong>${ssr.product_size} bp</strong></td>
                    `;
                    tbody.appendChild(tr);
                });

                document.getElementById('ssr-pagination-info').textContent = `Page ${res.page} of ${res.total_pages} (${res.total.toLocaleString()} total markers)`;
                document.getElementById('ssr-prev-btn').disabled = res.page <= 1;
                document.getElementById('ssr-next-btn').disabled = res.page >= res.total_pages;
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
    const limit = document.getElementById('mirna-limit-select').value;
    const search = document.getElementById('mirna-search-input').value;
    
    const tbody = document.getElementById('mirna-table-body');
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:30px;">Loading miRNA targets...</td></tr>';
    
    fetch(`/api/mirna?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`)
        .then(res => res.json())
        .then(res => {
            if (res.status === 'success') {
                tbody.innerHTML = '';
                if (res.data.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:30px;">No matching miRNA targets found.</td></tr>';
                    return;
                }
                
                res.data.forEach(m => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td class="mono-text"><strong>${m.mirna_acc}</strong></td>
                        <td class="mono-text">${m.mirbase_id}</td>
                        <td class="mono-text">${m.target_gene}</td>
                        <td class="mono-text" style="color:var(--accent-emerald);">${m.expectation}</td>
                        <td><span class="badge ${m.inhibition === 'Cleavage' ? 'badge-emerald' : 'badge-amber'}">${m.inhibition}</span></td>
                        <td class="mono-text" style="font-size:0.75rem;">${m.target_aligned ? m.target_aligned.substring(0, 30) + '...' : '-'}</td>
                        <td><a href="${m.mirbase_url}" target="_blank" class="external-link">miRBase ID</a></td>
                    `;
                    tbody.appendChild(tr);
                });

                document.getElementById('mirna-pagination-info').textContent = `Page ${res.page} of ${res.total_pages} (${res.total.toLocaleString()} total interactions)`;
                document.getElementById('mirna-prev-btn').disabled = res.page <= 1;
                document.getElementById('mirna-next-btn').disabled = res.page >= res.total_pages;
            }
        });
}

function handleMirnaSearch(e) { if (e.key === 'Enter') loadMirna(1); }
function prevMirnaPage() { if (currentMirnaPage > 1) loadMirna(currentMirnaPage - 1); }
function nextMirnaPage() { loadMirna(currentMirnaPage + 1); }

// Helper Utilities
function copyText(text) {
    navigator.clipboard.writeText(text);
    alert('Copied primer sequence to clipboard: ' + text);
}

function exportData(type) {
    window.location.href = `/api/${type}?format=csv`;
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
                <button class="btn btn-primary" onclick="copyCitationText()">Copy Citation to Clipboard</button>
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

function copyCitationText() {
    const citeDiv = document.getElementById('citation-text');
    if (citeDiv) {
        navigator.clipboard.writeText(citeDiv.textContent.trim());
        alert('Citation copied to clipboard!');
    }
}

// CuminDB Interactive Chart.js Controller (charts.js)

let tfChartInstance = null;
let ssrChartInstance = null;
let mirnaChartInstance = null;
let secMetabChartInstance = null;

window.renderCharts = function(tfDist, ssrDist, mirnaDist, secMetabDist) {
    // ----------------------------------------------------
    // 1. TF FAMILY DISTRIBUTION (Interactive Bar Chart)
    // ----------------------------------------------------
    const ctxTf = document.getElementById('chart-tfs');
    if (ctxTf && tfDist && tfDist.length > 0) {
        if (tfChartInstance) tfChartInstance.destroy();
        
        const labels = tfDist.map(item => item.tf_family);
        const counts = tfDist.map(item => item.count);
        
        tfChartInstance = new Chart(ctxTf, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Transcription Factors',
                    data: counts,
                    backgroundColor: 'rgba(14, 165, 233, 0.85)', // Sky Blue
                    borderColor: '#0284c7',
                    borderWidth: 1.5,
                    borderRadius: 5,
                    hoverBackgroundColor: '#0284c7'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                layout: { padding: { top: 4, bottom: 4, left: 4, right: 4 } },
                onClick: (e, activeElements) => {
                    if (activeElements.length > 0) {
                        const index = activeElements[0].index;
                        const family = labels[index];
                        switchTab('tfs');
                        const select = document.getElementById('tf-family-select');
                        if (select) {
                            select.value = family;
                            loadTFs(1);
                        }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#0f172a',
                        titleColor: '#38bdf8',
                        bodyColor: '#ffffff',
                        padding: 10,
                        cornerRadius: 6,
                        callbacks: {
                            label: function(context) {
                                return ` Count: ${context.parsed.y.toLocaleString()} genes (Click to view)`;
                            }
                        }
                    }
                },
                scales: {
                    x: { ticks: { color: '#475569', font: { family: 'Outfit, sans-serif', size: 10, weight: '600' } }, grid: { display: false } },
                    y: { ticks: { color: '#475569', font: { family: 'Outfit, sans-serif', size: 10 } }, grid: { color: '#f1f5f9' } }
                }
            }
        });
    }

    // ----------------------------------------------------
    // 2. SSR MOTIF PROPORTIONS (Interactive Doughnut Chart)
    // ----------------------------------------------------
    const ctxSsr = document.getElementById('chart-ssrs');
    if (ctxSsr && ssrDist && ssrDist.length > 0) {
        if (ssrChartInstance) ssrChartInstance.destroy();
        
        const labels = ssrDist.map(item => item.ssr_type);
        const counts = ssrDist.map(item => item.count);
        
        ssrChartInstance = new Chart(ctxSsr, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: counts,
                    backgroundColor: [
                        '#6366f1', // Indigo
                        '#10b981', // Emerald
                        '#f59e0b', // Amber
                        '#ec4899', // Pink
                        '#06b6d4', // Cyan
                        '#8b5cf6'  // Purple
                    ],
                    borderWidth: 2,
                    borderColor: '#ffffff',
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '60%',
                layout: { padding: { top: 4, bottom: 6, left: 4, right: 4 } },
                onClick: (e, activeElements) => {
                    if (activeElements.length > 0) {
                        const index = activeElements[0].index;
                        const ssrType = labels[index];
                        switchTab('ssrs');
                        const select = document.getElementById('ssr-type-select');
                        if (select) {
                            select.value = ssrType;
                            loadSSRs(1);
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#334155',
                            font: { family: 'Outfit, sans-serif', size: 10, weight: '600' },
                            boxWidth: 10,
                            padding: 6
                        }
                    },
                    tooltip: {
                        backgroundColor: '#0f172a',
                        titleColor: '#ffffff',
                        bodyColor: '#38bdf8',
                        padding: 10,
                        cornerRadius: 6,
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const val = context.raw;
                                const pct = ((val / total) * 100).toFixed(1);
                                return ` ${context.label}: ${val.toLocaleString()} (${pct}%) - Click to filter`;
                            }
                        }
                    }
                }
            }
        });
    }

    // ----------------------------------------------------
    // 3. miRNA INHIBITION MECHANISMS (Interactive Doughnut)
    // ----------------------------------------------------
    const ctxMirna = document.getElementById('chart-mirna');
    if (ctxMirna && mirnaDist && mirnaDist.length > 0) {
        if (mirnaChartInstance) mirnaChartInstance.destroy();
        
        const labels = mirnaDist.map(item => item.inhibition || 'Cleavage');
        const counts = mirnaDist.map(item => item.count);
        
        mirnaChartInstance = new Chart(ctxMirna, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: counts,
                    backgroundColor: [
                        '#10b981', // Emerald for Cleavage
                        '#f59e0b', // Amber for Translation Repression
                        '#3b82f6'  // Blue
                    ],
                    borderWidth: 2,
                    borderColor: '#ffffff',
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '60%',
                layout: { padding: { top: 4, bottom: 6, left: 4, right: 4 } },
                onClick: (e, activeElements) => {
                    if (activeElements.length > 0) {
                        const index = activeElements[0].index;
                        const mode = labels[index];
                        switchTab('mirna');
                        const searchInput = document.getElementById('mirna-search-input');
                        if (searchInput) {
                            searchInput.value = mode;
                            loadMiRNA(1);
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#334155',
                            font: { family: 'Outfit, sans-serif', size: 10, weight: '600' },
                            boxWidth: 10,
                            padding: 6
                        }
                    },
                    tooltip: {
                        backgroundColor: '#0f172a',
                        titleColor: '#ffffff',
                        bodyColor: '#34d399',
                        padding: 10,
                        cornerRadius: 6,
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const val = context.raw;
                                const pct = ((val / total) * 100).toFixed(1);
                                return ` ${context.label}: ${val.toLocaleString()} (${pct}%) - Click to filter`;
                            }
                        }
                    }
                }
            }
        });
    }

    // ----------------------------------------------------
    // 4. SECONDARY METABOLITES CATEGORIES (Interactive Bar)
    // ----------------------------------------------------
    const ctxSecMetab = document.getElementById('chart-sec-metab');
    if (ctxSecMetab && secMetabDist && secMetabDist.length > 0) {
        if (secMetabChartInstance) secMetabChartInstance.destroy();
        
        const labels = secMetabDist.map(item => item.metabolite_category);
        const counts = secMetabDist.map(item => item.count);
        
        secMetabChartInstance = new Chart(ctxSecMetab, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Biosynthetic Genes',
                    data: counts,
                    backgroundColor: 'rgba(16, 185, 129, 0.85)', // Emerald Green
                    borderColor: '#059669',
                    borderWidth: 1.5,
                    borderRadius: 5,
                    hoverBackgroundColor: '#059669'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                layout: { padding: { top: 6, bottom: 4, left: 4, right: 4 } },
                onClick: (e, activeElements) => {
                    if (activeElements.length > 0) {
                        const index = activeElements[0].index;
                        const cat = labels[index];
                        switchTab('sec-metabolites');
                        const select = document.getElementById('sec-cat-select');
                        if (select) {
                            select.value = cat;
                            loadSecMetabolites(1);
                        }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#0f172a',
                        titleColor: '#34d399',
                        bodyColor: '#ffffff',
                        padding: 10,
                        cornerRadius: 6,
                        callbacks: {
                            label: function(context) {
                                return ` Count: ${context.parsed.y.toLocaleString()} genes (Click to view)`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: '#475569',
                            font: { family: 'Outfit, sans-serif', size: 9, weight: '600' },
                            maxRotation: 90,
                            minRotation: 90,
                            autoSkip: false
                        },
                        grid: { display: false }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: { color: '#475569', font: { family: 'Outfit, sans-serif', size: 9 } },
                        grid: { color: '#f1f5f9' }
                    }
                }
            }
        });
    }
};

// ----------------------------------------------------
// 5. EXPORT PYTHON-GENERATED 600 DPI PUBLICATION PNG
// ----------------------------------------------------
function exportChartPNG(canvasId, filename) {
    // Map canvas ID to Python-generated 600 DPI high-resolution Matplotlib image asset
    const pyPlotMap = {
        'chart-tfs': 'plots/cumin_tf_distribution.png',
        'chart-ssrs': 'plots/cumin_ssr_distribution.png',
        'chart-mirna': 'plots/cumin_mirna_inhibition.png',
        'chart-sec-metab': 'plots/cumin_secondary_metabolites.png'
    };

    const targetUrl = pyPlotMap[canvasId] || `plots/${filename}.png`;
    
    // Direct trigger download of 600 DPI Matplotlib image asset
    const a = document.createElement('a');
    a.href = targetUrl;
    a.download = `${filename}_600dpi.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

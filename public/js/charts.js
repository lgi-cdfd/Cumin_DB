// CuminDB Chart.js Visualizations Controller (charts.js)

let tfChartInstance = null;
let ssrChartInstance = null;
let mirnaChartInstance = null;

window.renderCharts = function(tfDist, ssrDist, mirnaDist) {
    // 1. TF Family Chart (Bar Chart) - Curated Scientific Blue-Teal Palette
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
                    label: 'Number of TFs',
                    data: counts,
                    backgroundColor: 'rgba(70, 130, 180, 0.8)', // Professional Steel Blue
                    borderColor: '#4682B4',
                    borderWidth: 1.5,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(17, 24, 39, 0.95)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderWidth: 1,
                        borderColor: '#e5e7eb',
                        callbacks: {
                            label: function(context) {
                                return `Count: ${context.parsed.y.toLocaleString()}`;
                            }
                        }
                    }
                },
                scales: {
                    x: { ticks: { color: '#4b5563', font: { family: 'Outfit', size: 10 } }, grid: { display: false } },
                    y: { ticks: { color: '#4b5563', font: { family: 'Outfit', size: 10 } }, grid: { color: '#e5e7eb' } }
                }
            }
        });
    }

    // 2. SSR Motif Chart (Doughnut Chart) - Curated Professional Scientific Palette
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
                        '#4F46E5', // Indigo
                        '#10B981', // Emerald
                        '#F59E0B', // Amber
                        '#E11D48', // Rose
                        '#06B6D4'  // Cyan
                    ],
                    borderWidth: 1,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: '#111827', font: { family: 'Outfit', size: 10 } }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(17, 24, 39, 0.95)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderWidth: 1,
                        borderColor: '#e5e7eb',
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const val = context.raw;
                                const pct = ((val / total) * 100).toFixed(1);
                                return ` ${context.label}: ${val.toLocaleString()} (${pct}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    // 3. miRNA Inhibition Mechanism Chart (Doughnut Chart) - Clean Dual-Contrast Blue/Coral Palette
    const ctxMirna = document.getElementById('chart-mirna');
    if (ctxMirna && mirnaDist && mirnaDist.length > 0) {
        if (mirnaChartInstance) mirnaChartInstance.destroy();
        
        const labels = mirnaDist.map(item => item.inhibition || 'Unknown');
        const counts = mirnaDist.map(item => item.count);
        
        mirnaChartInstance = new Chart(ctxMirna, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: counts,
                    backgroundColor: [
                        '#3B82F6', // Blue for Cleavage
                        '#EC4899'  // Pink/Coral for Translation
                    ],
                    borderWidth: 1,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: '#111827', font: { family: 'Outfit', size: 10 } }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(17, 24, 39, 0.95)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderWidth: 1,
                        borderColor: '#e5e7eb',
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const val = context.raw;
                                const pct = ((val / total) * 100).toFixed(1);
                                return ` ${context.label}: ${val.toLocaleString()} (${pct}%)`;
                            }
                        }
                    }
                }
            }
        });
    }
};

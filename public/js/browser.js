// CuminDB JBrowse 2 Multi-Track Genome View Controller (browser.js)

let jbrowseViewState = null;
let contigsList = [];

function loadContigList() {
    fetch('/api/genome-browser/contigs')
        .then(res => res.json())
        .then(res => {
            if (res.status === 'success' && res.contigs) {
                contigsList = res.contigs;
                const select = document.getElementById('browser-contig-select');
                if (!select) return;
                select.innerHTML = '<option value="">Select Assembly Scaffold / Contig...</option>';
                res.contigs.forEach(c => {
                    const opt = document.createElement('option');
                    opt.value = c;
                    opt.textContent = c;
                    select.appendChild(opt);
                });
                
                // Initialize JBrowse 2
                initializeJBrowse2();
            }
        });
}

function initializeJBrowse2() {
    const container = document.getElementById('jbrowse-linear-view');
    if (!container || !window.JBrowseReactLinearGenomeView) return;

    const { createViewState, JBrowseLinearGenomeView } = window.JBrowseReactLinearGenomeView;

    // Build multi-track configuration state
    jbrowseViewState = new createViewState({
        assembly: {
            name: 'Cuminum_cyminum',
            sequence: {
                type: 'ReferenceSequenceTrack',
                trackId: 'Cuminum_cyminum_sequence',
                adapter: {
                    type: 'IndexedFastaAdapter',
                    fastaLocation: { 
                        uri: '/api/genome-browser/fasta',
                        locationType: 'UriLocation'
                    },
                    faiLocation: { 
                        uri: '/api/genome-browser/fai',
                        locationType: 'UriLocation'
                    }
                }
            }
        },
        tracks: [
            {
                type: 'FeatureTrack',
                trackId: 'cumin_gene_models',
                name: 'Gene Models & Annotations (GFF3)',
                assemblyNames: ['Cuminum_cyminum'],
                adapter: {
                    type: 'Gff3TabixAdapter',
                    gffGzLocation: { uri: '/db/cumin_genes.gff.gz', locationType: 'UriLocation' },
                    index: { location: { uri: '/db/cumin_genes.gff.gz.tbi', locationType: 'UriLocation' } }
                }
            },
            {
                type: 'FeatureTrack',
                trackId: 'cumin_repeats',
                name: 'EDTA Repeatmasking Results (GFF3)',
                assemblyNames: ['Cuminum_cyminum'],
                adapter: {
                    type: 'Gff3TabixAdapter',
                    gffGzLocation: { uri: '/db/cumin_repeats.gff.gz', locationType: 'UriLocation' },
                    index: { location: { uri: '/db/cumin_repeats.gff.gz.tbi', locationType: 'UriLocation' } }
                }
            },
            {
                type: 'FeatureTrack',
                trackId: 'cumin_ssrs',
                name: 'SSR Markers & Primers (GFF3)',
                assemblyNames: ['Cuminum_cyminum'],
                adapter: {
                    type: 'Gff3TabixAdapter',
                    gffGzLocation: { uri: '/db/cumin_ssrs.gff.gz', locationType: 'UriLocation' },
                    index: { location: { uri: '/db/cumin_ssrs.gff.gz.tbi', locationType: 'UriLocation' } }
                }
            },
            {
                type: 'FeatureTrack',
                trackId: 'cumin_mirna',
                name: 'miRNA Target Interactions (GFF3)',
                assemblyNames: ['Cuminum_cyminum'],
                adapter: {
                    type: 'Gff3TabixAdapter',
                    gffGzLocation: { uri: '/db/cumin_mirna.gff.gz', locationType: 'UriLocation' },
                    index: { location: { uri: '/db/cumin_mirna.gff.gz.tbi', locationType: 'UriLocation' } }
                }
            },
            {
                type: 'FeatureTrack',
                trackId: 'cumin_sec_metabolites',
                name: 'Secondary Metabolite Pathways (GFF3)',
                assemblyNames: ['Cuminum_cyminum'],
                adapter: {
                    type: 'Gff3TabixAdapter',
                    gffGzLocation: { uri: '/db/cumin_sec_metabolites.gff.gz', locationType: 'UriLocation' },
                    index: { location: { uri: '/db/cumin_sec_metabolites.gff.gz.tbi', locationType: 'UriLocation' } }
                }
            }
        ],
        defaultSession: {
            name: 'CuminDB Default Session',
            view: {
                id: 'linearGenomeView',
                type: 'LinearGenomeView',
                loc: 'CcContig_000001:1-5000',
                tracks: [
                    {
                        id: 'cumin_gene_models',
                        type: 'FeatureTrack',
                        configuration: 'cumin_gene_models',
                        displays: [{ id: 'cumin_gene_models-LinearBasicDisplay', type: 'LinearBasicDisplay', configuration: 'cumin_gene_models-LinearBasicDisplay' }]
                    },
                    {
                        id: 'cumin_repeats',
                        type: 'FeatureTrack',
                        configuration: 'cumin_repeats',
                        displays: [{ id: 'cumin_repeats-LinearBasicDisplay', type: 'LinearBasicDisplay', configuration: 'cumin_repeats-LinearBasicDisplay' }]
                    },
                    {
                        id: 'cumin_ssrs',
                        type: 'FeatureTrack',
                        configuration: 'cumin_ssrs',
                        displays: [{ id: 'cumin_ssrs-LinearBasicDisplay', type: 'LinearBasicDisplay', configuration: 'cumin_ssrs-LinearBasicDisplay' }]
                    },
                    {
                        id: 'cumin_mirna',
                        type: 'FeatureTrack',
                        configuration: 'cumin_mirna',
                        displays: [{ id: 'cumin_mirna-LinearBasicDisplay', type: 'LinearBasicDisplay', configuration: 'cumin_mirna-LinearBasicDisplay' }]
                    },
                    {
                        id: 'cumin_sec_metabolites',
                        type: 'FeatureTrack',
                        configuration: 'cumin_sec_metabolites',
                        displays: [{ id: 'cumin_sec_metabolites-LinearBasicDisplay', type: 'LinearBasicDisplay', configuration: 'cumin_sec_metabolites-LinearBasicDisplay' }]
                    }
                ]
            }
        }
    });

    // Render Component into DOM
    ReactDOM.render(
        React.createElement(JBrowseLinearGenomeView, { viewState: jbrowseViewState }),
        container
    );
}

function navigateJBrowseContig() {
    const select = document.getElementById('browser-contig-select');
    if (!select || !jbrowseViewState) return;
    const selectedContig = select.value;
    if (selectedContig) {
        jbrowseViewState.session.view.navigate(`${selectedContig}:1-5000`);
    }
}

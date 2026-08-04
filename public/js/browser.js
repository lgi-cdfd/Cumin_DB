// CuminDB JBrowse 2 Linear Genome View Controller (browser.js)

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

    // Build configuration state using standard constructor instantiation
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
                name: 'Gene Models (GFF3)',
                assemblyNames: ['Cuminum_cyminum'],
                adapter: {
                    type: 'Gff3TabixAdapter',
                    gffGzLocation: { 
                        uri: '/api/genome-browser/gff',
                        locationType: 'UriLocation'
                    },
                    index: { 
                        location: {
                            uri: '/api/genome-browser/gff-index',
                            locationType: 'UriLocation'
                        }
                    }
                }
            },
            {
                type: 'FeatureTrack',
                trackId: 'cumin_ssrs',
                name: 'SSR Markers (GFF3)',
                assemblyNames: ['Cuminum_cyminum'],
                adapter: {
                    type: 'Gff3TabixAdapter',
                    gffGzLocation: { 
                        uri: '/api/genome-browser/ssrs-gff',
                        locationType: 'UriLocation'
                    },
                    index: { 
                        location: {
                            uri: '/api/genome-browser/ssrs-gff-index',
                            locationType: 'UriLocation'
                        }
                    }
                }
            }
        ],
        defaultSession: {
            name: 'CuminDB Default Session',
            view: {
                id: 'linearGenomeView',
                type: 'LinearGenomeView',
                loc: 'evm.model.jcf7180008075942.1:1-500',
                tracks: [
                    {
                        type: 'FeatureTrack',
                        configuration: 'cumin_gene_models',
                        displays: [
                            {
                                type: 'LinearBasicDisplay',
                                configuration: 'cumin_gene_models-LinearBasicDisplay'
                            }
                        ]
                    },
                    {
                        type: 'FeatureTrack',
                        configuration: 'cumin_ssrs',
                        displays: [
                            {
                                type: 'LinearBasicDisplay',
                                configuration: 'cumin_ssrs-LinearBasicDisplay'
                            }
                        ]
                    }
                ]
            }
        }
    });

    // Render JBrowse 2 component using React UMD
    ReactDOM.render(
        React.createElement(JBrowseLinearGenomeView, { viewState: jbrowseViewState }),
        container
    );
}

function loadBrowserContig() {
    const select = document.getElementById('browser-contig-select');
    if (!select || !select.value || !jbrowseViewState) return;
    
    const contigName = select.value;
    
    // Navigate JBrowse 2 to selected contig coordinate range (e.g. starting 1 to 2000 bp)
    try {
        jbrowseViewState.session.view.navToLoc(`${contigName}:1-500`);
    } catch (e) {
        console.warn('JBrowse navigation error:', e);
    }
}

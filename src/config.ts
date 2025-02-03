const proteinsApi = 'https://www.ebi.ac.uk/proteins/api/';
const alphafoldApi = 'https://alphafold.ebi.ac.uk/api/';
const alphafoldEntry = 'https://alphafold.ebi.ac.uk/entry/';
const interproApi = 'https://www.ebi.ac.uk/interpro/api/';

const proteinsApiServices = {
  proteins: `${proteinsApi}proteins/`,
  features: `${proteinsApi}features/`,
  variation: `${proteinsApi}variation/`,
  antigen: `${proteinsApi}antigen/`,
  epitope: `${proteinsApi}epitope/`,
  mutagenesis: `${proteinsApi}mutagenesis/`,
  nonPtm: `${proteinsApi}proteomics/nonPtm/`,
  ptm: `${proteinsApi}proteomics/ptm/`,
  hpp: `${proteinsApi}proteomics/hpp/`,
};

export type TrackType =
  | 'nightingale-track'
  | 'nightingale-interpro-track'
  | 'nightingale-colored-sequence'
  | 'nightingale-variation'
  | 'nightingale-linegraph-track'
  | 'nightingale-sequence-heatmap';

export type ProtvistaTrackConfig = {
  name: string;
  label?: string;
  labelUrl?: string;
  filter?: string;
  trackType: TrackType;
  data: {
    url: string | string[];
    adapter?:
      | 'feature-adapter'
      | 'structure-adapter'
      | 'proteomics-adapter'
      | 'variation-adapter'
      | 'variation-graph-adapter'
      | 'interpro-adapter'
      | 'alphafold-confidence-adapter'
      | 'alphamissense-pathogenicity-adapter'
      | 'alphamissense-heatmap-adapter'
      | 'proteomics-ptm-adapter'
      | 'rna-editing-adapter'
      | 'rna-editing-graph-adapter';
  }[];
  tooltip: string;
  color?: string;
  shape?: string; //TODO: eventually replace with list
  scale?: string;
  filterComponent?: 'nightingale-filter';
  'color-range'?: string;
};

type ProtvistaCategory = {
  name: string;
  label: string;
  trackType: TrackType;
  tracks: ProtvistaTrackConfig[];
  color?: string;
  shape?: string; //TODO: eventually replace with list
  scale?: string;
  'color-range'?: string;
};

export type ProtvistaConfig = {
  categories: ProtvistaCategory[];
};

const config: ProtvistaConfig = {
  categories: [
    {
      name: 'MOLECULE_PROCESSING',
      label: 'Molecule processing',
      trackType: 'nightingale-track',
      tracks: [
        {
          name: 'signal',
          label: 'Signal peptide',
          filter: 'SIGNAL',
          trackType: 'nightingale-track',
          data: [
            {
              adapter: 'feature-adapter',
              url: `${proteinsApiServices.features}{accession}`,
            },
          ],
          tooltip: 'N-terminal signal peptide',
        },
        {
          name: 'chain',
          label: 'Chain',
          filter: 'CHAIN',
          trackType: 'nightingale-track',
          data: [
            {
              adapter: 'feature-adapter',
              url: `${proteinsApiServices.features}{accession}`,
            },
          ],
          tooltip:
            '(aka mature region). This describes the extent of a polypeptide chain in the mature protein following processing',
        },
        {
          name: 'transit',
          label: 'Transit peptide',
          filter: 'TRANSIT',
          trackType: 'nightingale-track',
          data: [
            {
              adapter: 'feature-adapter',
              url: `${proteinsApiServices.features}{accession}`,
            },
          ],
          tooltip: 'This describes the extent of a transit peptide',
        },
        {
          name: 'init_met',
          label: 'Initiator methionine',
          filter: 'INIT_MET',
          trackType: 'nightingale-track',
          data: [
            {
              adapter: 'feature-adapter',
              url: `${proteinsApiServices.features}{accession}`,
            },
          ],

          tooltip:
            'This indicates that the initiator methionine is cleaved from the mature protein',
        },
        {
          name: 'propep',
          label: 'Propeptide',
          filter: 'PROPEP',
          trackType: 'nightingale-track',
          data: [
            {
              adapter: 'feature-adapter',
              url: `${proteinsApiServices.features}{accession}`,
            },
          ],
          tooltip:
            'Part of a protein that is cleaved during maturation or activation',
        },
        {
          name: 'peptide',
          label: 'Peptide',
          filter: 'PEPTIDE',
          trackType: 'nightingale-track',
          data: [
            {
              adapter: 'feature-adapter',
              url: `${proteinsApiServices.features}{accession}`,
            },
          ],
          tooltip:
            'The position and length of an active peptide in the mature protein',
        },
      ],
    },
    {
      name: 'SEQUENCE_INFORMATION',
      label: 'Sequence information',
      trackType: 'nightingale-track',
      tracks: [
        {
          name: 'compbias',
          label: 'Compositional bias',
          filter: 'COMPBIAS',
          trackType: 'nightingale-track',
          data: [
            {
              adapter: 'feature-adapter',
              url: `${proteinsApiServices.features}{accession}`,
            },
          ],
          tooltip:
            'Position of regions of compositional bias within the protein and the particular amino acids that are over-represented within those regions',
        },
        {
          name: 'conflict',
          label: 'Sequence conflict',
          filter: 'CONFLICT',
          trackType: 'nightingale-track',
          data: [
            {
              adapter: 'feature-adapter',
              url: `${proteinsApiServices.features}{accession}`,
            },
          ],
          tooltip: 'Sequence discrepancies of unknown origin',
        },
        {
          name: 'non_cons',
          filter: 'NON_CONS',
          trackType: 'nightingale-track',
          label: 'Non-adjacent residues',
          data: [
            {
              adapter: 'feature-adapter',
              url: `${proteinsApiServices.features}{accession}`,
            },
          ],
          tooltip:
            'Indicates that two residues in a sequence are not consecutive and that there is an undetermined number of unsequenced residues between them',
        },
        {
          name: 'non_ter',
          filter: 'NON_TER',
          trackType: 'nightingale-track',
          label: 'Non-terminal residue',
          data: [
            {
              adapter: 'feature-adapter',
              url: `${proteinsApiServices.features}{accession}`,
            },
          ],
          tooltip:
            'The sequence is incomplete. The residue is not the terminal residue of the complete protein',
        },
        {
          name: 'unsure',
          filter: 'UNSURE',
          trackType: 'nightingale-track',
          label: 'Sequence uncertainty',
          data: [
            {
              adapter: 'feature-adapter',
              url: `${proteinsApiServices.features}{accession}`,
            },
          ],
          tooltip:
            'Regions of a sequence for which the authors are unsure about the sequence assignment',
        },
        {
          name: 'non_std',
          filter: 'NON_STD',
          trackType: 'nightingale-track',
          label: 'Non-standard residue',
          data: [
            {
              adapter: 'feature-adapter',
              url: `${proteinsApiServices.features}{accession}`,
            },
          ],
          tooltip: 'Non-standard amino acids (selenocysteine and pyrrolysine)',
        },
      ],
    },
    {
      name: 'TOPOLOGY',
      label: 'Topology',
      trackType: 'nightingale-track',
      tracks: [
        {
          name: 'topo_dom',
          label: 'Topological domain',
          filter: 'TOPO_DOM',
          trackType: 'nightingale-track',
          data: [
            {
              adapter: 'feature-adapter',
              url: `${proteinsApiServices.features}{accession}`,
            },
          ],
          tooltip:
            'Location of non-membrane regions of membrane-spanning proteins',
        },
        {
          name: 'transmem',
          label: 'Transmembrane',
          filter: 'TRANSMEM',
          trackType: 'nightingale-track',
          data: [
            {
              adapter: 'feature-adapter',
              url: `${proteinsApiServices.features}{accession}`,
            },
          ],
          tooltip: 'Extent of a membrane-spanning region',
        },
        {
          name: 'intramem',
          label: 'Intramembrane',
          filter: 'INTRAMEM',
          trackType: 'nightingale-track',
          data: [
            {
              adapter: 'feature-adapter',
              url: `${proteinsApiServices.features}{accession}`,
            },
          ],
          tooltip:
            'Extent of a region located in a membrane without crossing it',
        },
      ],
    },
    {
      name: 'DOMAINS',
      label: 'Domains',
      trackType: 'nightingale-track',
      tracks: [
        {
          name: 'domain',
          label: 'Domain',
          filter: 'DOMAIN',
          trackType: 'nightingale-track',
          data: [
            {
              adapter: 'feature-adapter',
              url: `${proteinsApiServices.features}{accession}`,
            },
          ],
          tooltip:
            'Specific combination of secondary structures organized into a characteristic three-dimensional structure or fold',
        },
        {
          name: 'InterPro representative domain',
          label: 'InterPro Representative Domain',
          trackType: 'nightingale-track',
          data: [
            {
              adapter: 'interpro-adapter',
              url: `${interproApi}entry/all/protein/uniprot/{accession}?type=domain&page_size=100`,
            },
          ],
          tooltip: 'InterPro representative domains',
        },
        {
          name: 'region',
          label: 'Region',
          filter: 'REGION',
          trackType: 'nightingale-track',
          data: [
            {
              adapter: 'feature-adapter',
              url: `${proteinsApiServices.features}{accession}`,
            },
          ],
          tooltip:
            'Regions in multifunctional enzymes or fusion proteins, or characteristics of a region, e.g., protein-protein interactions mediation',
        },
        {
          name: 'repeat',
          label: 'Repeat',
          filter: 'REPEAT',
          trackType: 'nightingale-track',
          data: [
            {
              adapter: 'feature-adapter',
              url: `${proteinsApiServices.features}{accession}`,
            },
          ],
          tooltip:
            'Repeated sequence motifs or repeated domains within the protein',
        },
        {
          name: 'motif',
          label: 'Motif',
          filter: 'MOTIF',
          trackType: 'nightingale-track',
          data: [
            {
              adapter: 'feature-adapter',
              url: `${proteinsApiServices.features}{accession}`,
            },
          ],
          tooltip: 'Short conserved sequence motif of biological significance',
        },
        {
          name: 'zn_fing',
          label: 'Zinc finger',
          filter: 'ZN_FING',
          trackType: 'nightingale-track',
          data: [
            {
              adapter: 'feature-adapter',
              url: `${proteinsApiServices.features}{accession}`,
            },
          ],
          tooltip:
            'Small, functional, independently folded domain that coordinates one or more zinc ions',
        },
      ],
    },
    {
      name: 'SITES',
      label: 'Sites',
      trackType: 'nightingale-track',
      tracks: [
        {
          name: 'metal',
          label: 'Metal binding',
          filter: 'METAL',
          trackType: 'nightingale-track',
          data: [
            {
              adapter: 'feature-adapter',
              url: `${proteinsApiServices.features}{accession}`,
            },
          ],
          tooltip: 'Binding site for a metal ion',
        },
        {
          name: 'site',
          label: 'Site',
          filter: 'SITE',
          trackType: 'nightingale-track',
          data: [
            {
              adapter: 'feature-adapter',
              url: `${proteinsApiServices.features}{accession}`,
            },
          ],
          tooltip: 'Any interesting single amino acid site on the sequence',
        },
        {
          name: 'ca_bind',
          label: 'Calcium binding',
          filter: 'CA_BIND',
          trackType: 'nightingale-track',
          data: [
            {
              adapter: 'feature-adapter',
              url: `${proteinsApiServices.features}{accession}`,
            },
          ],
          tooltip: 'Calcium-binding regions, such as the EF-hand motif',
        },
        {
          name: 'dna_bind',
          label: 'DNA binding',
          filter: 'DNA_BIND',
          trackType: 'nightingale-track',
          data: [
            {
              adapter: 'feature-adapter',
              url: `${proteinsApiServices.features}{accession}`,
            },
          ],
          tooltip:
            'DNA-binding domains such as AP2/ERF domain, the ETS domain, the Fork-Head domain, the HMG box and the Myb domain',
        },
        {
          name: 'np_bind',
          label: 'Nucleotide binding',
          filter: 'NP_BIND',
          trackType: 'nightingale-track',
          data: [
            {
              adapter: 'feature-adapter',
              url: `${proteinsApiServices.features}{accession}`,
            },
          ],
          tooltip:
            '(aka flavin-binding). Region in the protein which binds nucleotide phosphates',
        },
        {
          name: 'binding',
          label: 'Binding site',
          filter: 'BINDING',
          trackType: 'nightingale-track',
          data: [
            {
              adapter: 'feature-adapter',
              url: `${proteinsApiServices.features}{accession}`,
            },
          ],
          tooltip:
            'Binding site for any chemical group (co-enzyme, prosthetic group, etc.)',
        },
        {
          name: 'act_site',
          label: 'Active site',
          filter: 'ACT_SITE',
          trackType: 'nightingale-track',
          data: [
            {
              adapter: 'feature-adapter',
              url: `${proteinsApiServices.features}{accession}`,
            },
          ],
          tooltip:
            'Amino acid(s) directly involved in the activity of an enzyme',
        },
      ],
    },
    {
      name: 'PTM',
      label: 'PTM',
      trackType: 'nightingale-track',
      tracks: [
        {
          name: 'mod_res',
          label: 'Modified residue',
          filter: 'MOD_RES',
          trackType: 'nightingale-track',
          data: [
            {
              adapter: 'feature-adapter',
              url: `${proteinsApiServices.features}{accession}`,
            },
          ],
          tooltip:
            'Modified residues such as phosphorylation, acetylation, acylation, methylation',
        },
        {
          name: 'mod_res_ls',
          label: 'Modified residue (large scale data)',
          filter: 'MOD_RES_LS',
          trackType: 'nightingale-track',
          data: [
            {
              adapter: 'proteomics-ptm-adapter',
              url: `${proteinsApiServices.ptm}{accession}`,
            },
          ],
          tooltip: 'Modified residues from Large scale studies',
        },
        {
          name: 'carbohyd',
          label: 'Glycosylation',
          filter: 'CARBOHYD',
          trackType: 'nightingale-track',
          data: [
            {
              adapter: 'feature-adapter',
              url: `${proteinsApiServices.features}{accession}`,
            },
          ],
          tooltip: 'Covalently attached glycan group(s)',
        },
        {
          name: 'disulfid',
          label: 'Disulfide bond',
          filter: 'DISULFID',
          trackType: 'nightingale-track',
          data: [
            {
              adapter: 'feature-adapter',
              url: `${proteinsApiServices.features}{accession}`,
            },
          ],
          tooltip:
            'The positions of cysteine residues participating in disulphide bonds',
        },
        {
          name: 'crosslnk',
          label: 'Cross-link',
          filter: 'CROSSLNK',
          trackType: 'nightingale-track',
          data: [
            {
              adapter: 'feature-adapter',
              url: `${proteinsApiServices.features}{accession}`,
            },
          ],
          tooltip:
            'Covalent linkages of various types formed between two proteins or between two parts of the same protein',
        },
        {
          name: 'lipid',
          label: 'Lipidation',
          filter: 'LIPID',
          trackType: 'nightingale-track',
          data: [
            {
              adapter: 'feature-adapter',
              url: `${proteinsApiServices.features}{accession}`,
            },
          ],
          tooltip: 'Covalently attached lipid group(s)',
        },
      ],
    },
    {
      name: 'EPITOPE',
      label: 'Epitopes',
      trackType: 'nightingale-track',
      tracks: [
        {
          name: 'epitope',
          label: 'Epitope',
          trackType: 'nightingale-track',
          data: [
            {
              adapter: 'feature-adapter',
              url: `${proteinsApiServices.epitope}{accession}`,
            },
          ],
          tooltip: '',
        },
      ],
    },
    {
      name: 'ANTIGEN',
      label: 'Antigenic sequences',
      trackType: 'nightingale-track',
      tracks: [
        {
          name: 'antigen',
          label: 'Antibody binding sequences',
          trackType: 'nightingale-track',
          data: [
            {
              adapter: 'feature-adapter',
              url: `${proteinsApiServices.antigen}{accession}`,
            },
          ],
          tooltip: '',
        },
      ],
    },
    {
      name: 'MUTAGENESIS',
      label: 'Mutagenesis',
      trackType: 'nightingale-track',
      tracks: [
        {
          name: 'mutagen',
          label: 'Mutagenesis',
          filter: 'MUTAGEN',
          trackType: 'nightingale-track',
          data: [
            {
              adapter: 'feature-adapter',
              url: `${proteinsApiServices.features}{accession}`,
            },
          ],
          tooltip: 'Site which has been experimentally altered by mutagenesis',
        },
        {
          name: 'othermutagen',
          label: 'Mutagenesis (large scale data)',
          trackType: 'nightingale-track',
          data: [
            {
              adapter: 'feature-adapter',
              url: `${proteinsApiServices.mutagenesis}{accession}`,
            },
          ],
          tooltip: 'Site which has been experimentally altered by mutagenesis',
        },
      ],
    },
    {
      name: 'VARIATION',
      label: 'Variants',
      trackType: 'nightingale-linegraph-track',
      tracks: [
        {
          name: 'variation_graph',
          label: 'Counts',
          trackType: 'nightingale-linegraph-track',
          data: [
            {
              adapter: 'variation-graph-adapter',
              url: `${proteinsApiServices.variation}{accession}`,
            },
          ],
          tooltip:
            'Natural variant of the protein, including polymorphisms, variations between strains, isolates or cultivars, disease-associated mutations and RNA editing events',
        },
        {
          name: 'variation',
          filterComponent: 'nightingale-filter',
          trackType: 'nightingale-variation',
          data: [
            {
              adapter: 'variation-adapter',
              url: `${proteinsApiServices.variation}{accession}`,
            },
          ],
          tooltip:
            'Natural variant of the protein, including polymorphisms, variations between strains, isolates or cultivars, disease-associated mutations and RNA editing events',
        },
      ],
    },
    {
      name: 'RNA_EDITING',
      label: 'RNA Editing',
      trackType: 'nightingale-linegraph-track',
      tracks: [
        {
          name: 'rna_editing_graph',
          label: 'Counts',
          trackType: 'nightingale-linegraph-track',
          data: [
            {
              adapter: 'rna-editing-graph-adapter',
              url: `${proteinsApi}rna-editing/{accession}`,
            },
          ],
          tooltip:
            'RNA editing events leading to one or more amino acid changes compared to the translation of the non-edited RNA version.',
        },
        {
          name: 'RNA Editing',
          trackType: 'nightingale-variation',
          data: [
            {
              adapter: 'rna-editing-adapter',
              url: `${proteinsApi}rna-editing/{accession}`,
            },
          ],
          tooltip:
            'RNA editing events leading to one or more amino acid changes compared to the translation of the non-edited RNA version.',
        },
      ],
    },
    {
      name: 'PROTEOMICS',
      label: 'Proteomics',
      trackType: 'nightingale-track',
      tracks: [
        {
          name: 'unique',
          label: 'Unique peptide',
          filter: 'unique',
          trackType: 'nightingale-track',
          data: [
            {
              adapter: 'proteomics-adapter',
              url: `${proteinsApiServices.nonPtm}{accession}`,
            },
          ],
          tooltip: '',
        },
        {
          name: 'non_unique',
          label: 'Non-unique peptide',
          filter: 'non_unique',
          trackType: 'nightingale-track',
          data: [
            {
              adapter: 'proteomics-adapter',
              url: `${proteinsApiServices.nonPtm}{accession}`,
            },
          ],
          tooltip: '',
        },
        {
          name: 'hpp',
          label: 'Human proteome project',
          trackType: 'nightingale-track',
          data: [
            {
              adapter: 'proteomics-adapter',
              url: `${proteinsApiServices.hpp}{accession}`,
            },
          ],
          tooltip: '',
        },
        {
          name: 'proteomics-ptm',
          label: 'PTM-containing peptide',
          trackType: 'nightingale-track',
          data: [
            {
              adapter: 'proteomics-adapter',
              url: `${proteinsApiServices.ptm}{accession}`,
            },
          ],
          tooltip: '',
        },
      ],
    },
    {
      name: 'STRUCTURE_COVERAGE',
      label: 'PDBe 3D structure coverage',
      trackType: 'nightingale-track',
      tracks: [
        {
          name: 'pdbe_cover',
          label: 'PDBe coverage',
          trackType: 'nightingale-track',
          tooltip: 'PDBe 3D structure coverage',
          data: [
            {
              adapter: 'structure-adapter',
              url: `${proteinsApiServices.proteins}{accession}`,
            },
          ],
        },
      ],
    },
    {
      name: 'ALPHAFOLD_CONFIDENCE',
      label: 'AlphaFold',
      trackType: 'nightingale-colored-sequence',
      scale: 'H:90,M:70,L:50,D:0',
      'color-range': '#ff7d45:0,#ffdb13:50,#65cbf3:70,#0053d6:90,#0053d6:100',
      tracks: [
        {
          name: 'alphafold_confidence',
          label: 'AlphaFold Confidence',
          labelUrl: `${alphafoldEntry}{accession}`,
          trackType: 'nightingale-colored-sequence',
          data: [
            {
              adapter: 'alphafold-confidence-adapter',
              url: [
                `${alphafoldApi}prediction/{accession}`,
                `${proteinsApiServices.proteins}{accession}`,
              ],
            },
          ],
          tooltip: 'AlphaFold prediction confidence',
        },
      ],
    },
    {
      name: 'ALPHAMISSENSE_PATHOGENICITY',
      label: 'AlphaMissense',
      trackType: 'nightingale-colored-sequence',
      scale: 'P:100,A:50,B:0',
      'color-range': '#9a131a:100,#a8a9ad:50,#3d5493:0',
      tracks: [
        {
          name: 'alphamissense_pathogenicity',
          label: 'Average Pathogenicity Score',
          trackType: 'nightingale-colored-sequence',
          data: [
            {
              adapter: 'alphamissense-pathogenicity-adapter',
              url: [
                `${alphafoldApi}prediction/{accession}`,
                `${proteinsApiServices.proteins}{accession}`,
              ],
            },
          ],
          tooltip: 'AlphaMissense pathogenicity',
        },
        {
          name: 'alphamissense_pathogenicity_heatmap',
          label: 'AlphaMissense Pathogenicity',
          labelUrl: 'https://alphafold.ebi.ac.uk/entry/{accession}',
          trackType: 'nightingale-sequence-heatmap',
          data: [
            {
              adapter: 'alphamissense-heatmap-adapter',
              url: [
                'https://alphafold.ebi.ac.uk/api/prediction/{accession}',
                `${proteinsApiServices.proteins}{accession}`,
              ],
            },
          ],
          tooltip: 'AlphaMissense pathogenicity',
        },
      ],
    },
    {
      name: 'STRUCTURAL',
      label: 'Structural features',
      trackType: 'nightingale-track',
      tracks: [
        {
          name: 'helix',
          label: 'Helix',
          filter: 'HELIX',
          trackType: 'nightingale-track',
          data: [
            {
              adapter: 'feature-adapter',
              url: `${proteinsApiServices.features}{accession}`,
            },
          ],
          tooltip: 'The positions of experimentally determined helical regions',
        },
        {
          name: 'strand',
          label: 'Beta strand',
          filter: 'STRAND',
          trackType: 'nightingale-track',
          data: [
            {
              adapter: 'feature-adapter',
              url: `${proteinsApiServices.features}{accession}`,
            },
          ],
          tooltip: 'The positions of experimentally determined beta strands',
        },
        {
          name: 'turn',
          label: 'Turn',
          filter: 'TURN',
          trackType: 'nightingale-track',
          data: [
            {
              adapter: 'feature-adapter',
              url: `${proteinsApiServices.features}{accession}`,
            },
          ],
          tooltip:
            'The positions of experimentally determined hydrogen-bonded turns',
        },
        {
          name: 'coiled',
          label: 'Coiled coil',
          filter: 'COILED',
          trackType: 'nightingale-track',
          data: [
            {
              adapter: 'feature-adapter',
              url: `${proteinsApiServices.features}{accession}`,
            },
          ],
          tooltip:
            'Coiled coils are built by two or more alpha-helices that wind around each other to form a supercoil',
        },
      ],
    },
  ],
};

export default config;

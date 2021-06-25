import { LitElement, html } from 'lit-element';
import { load } from 'data-loader';
import ProtvistaStructure from 'protvista-structure';
import ProtvistaDatatable from 'protvista-datatable';
import { loadComponent } from './loadComponents';

const PDBLinks = [
  { name: 'PDB', link: 'https://www.ebi.ac.uk/pdbe-srv/view/entry/' },
  { name: 'RCSB-PDB', link: 'https://www.rcsb.org/structure/' },
  { name: 'PDBj', link: 'https://pdbj.org/mine/summary/' },
  { name: 'PDBsum', link: 'https://www.ebi.ac.uk/pdbsum/' },
];

type StructureData = {
  dbReferences: {
    type: 'PDB' | string;
    id: string;
    properties: {
      method: string;
      chains: string;
      resolution: string;
    };
  }[];
};

type ProcessedStructureData = {
  id: string;
  source: 'PDB' | 'AlphaFold';
  method: string;
  resolution?: string;
  chain?: string;
  positions?: string;
  protvistaFeatureId: string;
};

type PredictionData = {
  entryId: string;
  gene?: string;
  uniprotAccession?: string;
  uniprotId?: string;
  uniprotDescription?: string;
  taxId?: number;
  organismScientificName?: string;
  uniprotStart?: number;
  uniprotEnd?: number;
  uniprotSequence?: string;
  modelCreatedDate?: string;
  latestVersion?: number;
  allVersions?: number[];
  bcifUrl?: string;
  cifUrl?: string;
  pdbUrl?: string;
  distogramUrl?: string;
};

const processPDBData = (data: StructureData): ProcessedStructureData[] =>
  data.dbReferences
    .filter((xref) => xref.type === 'PDB')
    .sort((refA, refB) => refA.id.localeCompare(refB.id))
    .map(({ id, properties }) => {
      if (!properties) {
        return;
      }
      const { chains, resolution, method } = properties;

      let chain;
      let positions;
      if (chains) {
        const tokens = chains.split('=');
        if (tokens.length === 2) {
          [chain, positions] = tokens;
        }
      }
      const output: ProcessedStructureData = {
        id,
        source: 'PDB',
        method,
        resolution: !resolution || resolution === '-' ? undefined : resolution,
        chain,
        positions,
        protvistaFeatureId: id,
      };
      return output;
    })
    .filter(
      (
        transformedItem: ProcessedStructureData | undefined
      ): transformedItem is ProcessedStructureData =>
        transformedItem !== undefined
    );

const processAFData = (data: PredictionData[]): ProcessedStructureData[] =>
  data.map((d) => ({
    id: d.entryId,
    source: 'AlphaFold',
    method: 'Predicted',
    protvistaFeatureId: d.entryId,
  }));

const getColumnConfig = (): ColumnConfig<ProcessedStructureData> => ({
  source: {
    label: 'Source',
    resolver: ({ source }) => source,
  },
  type: {
    label: 'Identifier',
    resolver: ({ id }) => id,
  },
  method: {
    label: 'Method',
    resolver: ({ method }) => method,
  },
  resolution: {
    label: 'Resolution',
    resolver: ({ resolution }) =>
      resolution ? resolution.replace('A', 'Å') : '',
  },
  chain: {
    label: 'Chain',
    resolver: ({ chain }) => chain || '',
  },
  positions: {
    label: 'Positions',
    resolver: ({ positions }) => positions || '',
  },
  links: {
    label: 'Links',
    resolver: ({ id }) =>
      html`
        ${PDBLinks.map((pdbLink) => {
          return html` <a href="${pdbLink.link}${id}">${pdbLink.name}</a> `;
        }).reduce((prev, curr) => html` ${prev} · ${curr} `)}
      `,
  },
});

class ProtvistaUniprotStructure extends LitElement {
  accession?: string;
  data?: ProcessedStructureData[];
  pdbId?: string;

  constructor() {
    super();
    loadComponent('protvista-structure', ProtvistaStructure);
    loadComponent('protvista-datatable', ProtvistaDatatable);
    this.onTableRowClick = this.onTableRowClick.bind(this);
  }

  static get properties() {
    return {
      accession: { type: String },
      pdbId: { type: String },
      data: { type: Object },
    };
  }

  async connectedCallback() {
    super.connectedCallback();
    if (!this.accession) return;
    // https://www.ebi.ac.uk/pdbe/api/mappings/best_structures/${this.accession}
    const pdbUrl = `https://www.ebi.ac.uk/proteins/api/proteins/${this.accession}`;
    const alphaFoldURl = `https://test.alphafold.ebi.ac.uk/api/prediction/${this.accession}?key=AIzaSyCeurAJz7ZGjPQUtEaerUkBZ3TaBkXrY94`;

    const rawData: { [key: string]: any } = [];

    await Promise.all(
      [pdbUrl, alphaFoldURl].map((url: string) =>
        load(url).then(
          (data) => (rawData[url] = data.payload),
          // TODO handle this better based on error code
          // Fail silently for now
          (error) => console.warn(error)
        )
      )
    );

    // TODO: return if no data at all
    // if (!payload) return;
    const pdbData = processPDBData(rawData[pdbUrl] || []);
    const afData = processAFData(rawData[alphaFoldURl] || []);
    const data = [...pdbData, ...afData];
    if (!data || !data.length) return;
    this.data = data;
    const protvistaDatatableElt = this.querySelector(
      'protvista-datatable'
    ) as ProtvistaDatatable;
    // Select the first element in the table
    this.pdbId = this.data[0].id;
    protvistaDatatableElt.columns = getColumnConfig();
    protvistaDatatableElt.data = this.data;
    protvistaDatatableElt.rowClickEvent = this.onTableRowClick;
    protvistaDatatableElt.selectedid = this.pdbId;
  }

  onTableRowClick({ id }: { id: string }) {
    this.pdbId = id;
  }

  /**
   * we need to use the light DOM.
   * */
  createRenderRoot() {
    return this;
  }

  render() {
    return html`
      <div>
        ${this.pdbId
          ? html`<protvista-structure
              pdb-id=${this.pdbId}
              accession=${this.accession}
            ></protvista-structure>`
          : html``}
        <protvista-datatable noScrollToRow noDeselect></protvista-datatable>
      </div>
    `;
  }
}

export default ProtvistaUniprotStructure;

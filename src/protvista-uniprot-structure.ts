import { LitElement, html, svg } from 'lit-element';
import { unsafeHTML } from 'lit-html/directives/unsafe-html.js';
import { load } from 'data-loader';
import ProtvistaStructure from 'protvista-structure';
import ProtvistaDatatable from 'protvista-datatable';
import { loadComponent } from './loadComponents';

import loaderIcon from './icons/spinner.svg';
import loaderStyles from './styles/loader-styles';

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
  method: string;
  resolution?: string;
  chain?: string;
  positions?: string;
  protvistaFeatureId: string;
};

const processData = (data: StructureData): ProcessedStructureData[] =>
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

const getColumnConfig = (): ColumnConfig<ProcessedStructureData> => ({
  type: {
    label: 'PDB Entry',
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

const styleId = 'protvista-styles';

class ProtvistaUniprotStructure extends LitElement {
  private loading?: boolean;
  private accession?: string;
  private data?: ProcessedStructureData[];
  private pdbId?: string;

  constructor() {
    super();
    loadComponent('protvista-structure', ProtvistaStructure);
    loadComponent('protvista-datatable', ProtvistaDatatable);
    this.loading = true;
    this.onTableRowClick = this.onTableRowClick.bind(this);
    this.addStyles();
  }

  static get properties() {
    return {
      accession: { type: String },
      pdbId: { type: String },
      data: { type: Object },
      loading: { type: Boolean },
    };
  }

  async connectedCallback() {
    super.connectedCallback();
    if (!this.accession) return;
    const url = `https://www.ebi.ac.uk/proteins/api/proteins/${this.accession}`;
    const { payload } = await load(url);
    this.loading = false;
    if (!payload) return;
    const data = processData(payload);
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

  disconnectedCallback() {
    this.removeStyles();
  }

  addStyles() {
    // We are not using static get styles()
    // as we are not using the shadowDOM
    // because of Mol*
    if (!document.getElementById(styleId)) {
      const styleTag = document.createElement('style');
      styleTag.id = styleId;
      styleTag.innerHTML = loaderStyles.toString();
      document.querySelector('head')?.append(styleTag);
    }
  }

  removeStyles() {
    const styleTag = document.getElementById(styleId);
    if (styleTag) {
      styleTag.remove();
    }
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
        ${this.loading
          ? html`<div class="protvista-loader">
              ${svg`${unsafeHTML(loaderIcon)}`}
            </div>`
          : html``}
        ${!this.data && !this.loading
          ? html`<div class="protvista-no-results">
              No structure information available for ${this.accession}
            </div>`
          : html``}
        <protvista-datatable noScrollToRow noDeselect></protvista-datatable>
      </div>
    `;
  }
}

export default ProtvistaUniprotStructure;

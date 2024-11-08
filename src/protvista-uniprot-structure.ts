import { LitElement, html, svg, TemplateResult, css } from 'lit';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { customElement } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import NightingaleStructure, {
  PredictionData,
  StructureData,
} from '@nightingale-elements/nightingale-structure';
import ProtvistaDatatable from 'protvista-datatable';
import { loadComponent } from './utils';

import loaderIcon from './icons/spinner.svg';
import downloadIcon from './icons/download.svg';
import loaderStyles from './styles/loader-styles';

const PDBLinks = [
  { name: 'PDBe', link: 'https://www.ebi.ac.uk/pdbe-srv/view/entry/' },
  { name: 'RCSB-PDB', link: 'https://www.rcsb.org/structure/' },
  { name: 'PDBj', link: 'https://pdbj.org/mine/summary/' },
  { name: 'PDBsum', link: 'https://www.ebi.ac.uk/pdbsum/' },
];
const alphaFoldLink = 'https://alphafold.ebi.ac.uk/entry/';
const foldseekLink = `https://search.foldseek.com/search`;

type ProcessedStructureData = {
  id: string;
  source: 'PDB' | 'AlphaFold';
  method: string;
  resolution?: string;
  chain?: string;
  positions?: string;
  downloadLink?: string;
  protvistaFeatureId: string;
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
        downloadLink: `https://www.ebi.ac.uk/pdbe/entry-files/download/pdb${id.toLowerCase()}.ent`,
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
    positions: `${d.uniprotStart}-${d.uniprotEnd}`,
    protvistaFeatureId: d.entryId,
    downloadLink: d.pdbUrl,
  }));

const AFMetaInfo = html`
  <strong>Model Confidence:</strong>
  <ul class="no-bullet">
    <li>
      <span class="af-legend" style="background-color: rgb(0, 83, 214)"></span>
      Very high (pLDDT > 90)
    </li>
    <li>
      <span
        class="af-legend"
        style="background-color: rgb(101, 203, 243)"
      ></span>
      Confident (90 > pLDDT > 70)
    </li>
    <li>
      <span class="af-legend" style="background-color:rgb(255, 219, 19)"></span>
      Low (70 > pLDDT > 50)
    </li>
    <li>
      <span class="af-legend" style="background-color:rgb(255, 125, 69)"></span>
      Very low (pLDDT < 50)
    </li>
  </ul>
  <p class="small">
    AlphaFold produces a per-residue confidence score (pLDDT) between 0 and 100.
    Some regions with low pLDDT may be unstructured in isolation.
  </p>
`;

const AMMetaInfo = html`<strong>Model Pathogenicity:</strong>
  <ul class="no-bullet">
    <li>
      <span class="af-legend" style="background-color: rgb(154, 19, 26)"></span>
      Likely pathogenic (score > 0.564)
    </li>
    <li>
      <span
        class="af-legend"
        style="background-color: rgb(168, 169, 173)"
      ></span>
      Uncertain (0.564 >= score >= 0.34)
    </li>
    <li>
      <span class="af-legend" style="background-color: rgb(61, 84, 147)"></span>
      Likely benign (score < 0.34)
    </li>
  </ul>
  <p class="small">
    The displayed colour for each residue is the average AlphaMissense
    pathogenicity score across all possible amino acid substitutions at that
    position.
  </p>`;

const foldseekURL = (accession, sourceDB) => {
  return html`<a
    href="${foldseekLink}?accession=${accession}&source=${sourceDB}"
    >Foldseek</a
  >`;
};

const styleId = 'protvista-styles';

@customElement('protvista-uniprot-structure')
class ProtvistaUniprotStructure extends LitElement {
  accession?: string;
  data?: ProcessedStructureData[];
  structureId?: string;
  metaInfo?: TemplateResult;
  colorTheme?: string;
  private loading?: boolean;

  constructor() {
    super();
    loadComponent('nightingale-structure', NightingaleStructure);
    loadComponent('protvista-datatable', ProtvistaDatatable);
    this.loading = true;
    this.onTableRowClick = this.onTableRowClick.bind(this);
    this.addStyles();
    this.colorTheme = 'alphafold';
  }

  static get properties() {
    return {
      accession: { type: String },
      structureId: { type: String },
      data: { type: Object },
      loading: { type: Boolean },
      colorTheme: { type: String },
    };
  }

  async connectedCallback() {
    super.connectedCallback();
    if (!this.accession) return;
    // https://www.ebi.ac.uk/pdbe/api/mappings/best_structures/${this.accession}
    const pdbUrl = `https://www.ebi.ac.uk/proteins/api/proteins/${this.accession}`;
    const alphaFoldURl = `https://alphafold.ebi.ac.uk/api/prediction/${this.accession}`;

    const rawData = Object.fromEntries(
      await Promise.all(
        [pdbUrl, alphaFoldURl].map(async (url) => {
          const response = await fetch(url);
          if (!response.ok) {
            // TODO handle this better based on error code
            // Fail silently for now
            console.warn(`HTTP error status: ${response.status} at ${url}`);
            return [url, null];
          }
          return [url, await response.json()];
        })
      )
    );

    console.log(rawData);

    this.loading = false;
    // TODO: return if no data at all
    // if (!payload) return;
    const pdbData = processPDBData(rawData[pdbUrl] || []);
    const afData = processAFData(rawData[alphaFoldURl] || []);
    const data = [...pdbData, ...afData];
    if (!data || !data.length) return;

    this.data = data;
  }

  disconnectedCallback() {
    this.removeStyles();
  }

  updated() {
    const protvistaDatatableElt = this.querySelector(
      'protvista-datatable'
    ) as ProtvistaDatatable;
    if (!protvistaDatatableElt?.selectedid && this.data?.[0]) {
      // Select the first element in the table
      this.onTableRowClick({ id: this.data[0].id });
      protvistaDatatableElt.selectedid = this.structureId;
    }
  }

  addStyles() {
    // We are not using static get styles()
    // as we are not using the shadowDOM
    // because of Mol*
    if (!document.getElementById(styleId)) {
      const styleTag = document.createElement('style');
      styleTag.id = styleId;
      styleTag.innerHTML = `
      ${loaderStyles.toString()}
      ${this.cssStyle}
      `;
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
    this.structureId = id;
    if (this.structureId.startsWith('AF-')) {
      this.metaInfo = AFMetaInfo;
    } else {
      this.metaInfo = undefined;
    }
  }

  get cssStyle() {
    return css`
      .protvista-uniprot-structure {
        line-height: normal;
      }
      .theme-selection {
        padding-bottom: 1rem;
      }
      .protvista-uniprot-structure__structure {
        display: flex;
      }
      .protvista-uniprot-structure__meta {
        flex: 1;
        padding: 1rem;
      }
      .protvista-uniprot-structure__structure nightingale-structure {
        z-index: 40000;
        width: 100%;
        flex: 4;
      }
      .protvista-uniprot-structure__meta .small {
        font-size: 0.75rem;
      }
      .protvista-uniprot-structure__meta .no-bullet {
        list-style: none;
        padding: 0;
        margin: 0;
      }
      .protvista-uniprot-structure__meta .no-bullet li {
        padding: 0;
        margin: 0.5rem 0;
      }
      .protvista-uniprot-structure__meta .af-legend::before {
        content: '';
        margin: 0;
        display: inline-block;
        width: 20px;
        height: 16px;
      }
      .download-link svg {
        width: 1rem;
      }
    `;
  }

  /**
   * we need to use the light DOM.
   * */
  createRenderRoot() {
    return this;
  }

  toggleColorTheme(e) {
    this.colorTheme = e.target.value;
    if (e.target.value === 'alphafold') {
      this.metaInfo = AFMetaInfo;
    } else {
      this.metaInfo = AMMetaInfo;
    }
  }

  render() {
    return html`
      <div class="protvista-uniprot-structure">
        <div class="protvista-uniprot-structure__structure">
          ${this.metaInfo
            ? html` <div class="protvista-uniprot-structure__meta">
                <div class="theme-selection">
                  Select color scale <br />
                  <input
                    type="radio"
                    id="alphafold"
                    name="colorScheme"
                    value="alphafold"
                    @click=${(e) => this.toggleColorTheme(e)}
                    checked
                  />
                  <label for="alphafold">Confidence</label><br />
                  <input
                    type="radio"
                    id="alphamissense"
                    name="colorScheme"
                    value="alphamissense"
                    @click=${(e) => this.toggleColorTheme(e)}
                  />
                  <label for="alphamissense">Pathogenecity</label><br />
                </div>
                ${this.metaInfo}
              </div>`
            : html``}
          ${this.structureId
            ? html`<nightingale-structure
                structure-id=${this.structureId}
                protein-accession=${this.accession}
                color-theme=${this.colorTheme}
              ></nightingale-structure>`
            : html``}
        </div>
        <div class="protvista-uniprot-structure__table">
          ${this.data && this.data.length
            ? html`<protvista-datatable noScrollToRow noDeselect filter-scroll>
                <table>
                  <thead>
                    <tr>
                      <th data-filter="source">Source</th>
                      <th>Identifier</th>
                      <th data-filter="method">Method</th>
                      <th>Resolution</th>
                      <th>Chain</th>
                      <th>Positions</th>
                      <th>Links</th>
                      <th><!--Download--></th>
                    </tr>
                  </thead>
                  <tbody>
                    ${this.data?.map(
                      ({
                        source,
                        id,
                        method,
                        resolution,
                        chain,
                        positions,
                        downloadLink,
                      }) => html`<tr
                        data-id="${id}"
                        @click="${() => this.onTableRowClick({ id })}"
                      >
                        <td data-filter="source" data-filter-value="${source}">
                          <strong>${source}</strong>
                        </td>
                        <td>${id}</td>
                        <td data-filter="method" data-filter-value="${method}">
                          ${method}
                        </td>
                        <td>
                          ${resolution ? resolution.replace('A', 'Å') : ''}
                        </td>
                        <td>${chain || ''}</td>
                        <td>${positions || ''}</td>
                        <td>
                          ${source === 'PDB'
                            ? html`
                                ${PDBLinks.map((pdbLink) => {
                                  return html`
                                    <a href="${pdbLink.link}${id}"
                                      >${pdbLink.name}</a
                                    >
                                  `;
                                }).reduce(
                                  (prev, curr) => html` ${prev} · ${curr} `
                                )}
                              `
                            : html`<a href="${alphaFoldLink}${this.accession}"
                                >AlphaFold</a
                              >`}
                        </td>
                        <td>
                          ${downloadLink
                            ? html`<a
                                  href="${downloadLink}"
                                  class="download-link"
                                  >${svg`${unsafeHTML(downloadIcon)}`}</a
                                >
                                ·
                                ${foldseekURL(
                                  source === 'PDB' ? id : this.accession,
                                  source === 'PDB' ? 'PDB' : 'AlphaFoldDB'
                                )}`
                            : ''}
                        </td>
                      </tr>`
                    )}
                  </tbody>
                </table>
              </protvista-datatable>`
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
        </div>
      </div>
    `;
  }
}

export default ProtvistaUniprotStructure;

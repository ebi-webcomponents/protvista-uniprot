import { LitElement, html, svg, TemplateResult, css, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import NightingaleStructure, {
  AlphaFoldPayload,
} from '@nightingale-elements/nightingale-structure';
import ProtvistaDatatable from 'protvista-datatable';
import { fetchAll, loadComponent } from './utils';

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
const uniprotKBLink = 'https://www.uniprot.org/uniprotkb/';

// Excluded sources from 3d-beacons are PDBe and AlphaFold models as we fetch them separately from their respective API's
const providersFrom3DBeacons = [
  'SWISS-MODEL',
  'ModelArchive',
  'PED',
  'SASBDB',
  'isoform.io',
  'AlphaFill',
  'HEGELAB',
  'levylab',
];

const sourceMethods = new Map([
  ['AlphaFold DB', 'Predicted'],
  ['SWISS-MODEL', 'Modeling'],
  ['ModelArchive', 'Modeling'],
  ['PED', 'Modeling'],
  ['SASBDB', 'SAS'],
  ['isoform.io', 'Predicted'],
  ['AlphaFill', 'Predicted'],
  ['HEGELAB', 'Modeling'],
  ['levylab', 'Modeling'],
]);

type UniProtKBData = {
  uniProtKBCrossReferences: UniProtKBCrossReference[];
  sequence: Sequence;
};

type UniProtKBCrossReference = {
  database: string;
  id: string;
  properties: Record<string, string>[];
};

type Sequence = {
  value: string;
  length: number;
  molWeight: number;
  crc64: string;
  md5: string;
};

type BeaconsData = {
  uniprot_entry?: {
    ac: string;
    id: string;
    uniprot_checksum: string;
    sequence_length: number;
    segment_start: number;
    segment_end: number;
  };
  entry?: {
    sequence: string;
    checksum: string;
    checksum_type: string;
  };
  structures: {
    summary: {
      model_identifier: string;
      model_category: string;
      model_url: string;
      model_format: string;
      model_type: string | null;
      model_page_url: string;
      provider: string;
      number_of_conformers: number | null;
      ensemble_sample_url: string | null;
      ensemble_sample_format: string | null;
      created: string;
      sequence_identity: number;
      uniprot_start: number;
      uniprot_end: number;
      coverage: number;
      experimental_method: string | null;
      resolution: number | null;
      confidence_type: string;
      confidence_version: string | null;
      confidence_avg_local_score: number;
      oligomeric_state: string | null;
      preferred_assembly_id: string | null;
      entities: {
        entity_type: string;
        entity_poly_type: string;
        identifier: string;
        identifier_category: string;
        description: string;
        chain_ids: string[];
      }[];
    };
  }[];
};

type ProcessedStructureData = {
  id: string;
  source: string;
  method?: string;
  resolution?: string;
  chain?: string;
  positions?: string;
  downloadLink?: string;
  sourceDBLink?: string;
  protvistaFeatureId: string;
  amAnnotationsUrl?: string;
  isoform?: TemplateResult;
};

type IsoformIdSequence = [
  {
    isoformId: string;
    sequence: string;
  }
];

const getIsoformNum = (s) => {
  const match = s.match(/-(\d+)-F1$/);
  return match ? Number(match[1]) : 0;
};

const processPDBData = (data: UniProtKBData): ProcessedStructureData[] =>
  data.uniProtKBCrossReferences
    ? data.uniProtKBCrossReferences
        .filter((xref) => xref.database === 'PDB')
        .sort((refA, refB) => refA.id.localeCompare(refB.id))
        .map(({ id, properties }) => {
          if (!properties) {
            return;
          }

          const propertyMap = properties.reduce((acc, item) => {
            acc[item.key] = item.value;
            return acc;
          }, {} as Record<string, string>);

          const method = propertyMap['Method'];
          const resolution = propertyMap['Resolution'];
          const chains = propertyMap['Chains'];

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
            resolution:
              !resolution || resolution === '-' ? undefined : resolution,
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
        )
    : [];

const processAFData = (
  data: AlphaFoldPayload,
  accession?: string,
  isoforms?: IsoformIdSequence
): ProcessedStructureData[] =>
  data
    .map((d) => {
      const isoformMatch = isoforms?.find(
        ({ sequence }) => d.sequence === sequence
      );
      const isoformElement = isoformMatch
        ? html`<a
            href="${uniprotKBLink}${accession}/entry/#${isoformMatch.isoformId}"
            >${isoformMatch.isoformId}</a
          >`
        : null;
      return {
        id: d.modelEntityId,
        source: 'AlphaFold',
        method: 'Predicted',
        positions: `${d.sequenceStart}-${d.sequenceEnd}`,
        protvistaFeatureId: d.modelEntityId,
        downloadLink: d.pdbUrl,
        amAnnotationsUrl: d.amAnnotationsUrl,
        isoform: isoformElement,
      };
    })
    .sort((a, b) => {
      return getIsoformNum(a.id) - getIsoformNum(b.id);
    });

const process3DBeaconsData = (
  data: BeaconsData,
  accession: string | undefined,
  checksum: string | undefined
): ProcessedStructureData[] => {
  // If accession is provided without checksum, filter by whitelisted providers
  const filterByProviders = !!accession && !checksum;

  let structures = filterByProviders
    ? data?.structures?.filter(({ summary }) =>
        providersFrom3DBeacons.includes(summary.provider)
      )
    : data?.structures?.sort(
        (a, b) =>
          b.summary.confidence_avg_local_score -
          a.summary.confidence_avg_local_score
      );

  if (accession && checksum && structures) {
    const matchIndex = structures.findIndex(({ summary }) =>
      summary.model_identifier.includes(accession)
    );

    if (matchIndex !== -1) {
      structures = [
        structures[matchIndex],
        ...structures.slice(0, matchIndex),
        ...structures.slice(matchIndex + 1),
      ];
    }
  }

  return (
    structures?.map(({ summary }) => ({
      id: summary.model_identifier,
      source: summary.provider,
      method: sourceMethods.get(summary.provider),
      positions: `${summary.uniprot_start || 1}-${
        summary.uniprot_end || data.entry?.sequence.length
      }`,
      protvistaFeatureId: summary.model_identifier,
      downloadLink: summary.model_url,
      sourceDBLink:
        summary.provider === 'isoform.io'
          ? 'https://www.isoform.io/home'
          : summary.model_page_url,
      chain:
        summary.entities?.flatMap((entity) => entity.chain_ids).join(', ') ||
        undefined,
    })) || []
  );
};

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
  sequence?: string;
  checksum?: string;
  data?: ProcessedStructureData[];
  structureId?: string;
  metaInfo?: TemplateResult;
  colorTheme?: string;
  isoforms?: IsoformIdSequence;
  private loading?: boolean;
  private alphamissenseAvailable?: boolean;

  @state()
  private modelUrl = '';

  constructor() {
    super();
    loadComponent('nightingale-structure', NightingaleStructure);
    loadComponent('protvista-datatable', ProtvistaDatatable);
    this.loading = true;
    this.onTableRowClick = this.onTableRowClick.bind(this);
    this.addStyles();
    this.colorTheme = 'alphafold';
    this.alphamissenseAvailable = false;
  }

  static get properties() {
    return {
      accession: { type: String },
      structureId: { type: String },
      checksum: { type: String },
      sequence: { type: String },
      data: { type: Object },
      loading: { type: Boolean },
      colorTheme: { type: String },
      alphamissenseAvailable: { type: Boolean },
      isoforms: { type: Object, attribute: false },
    };
  }

  async connectedCallback() {
    super.connectedCallback();
    if (!this.accession && !this.checksum) return;

    // We are showing PDBe models returned by UniProt's API as there is inconsistency between UniProt's recognised ones and 3d-beacons.
    const pdbUrl =
      this.accession && !this.checksum
        ? `https://rest.uniprot.org/uniprotkb/${this.accession}`
        : '';
    // AlphaMissense predictions are only available in AF predictions endpoint
    const alphaFoldUrl =
      this.accession && !this.checksum
        ? `https://alphafold.ebi.ac.uk/api/prediction/${this.accession}`
        : '';
    // exclude_provider accepts only value hence 'pdbe' as majority of the models are from there if querying by accession
    const beaconsUrl =
      this.accession && !this.checksum
        ? `https://www.ebi.ac.uk/pdbe/pdbe-kb/3dbeacons/api/uniprot/summary/${this.accession}.json?exclude_provider=pdbe`
        : `https://www.ebi.ac.uk/pdbe/pdbe-kb/3dbeacons/api/v2/sequence/?id=${this.checksum}&type=md5`;

    const rawData = await fetchAll([pdbUrl, alphaFoldUrl, beaconsUrl]);
    this.loading = false;

    const pdbData = processPDBData(rawData[pdbUrl] || []);
    let afData = [];

    if (this.isoforms && rawData[alphaFoldUrl]?.length) {
      // Include isoforms that are provided in the UniProt isoforms mapping and ignore the rest from AF payload that are out of sync with UniProt
      const alphaFoldSequenceMatches = rawData[alphaFoldUrl]?.filter(
        ({ sequence: afSequence }) =>
          this.isoforms?.some(({ sequence }) => afSequence === sequence) ||
          rawData[pdbUrl]?.sequence?.value === afSequence
      );

      afData = processAFData(
        alphaFoldSequenceMatches,
        this.accession,
        this.isoforms
      );

      this.alphamissenseAvailable = !!afData?.[0].amAnnotationsUrl;
    } else {
      // Check if AF sequence matches UniProt sequence
      const alphaFoldSequenceMatch = rawData[alphaFoldUrl]?.filter(
        ({ sequence: afSequence }) =>
          rawData[pdbUrl]?.sequence?.value === afSequence ||
          this.sequence === afSequence
      );
      if (alphaFoldSequenceMatch?.length) {
        afData = processAFData(alphaFoldSequenceMatch);
        this.alphamissenseAvailable = alphaFoldSequenceMatch.some(
          (data) => data.amAnnotationsUrl
        );
      }
    }

    const beaconsData = process3DBeaconsData(
      rawData[beaconsUrl] || [],
      this.accession,
      this.checksum
    );

    // TODO: return if no data at all
    // if (!payload) return;

    const data = [...pdbData, ...afData, ...beaconsData];
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
      this.onTableRowClick({
        id: this.data[0].id,
        source: this.data[0].source,
        downloadLink: this.data[0].downloadLink,
      });
      protvistaDatatableElt.selectedid = this.data[0].id;
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

  onTableRowClick({
    id,
    source,
    downloadLink,
    amAnnotationsUrl,
  }: {
    id: string;
    source?: string;
    downloadLink?: string;
    amAnnotationsUrl?: string;
  }) {
    if (this.checksum || providersFrom3DBeacons.includes(source)) {
      this.modelUrl = downloadLink;
      // Reset the rest
      this.structureId = undefined;
      this.metaInfo = undefined;
      this.colorTheme = 'alphafold';
      if (source === 'AlphaFold DB') {
        this.metaInfo = AFMetaInfo;
      }
    } else {
      this.structureId = id;
      this.modelUrl = undefined;
      if (this.structureId.startsWith('AF-')) {
        this.metaInfo = AFMetaInfo;
        this.alphamissenseAvailable = !!amAnnotationsUrl;
      } else {
        this.metaInfo = undefined;
      }
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
      .am-disabled * {
        cursor: not-allowed;
        color: #808080;
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
                  Select color scale
                  <div>
                    <input
                      type="radio"
                      id="alphafold"
                      name="colorScheme"
                      value="alphafold"
                      @click=${(e) => this.toggleColorTheme(e)}
                      checked
                    />
                    <label for="alphafold">Confidence</label>
                  </div>
                  <div
                    class=${this.alphamissenseAvailable ? '' : 'am-disabled'}
                  >
                    <input
                      type="radio"
                      id="alphamissense"
                      name="colorScheme"
                      value="alphamissense"
                      @click=${(e) => this.toggleColorTheme(e)}
                      disabled=${this.alphamissenseAvailable ? nothing : 'true'}
                    />
                    <label
                      for="alphamissense"
                      title=${this.alphamissenseAvailable
                        ? ''
                        : 'Color by pathogenicity is disabled as there are no AlphaMissense predictions available for this model'}
                      >Pathogenicity
                      ${this.alphamissenseAvailable
                        ? ''
                        : ' (unavailable)'}</label
                    >
                  </div>
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
          ${this.modelUrl
            ? html`<nightingale-structure
                model-url=${this.modelUrl}
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
                      ${this.isoforms ? html`<th>Isoform</th>` : ''}
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
                        sourceDBLink,
                        isoform,
                        amAnnotationsUrl,
                      }) => html`<tr
                        data-id="${id}"
                        @click="${() =>
                          this.onTableRowClick({
                            id,
                            source,
                            downloadLink,
                            amAnnotationsUrl,
                          })}"
                      >
                        <td data-filter="source" data-filter-value="${source}">
                          <strong>${source}</strong>
                        </td>
                        <td>${id}</td>
                        ${this.isoforms ? html`<td>${isoform}</td>` : ''}
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
                            : ``}
                          ${source === 'AlphaFold'
                            ? html`<a href="${alphaFoldLink}${this.accession}"
                                >AlphaFold</a
                              >`
                            : ``}
                          ${sourceDBLink
                            ? html`<a href="${sourceDBLink}">${source}</a>`
                            : ``}
                        </td>
                        <td>
                          ${downloadLink
                            ? html`<a
                                href="${downloadLink}"
                                class="download-link"
                                >${svg`${unsafeHTML(downloadIcon)}`}</a
                              > `
                            : ''}
                          ${source === 'PDB' || source === 'AlphaFold'
                            ? html`·
                              ${foldseekURL(
                                source === 'PDB' ? id : this.accession,
                                source === 'PDB' ? 'PDB' : 'AlphaFoldDB'
                              )}`
                            : ``}
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
                No structure information available
                ${this.accession ? `for ${this.accession}` : ''}
              </div>`
            : html``}
        </div>
      </div>
    `;
  }
}

export default ProtvistaUniprotStructure;

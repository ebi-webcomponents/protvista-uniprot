import { LitElement, html, svg } from 'lit-element';
import { unsafeHTML } from 'lit-html/directives/unsafe-html.js';
import { frame } from 'timing-functions';
// components
import ProtvistaNavigation from 'protvista-navigation';
import ProtvistaTooltip from 'protvista-tooltip';
import ProtvistaTrackConfig from 'protvista-track';
import ProtvistaInterproTrack from 'protvista-interpro-track';
import ProtvistaSequence from 'protvista-sequence';
import ProtvistaVariation from 'protvista-variation';
import ProtvistaVariationGraph from 'protvista-variation-graph';
import ProtvistaFilter from 'protvista-filter';
import ProtvistaManager from 'protvista-manager';

import { load } from 'data-loader';
// adapters
import { transformData as _transformDataFeatureAdapter } from 'protvista-feature-adapter';
import { transformData as _transformDataProteomicsAdapter } from 'protvista-proteomics-adapter';
import { transformData as _transformDataStructureAdapter } from 'protvista-structure-adapter';
import { transformData as _transformDataVariationAdapter } from 'protvista-variation-adapter';
import { transformData as _transformDataInterproAdapter } from 'protvista-interpro-adapter';
import { transformData as _transformDataProteomicsPTMApdapter } from './protvista-ptm-exchange';

import defaultConfig from './config.json';
import _ProtvistaUniprotStructure from './protvista-uniprot-structure';
import _DownloadPanel from './download-panel';
import { loadComponent } from './loadComponents';
import _filterConfig, { colorConfig as _colorConfig } from './filterConfig';
import { NightingaleEvent } from './types/nightingale-components';

import loaderIcon from './icons/spinner.svg';
import protvistaStyles from './styles/protvista-styles';
import loaderStyles from './styles/loader-styles';
import { generateTooltip } from './tooltips';

export const transformDataFeatureAdapter = _transformDataFeatureAdapter;
export const transformDataProteomicsAdapter = _transformDataProteomicsAdapter;
export const transformDataStructureAdapter = _transformDataStructureAdapter;
export const transformDataVariationAdapter = _transformDataVariationAdapter;
export const transformDataInterproAdapter = _transformDataInterproAdapter;
export const transformDataProteomicsPTMApdapter = _transformDataProteomicsPTMApdapter;
export const filterConfig = _filterConfig;
export const colorConfig = _colorConfig;
export const ProtvistaUniprotStructure = _ProtvistaUniprotStructure;
export const DownloadPanel = _DownloadPanel;

const adapters = {
  'protvista-feature-adapter': transformDataFeatureAdapter,
  'protvista-interpro-adapter': transformDataInterproAdapter,
  'protvista-proteomics-adapter': transformDataProteomicsAdapter,
  'protvista-structure-adapter': transformDataStructureAdapter,
  'protvista-variation-adapter': transformDataVariationAdapter,
  'protvista-proteomics-ptm-adapter': transformDataProteomicsPTMApdapter
};

type TrackType =
  | 'protvista-track'
  | 'protvista-variation'
  | 'protvista-variation-graph'
  | 'protvista-interpro-track';

type ProtvistaTrackConfig = {
  name: string;
  label: string;
  filter: string;
  trackType: TrackType;
  data: {
    url: string;
    adapter?:
      | 'protvista-feature-adapter'
      | 'protvista-structure-adapter'
      | 'protvista-proteomics-adapter'
      | 'protvista-variation-adapter';
  }[];
  tooltip: string;
  color?: string;
  shape?: string; //TODO: eventually replace with list
  filterComponent?: 'protvista-filter';
};

type ProtvistaCategory = {
  name: string;
  label: string;
  trackType: TrackType;
  tracks: ProtvistaTrackConfig[];
  color?: string;
  shape?: string; //TODO: eventually replace with list
};

export type DownloadConfig = {
  type: string;
  url: string;
}[];

type ProtvistaConfig = {
  categories: ProtvistaCategory[];
  download: DownloadConfig;
};

class ProtvistaUniprot extends LitElement {
  private openCategories: string[];
  private notooltip: boolean;
  private nostructure: boolean;
  private hasData: boolean;
  private loading: boolean;
  private data: { [key: string]: any };
  private rawData: { [key: string]: any };
  private displayCoordinates: { start?: number; end?: number } = {};
  private suspend?: boolean;
  private accession?: string;
  private sequence?: string;
  private config?: ProtvistaConfig;

  constructor() {
    super();
    this.openCategories = [];
    this.notooltip = false;
    this.nostructure = false;
    this.hasData = false;
    this.loading = true;
    this.data = {};
    this.rawData = {};
    this.displayCoordinates = {};
    this.addStyles();
  }

  static get properties() {
    return {
      suspend: { type: Boolean, reflect: true },
      accession: { type: String, reflect: true },
      sequence: { type: String },
      data: { type: Object },
      openCategories: { type: Array },
      config: { type: Object },
      notooltip: { type: Boolean, reflect: true },
      nostructure: { type: Boolean, reflect: true },
    };
  }

  addStyles() {
    // We are not using static get styles()
    // as we are not using the shadowDOM
    // because of Mol*
    const styleTag = document.createElement('style');
    styleTag.innerHTML = `${protvistaStyles.toString()} ${loaderStyles.toString()}`;
    document.querySelector('head')?.append(styleTag);
  }

  registerWebComponents() {
    loadComponent('protvista-navigation', ProtvistaNavigation);
    loadComponent('protvista-tooltip', ProtvistaTooltip);
    loadComponent('protvista-track', ProtvistaTrackConfig);
    loadComponent('protvista-interpro-track', ProtvistaInterproTrack);
    loadComponent('protvista-sequence', ProtvistaSequence);
    loadComponent('protvista-variation', ProtvistaVariation);
    loadComponent('protvista-variation-graph', ProtvistaVariationGraph);
    loadComponent('protvista-filter', ProtvistaFilter);
    loadComponent('protvista-manager', ProtvistaManager);
    loadComponent('protvista-uniprot-structure', _ProtvistaUniprotStructure);
  }

  async _loadData() {
    const accession = this.accession;
    if (accession && this.config) {
      // Get the list of unique urls
      const urls = this.config.categories
        .map(({ tracks }) => tracks.map(({ data }) => data[0].url))
        .flat();
      const uniqueUrls = [...new Set(urls)];
      // Get the data for all urls and store it
      await Promise.all(
        uniqueUrls.map((url: string) =>
          load(url.replace('{accession}', accession))
            .then(
              (data) => {
                this.rawData[url] = data.payload;
                // Some endpoints return empty arrays, while most fail 🙄
                if (!this.hasData && data.payload?.features?.length)
                  this.hasData = true;
              },
              // TODO handle this better based on error code
              // Fail silently for now
              (error) => console.warn(error)
            )
            .catch((e) => {
              console.log(e);
            })
        )
      );

      // Now iterate over tracks and categories, transforming the data
      // and assigning it as adequate
      this.config.categories.map(
        ({ name: categoryName, tracks, trackType }) => {
          // const categoryData: any = [];
          const categoryData = tracks.map(
            ({ data: dataConfig, name: trackName, filter }) => {
              const { url, adapter } = dataConfig[0]; // TODO handle array
              const trackData = this.rawData[url] || [];

              if (
                !trackData ||
                (adapter === 'protvista-variation-adapter' &&
                  trackData.length === 0)
              ) {
                return;
              }
              // 1. Convert data
              const transformedData = adapter
                ? adapters[adapter](trackData)
                : trackData;

              // 2. Filter raw data if filter is specified
              const filteredData =
                Array.isArray(transformedData) && filter
                  ? transformedData.filter(
                      ({ type }: { type?: string }) => type === filter
                    )
                  : transformedData;
              if (!filteredData) {
                return;
              }

              // 3. Assign track data
              this.data[`${categoryName}-${trackName}`] = filteredData;

              return filteredData;
            }
          );
          this.data[categoryName] =
            trackType === 'protvista-variation-graph'
              ? categoryData[0]
              : categoryData.flat();
        }
      );
    }
    this.loading = false;
    this.requestUpdate(); // Why?
  }

  async _loadDataInComponents() {
    await frame();
    Object.entries(this.data).forEach(([id, data]) => {
      const element: ProtvistaTrack | null = document.getElementById(
        `track-${id}`
      );
      // set data if it hasn't changed
      if (element && element.data !== data) element.data = data;
      const currentCategory = this.config?.categories.find(
        ({ name }) => name === id
      );
      if (
        currentCategory &&
        currentCategory.tracks &&
        data &&
        // Check there's data and special case for variants
        // NOTE: should refactor protvista-variation-adapter
        // to return a list of variants and set the sequence
        // on protvista-variation separately
        (data.length > 0 || data.variants?.length)
      ) {
        // Make category element visible
        const categoryElt = document.getElementById(
          `category_${currentCategory.name}`
        );
        if (categoryElt) {
          categoryElt.style.display = 'flex';
        }
        for (const track of currentCategory.tracks) {
          const elementTrack: ProtvistaTrack | null = document.getElementById(
            `track-${id}-${track.name}`
          );
          if (elementTrack) {
            elementTrack.data = this.data[`${id}-${track.name}`];
          }
        }
      }
    });
  }

  updated(changedProperties: Map<string, string>) {
    super.updated(changedProperties);

    const filterComponent =
      this.querySelector<ProtvistaFilter>('protvista-filter');
    if (filterComponent && filterComponent.filters !== filterConfig) {
      filterComponent.filters = filterConfig;
    }

    const variationComponent = this.querySelector<ProtvistaVariation>(
      'protvista-variation'
    );
    if (variationComponent && variationComponent.colorConfig !== colorConfig) {
      variationComponent.colorConfig = colorConfig;
    }

    if (changedProperties.has('suspend')) {
      if (this.suspend) return;
      this._init();
    }

    this._loadDataInComponents();
  }

  _init() {
    if (!this.config) {
      this.config = defaultConfig as ProtvistaConfig;
    }

    if (!this.accession) return;
    this.loadEntry(this.accession).then((entryData) => {
      this.sequence = entryData.sequence.sequence;
      this.displayCoordinates = { start: 1, end: this.sequence?.length };
      // We need to get the length of the protein before rendering it
    });
    this._loadData();
  }

  connectedCallback() {
    super.connectedCallback();
    this.registerWebComponents();

    if (!this.suspend) this._init();

    this.addEventListener('change', (e: NightingaleEvent) => {
      if (e.detail?.displaystart) {
        this.displayCoordinates.start = e.detail.displaystart;
      }
      if (e.detail?.displayend) {
        this.displayCoordinates.end = e.detail.displayend;
      }

      if (!this.notooltip) {
        if (!e.detail?.eventtype) {
          this._resetTooltip();
        } else if (e.detail.eventtype === 'click') {
          this.updateTooltip(e);
        }
      }
    });

    if (!this.notooltip) {
      this.addEventListener('click', (e) => {
        const target = e.target as Element;
        if (
          !target.closest('.feature') &&
          !target.closest('protvista-tooltip')
        ) {
          const tooltip =
            this.querySelector<ProtvistaTooltip>('protvista-tooltip');
          if (tooltip) {
            tooltip.visible = false;
          }
        }
      });
      document.addEventListener('click', this._resetTooltip);
    }

    // Note: this doesn't seem to work
    this.addEventListener('load', () => {
      if (!this.hasData) {
        this.dispatchEvent(
          new CustomEvent('protvista-event', {
            detail: {
              hasData: true,
            },
            bubbles: true,
          })
        );
        this.hasData = true;
      }
    });
  }

  disconnectedCallback() {
    if (!this.notooltip) {
      document.removeEventListener('click', this._resetTooltip);
    }
  }

  _resetTooltip(e?: MouseEvent) {
    if (this && (!e || !(e.target as Element)?.closest('protvista-uniprot'))) {
      const tooltip = this.querySelector<ProtvistaTooltip>('protvista-tooltip');
      if (tooltip) {
        tooltip.visible = false;
      }
    }
  }

  async loadEntry(accession: string) {
    try {
      return await (
        await fetch(`https://www.ebi.ac.uk/proteins/api/proteins/${accession}`)
      ).json();
    } catch (e) {
      console.error(`Couldn't load UniProt entry`, e);
    }
  }

  /**
   * we need to use the light DOM.
   * */
  createRenderRoot() {
    return this;
  }

  render() {
    // Component isn't ready
    if (!this.sequence || !this.config || this.suspend) {
      return html``;
    }
    if (this.loading) {
      return html`<div class="protvista-loader">
        ${svg`${unsafeHTML(loaderIcon)}`}
      </div>`;
    }
    if (!this.hasData) {
      return html`<div class="protvista-no-results">
        No feature data available for ${this.accession}
      </div>`;
    }
    return html`
      <protvista-manager
        attributes="length displaystart displayend highlight activefilters filters"
        additionalsubscribers="protvista-structure"
      >
        <div class="nav-container">
          <div class="action-buttons">
            <download-panel
              accession="${this.accession}"
              config="${JSON.stringify(this.config.download)}"
            />
          </div>
          <div class="track-content">
            <protvista-navigation
              length="${this.sequence.length}"
            ></protvista-navigation>
            <protvista-sequence
              length="${this.sequence.length}"
              sequence="${this.sequence}"
              displaystart=${this.displayCoordinates?.start}
              displayend="${this.displayCoordinates?.end}"
            ></protvista-sequence>
          </div>
        </div>
        ${this.config.categories.map(
          (category) =>
            this.data[category.name] &&
            html`
              <div class="category" id="category_${category.name}">
                <div
                  class="category-label"
                  data-category-toggle="${category.name}"
                  @click="${this.handleCategoryClick}"
                >
                  ${category.label}
                </div>

                <div
                  data-id="category_${category.name}"
                  class="aggregate-track-content track-content"
                  .style="${this.openCategories.includes(category.name)
                    ? 'opacity:0'
                    : 'opacity:1'}"
                >
                  ${this.data[category.name] &&
                  this.getTrack(
                    category.trackType,
                    'non-overlapping',
                    category.color,
                    category.shape,
                    category.name
                  )}
                </div>
              </div>

              <!-- Expanded Categories -->
              ${category.tracks &&
              category.tracks.map((track) => {
                if (this.openCategories.includes(category.name)) {
                  const trackData = this.data[`${category.name}-${track.name}`];
                  return trackData &&
                    ((Array.isArray(trackData) && trackData.length) ||
                      Object.keys(trackData).length)
                    ? html`
                        <div class="category__track" id="track_${track.name}">
                          <div class="track-label" title="${track.tooltip}">
                            ${track.filterComponent
                              ? this.getFilterComponent(
                                  `${category.name}-${track.name}`
                                )
                              : track.label}
                          </div>
                          <div
                            class="track-content"
                            data-id="track_${track.name}"
                          >
                            ${this.getTrack(
                              track.trackType,
                              'non-overlapping',
                              track.color || category.color,
                              track.shape || category.shape,
                              `${category.name}-${track.name}`
                            )}
                          </div>
                        </div>
                      `
                    : '';
                }
              })}
              ${!category.tracks
                ? this.data[category.name].map(
                    (item: { accession?: string }) => {
                      if (this.openCategories.includes(category.name)) {
                        if (!item || !item.accession) return '';
                        return html`
                          <div
                            class="category__track"
                            id="track_${item.accession}"
                          >
                            <div class="track-label" title="${item.accession}">
                              ${item.accession}
                            </div>
                            <div
                              class="track-content"
                              data-id="track_${item.accession}"
                            >
                              ${this.getTrack(
                                category.trackType,
                                'non-overlapping',
                                category.color,
                                category.shape,
                                `${category.name}-${item.accession}`
                              )}
                            </div>
                          </div>
                        `;
                      }
                    }
                  )
                : ''}
            `
        )}
        <div class="nav-container">
          <div class="credits"></div>
          <div class="track-content">
            <protvista-sequence
              length="${this.sequence.length}"
              sequence="${this.sequence}"
              displaystart=${this.displayCoordinates.start}
              displayend="${this.displayCoordinates.end}"
            ></protvista-sequence>
          </div>
        </div>
        ${!this.nostructure
          ? html`
              <protvista-uniprot-structure
                accession="${this.accession || ''}"
              ></protvista-uniprot-structure>
            `
          : ''}
        <protvista-tooltip />
      </protvista-manager>
    `;
  }

  async updateTooltip(e: NightingaleEvent) {
    const d = e.detail?.feature;

    const tooltip = this.querySelector<ProtvistaTooltip>('protvista-tooltip');
    if (!tooltip) {
      return;
    }

    tooltip.title = `${d.type} ${d.start}-${d.end}`;
    tooltip.innerHTML = generateTooltip(e.detail.feature.data);
    tooltip.visible = true;

    if (e.detail?.coords) {
      const [x, y] = e.detail.coords;
      tooltip.x = x;
      tooltip.y = y;
    }
  }

  handleCategoryClick(e: MouseEvent) {
    const target = e.target as Element;
    const toggle = target.getAttribute('data-category-toggle');
    if (toggle && !target.classList.contains('open')) {
      target.classList.add('open');
      this.openCategories = [...this.openCategories, toggle];
    } else {
      target.classList.remove('open');
      this.openCategories = [...this.openCategories].filter(
        (d) => d !== toggle
      );
    }
  }

  getCategoryTypesAsString(tracks: ProtvistaTrackConfig[]) {
    return tracks.map((t) => t.filter).join(',');
  }

  getFilterComponent(forId: string) {
    return html`
      <protvista-filter
        style="minWidth: 20%"
        for="track-${forId}"
      ></protvista-filter>
    `;
  }

  getTrack(trackType: TrackType, layout = '', color = '', shape = '', id = '') {
    // lit-html doesn't allow to have dynamic tag names, hence the switch/case
    // with repeated code
    switch (trackType) {
      case 'protvista-track':
        return html`
          <protvista-track
            length="${this.sequence?.length}"
            layout="${layout}"
            color="${color}"
            shape="${shape}"
            displaystart="${this.displayCoordinates?.start}"
            displayend="${this.displayCoordinates?.end}"
            id="track-${id}"
          >
          </protvista-track>
        `;
      case 'protvista-interpro-track':
        return html`
          <protvista-interpro-track
            length="${this.sequence?.length}"
            color="${color}"
            shape="${shape}"
            displaystart="${this.displayCoordinates?.start}"
            displayend="${this.displayCoordinates?.end}"
            id="track-${id}"
          >
          </protvista-interpro-track>
        `;
      case 'protvista-variation':
        return html`
          <protvista-variation
            length="${this.sequence?.length}"
            displaystart="${this.displayCoordinates?.start}"
            displayend="${this.displayCoordinates?.end}"
            id="track-${id}"
          >
          </protvista-variation>
        `;
      case 'protvista-variation-graph':
        return html`
          <protvista-variation-graph
            length="${this.sequence?.length}"
            displaystart="${this.displayCoordinates?.start}"
            displayend="${this.displayCoordinates?.end}"
            id="track-${id}"
          >
          </protvista-variation-graph>
        `;
      default:
        console.warn('No Matching ProtvistaTrack Found.');
        break;
    }
  }
}

export default ProtvistaUniprot;

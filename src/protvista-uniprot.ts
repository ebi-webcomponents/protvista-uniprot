import { LitElement, html, svg } from 'lit-element';
import { unsafeHTML } from 'lit-html/directives/unsafe-html.js';
import { frame } from 'timing-functions';

// components
import ProtvistaTooltip from 'protvista-tooltip';
import ProtvistaTrackConfig from 'protvista-track';
// Nightingale
import NightingaleManager from '@nightingale-elements/nightingale-manager';
import NightingaleNavigation from '@nightingale-elements/nightingale-navigation';
import NightingaleSequence from '@nightingale-elements/nightingale-sequence';
import NightingaleColoredSequence from '@nightingale-elements/nightingale-colored-sequence';
import NightingaleTrack from '@nightingale-elements/nightingale-track';
import NightingaleInterproTrack from '@nightingale-elements/nightingale-interpro-track';
import NightingaleVariation from '@nightingale-elements/nightingale-variation';
import NightingaleLinegraphTrack from '@nightingale-elements/nightingale-linegraph-track';
import NightingaleSequenceHeatmap from '@nightingale-elements/nightingale-sequence-heatmap';
import NightingaleFilter from '@nightingale-elements/nightingale-filter';

import { load } from 'data-loader';
// adapters
import { transformData as _transformDataFeatureAdapter } from 'protvista-feature-adapter';
import { transformData as _transformDataProteomicsAdapter } from 'protvista-proteomics-adapter';
import { transformData as _transformDataStructureAdapter } from 'protvista-structure-adapter';
import {
  transformData as _transformDataVariationAdapter,
  TransformedVariant,
} from 'protvista-variation-adapter';
import { transformData as _transformDataVariationGraphAdapter } from './protvista-variation-graph-adapter';
import { transformData as _transformDataInterproAdapter } from 'protvista-interpro-adapter';
import { transformData as _transformDataProteomicsPTMApdapter } from './protvista-ptm-exchange';
import { transformData as _transformDataAlphaFoldConfidenceAdapter } from './protvista-alphafold-confidence';
import { transformData as _transformDataAlphaMissensePathogenicityAdapter } from './protvista-alphamissense-pathogenicity';
import { transformData as _transformDataAlphaMissenseHeatmapAdapter } from './protvista-alphamissense-heatmap';

import defaultConfig from './config.json';
import _ProtvistaUniprotStructure from './protvista-uniprot-structure';
import _DownloadPanel from './download-panel';
import { loadComponent } from './loadComponents';
import _filterConfig, { colorConfig as _colorConfig } from './filterConfig';
import { NightingaleEvent } from './types/nightingale-components';

import loaderIcon from './icons/spinner.svg';
import protvistaStyles from './styles/protvista-styles';
import loaderStyles from './styles/loader-styles';

export const transformDataFeatureAdapter = _transformDataFeatureAdapter;
export const transformDataProteomicsAdapter = _transformDataProteomicsAdapter;
export const transformDataStructureAdapter = _transformDataStructureAdapter;
export const transformDataVariationAdapter = _transformDataVariationAdapter;
export const transformDataVariationGraphAdapter =
  _transformDataVariationGraphAdapter;
export const transformDataInterproAdapter = _transformDataInterproAdapter;
export const transformDataProteomicsPTMApdapter =
  _transformDataProteomicsPTMApdapter;
export const transformDataAlphaFoldConfidenceAdapter =
  _transformDataAlphaFoldConfidenceAdapter;

export const transformDataAlphaMissensePathogenicityAdapter =
  _transformDataAlphaMissensePathogenicityAdapter;

export const transformDataAlphaMissenseHeatmapAdapter =
  _transformDataAlphaMissenseHeatmapAdapter;

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
  'protvista-variation-graph-adapter': transformDataVariationGraphAdapter,
  'protvista-proteomics-ptm-adapter': transformDataProteomicsPTMApdapter,
  'protvista-alphafold-confidence-adapter':
    transformDataAlphaFoldConfidenceAdapter,
  'protvista-alphamissense-pathogenicity-adapter':
    transformDataAlphaMissensePathogenicityAdapter,
  'protvista-alphamissense-heatmap-adapter':
    transformDataAlphaMissenseHeatmapAdapter,
};

type TrackType =
  | 'nightingale-track'
  | 'nightingale-interpro-track'
  | 'nightingale-colored-sequence'
  | 'nightingale-variation'
  | 'nightingale-linegraph-track'
  | 'nightingale-sequence-heatmap';

type ProtvistaTrackConfig = {
  name: string;
  label: string;
  labelUrl?: string;
  filter: string;
  trackType: TrackType;
  data: {
    url: string | string[];
    adapter?:
      | 'protvista-feature-adapter'
      | 'protvista-structure-adapter'
      | 'protvista-proteomics-adapter'
      | 'protvista-variation-adapter'
      | 'protvista-variation-graph-adapter'
      | 'protvista-interpro-adapter'
      | 'protvista-alphafold-confidence-adapter'
      | 'protvista-alphamissense-pathogenicity-adapter'
      | 'protvista-alphamissense-heatmap-adapter';
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
  private transformedVariants?: {
    sequence: string;
    variants: TransformedVariant[];
  };
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
    (this.transformedVariants = { sequence: '', variants: [] }),
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
    loadComponent('nightingale-navigation', NightingaleNavigation);
    loadComponent('protvista-tooltip', ProtvistaTooltip);
    loadComponent('nightingale-track', NightingaleTrack);
    loadComponent('nightingale-colored-sequence', NightingaleColoredSequence);
    loadComponent('nightingale-interpro-track', NightingaleInterproTrack);
    loadComponent('nightingale-sequence', NightingaleSequence);
    loadComponent('nightingale-variation', NightingaleVariation);
    loadComponent('nightingale-linegraph-track', NightingaleLinegraphTrack);
    loadComponent('nightingale-filter', NightingaleFilter);
    loadComponent('nightingale-manager', NightingaleManager);
    loadComponent('protvista-uniprot-structure', _ProtvistaUniprotStructure);
    loadComponent('nightingale-sequence-heatmap', NightingaleSequenceHeatmap);
  }

  async _loadData() {
    const accession = this.accession;
    if (accession && this.config) {
      // Get the list of unique urls
      const urls = this.config.categories.flatMap(({ tracks }) =>
        tracks.flatMap(({ data }) => data[0].url)
      );
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
      for (const { name: categoryName, tracks, trackType } of this.config
        .categories) {
        const categoryData = await Promise.all(
          tracks.map(async ({ data: dataConfig, name: trackName, filter }) => {
            const { url, adapter } = dataConfig[0]; // TODO handle array
            const trackData = (Array.isArray(url) ? url : [url]).map(
              (url) => this.rawData[url] || []
            );

            if (
              !trackData ||
              (adapter === 'protvista-variation-adapter' &&
                trackData[0].length === 0)
            ) {
              return;
            }

            // 1. Convert data
            let transformedData = adapter
              ? await adapters[adapter](...trackData)
              : trackData;

            if (adapter === 'protvista-interpro-adapter') {
              const representativeDomains = [];
              transformedData?.forEach((feature) => {
                feature.locations?.forEach((location) => {
                  location.fragments?.forEach((fragment) => {
                    if (fragment.representative) {
                      representativeDomains.push({
                        ...feature,
                        type: 'InterPro Representative Domain',
                        start: fragment.start,
                        end: fragment.end,
                      });
                    }
                  });
                });
              });
              transformedData = representativeDomains;
            }

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

            if (trackName === 'variation') {
              this.transformedVariants = filteredData;
            }
            return filteredData;
          })
        );

        this.data[categoryName] =
          trackType === 'nightingale-linegraph-track' ||
          trackType === 'nightingale-colored-sequence'
            ? categoryData[0]
            : categoryData.flat();
      }
    }
    this.loading = false;
    this.requestUpdate(); // Why?
  }

  async _loadDataInComponents() {
    await frame();
    Object.entries(this.data).forEach(([id, data]) => {
      const element: NightingaleTrack | null = document.getElementById(
        `track-${id}`
      ) as NightingaleTrack;
      // set data if it hasn't changed
      if (element && element.data !== data) {
        element.data = data;
      }
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
          const elementTrack = document.getElementById(
            `track-${id}-${track.name}`
          ) as NightingaleTrack | null;
          if (elementTrack) {
            elementTrack.data = this.data[`${id}-${track.name}`];
          }
        }
      }

      if (
        currentCategory?.name === 'ALPHAMISSENSE_PATHOGENICITY' &&
        currentCategory.tracks
      ) {
        for (const track of currentCategory.tracks) {
          if (track.trackType === 'nightingale-sequence-heatmap') {
            const heatmapComponent = this.querySelector<
              typeof NightingaleSequenceHeatmap
            >('nightingale-sequence-heatmap');
            if (heatmapComponent) {
              const heatmapData = this.data[`${id}-${track.name}`];
              const xDomain = Array.from(
                { length: this.sequence.length },
                (_, i) => i + 1
              );
              const yDomain = [
                ...new Set(heatmapData.map((hotMapItem) => hotMapItem.yValue)),
              ];
              heatmapComponent.setHeatmapData(xDomain, yDomain, heatmapData);
            }
          }
        }
      }
    });
  }

  updated(changedProperties: Map<string, string>) {
    super.updated(changedProperties);

    const filterComponent =
      this.querySelector<NightingaleFilter>('nightingale-filter');
    if (filterComponent && filterComponent.filters !== filterConfig) {
      filterComponent.filters = filterConfig;
    }

    const variationComponent = this.querySelector<NightingaleVariation>(
      'nightingale-variation'
    );
    
    if (variationComponent && variationComponent?.colorConfig !== colorConfig) {
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
        if (!e.detail?.eventType) {
          this._resetTooltip();
        } else if (e.detail.eventType === 'click') {
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
      <nightingale-manager
        reflected-attributes="length display-start display-end highlight activefilters filters"
      >
        <div class="nav-container">
          <div class="action-buttons">
            <download-panel
              accession="${this.accession}"
              config="${JSON.stringify(this.config.download)}"
            />
          </div>
          <div class="track-content">
            <nightingale-navigation
              length="${this.sequence.length}"
              height="40"
            ></nightingale-navigation>
            <nightingale-sequence
              length="${this.sequence.length}"
              height="40"
              sequence="${this.sequence}"
              display-start=${this.displayCoordinates?.start}
              display-end="${this.displayCoordinates?.end}"
            ></nightingale-sequence>
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
                  class="aggregate-track-content track-content ${category.trackType ===
                  'nightingale-colored-sequence'
                    ? 'track-content__coloured-sequence'
                    : ''}"
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
                    category.name,
                    category.scale,
                    category['color-range']
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
                            ${(track.filterComponent &&
                              this.getFilterComponent(
                                `${category.name}-${track.name}`
                              )) ||
                            (track.labelUrl &&
                              html`<a
                                target="_blank"
                                href="${track.labelUrl.replace(
                                  '{accession}',
                                  this.accession
                                )}"
                                >${track.label}</a
                              >`) ||
                            track.label}
                          </div>
                          <div
                            class="track-content"
                            class="track-content ${category.trackType ===
                            'nightingale-colored-sequence'
                              ? 'track-content__coloured-sequence'
                              : ''}"
                            data-id="track_${track.name}"
                          >
                            ${this.getTrack(
                              track.trackType,
                              'non-overlapping',
                              track.color || category.color,
                              track.shape || category.shape,
                              `${category.name}-${track.name}`,
                              track.scale || category.scale,
                              track['color-range'] || category['color-range']
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
                                `${category.name}-${item.accession}`,
                                category.scale,
                                category['color-range']
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
            <nightingale-sequence
              length="${this.sequence.length}"
              height="40"
              sequence="${this.sequence}"
              display-start=${this.displayCoordinates.start}
              display-end="${this.displayCoordinates.end}"
            ></nightingale-sequence>
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
      </nightingale-manager>
    `;
  }

  async updateTooltip(e: NightingaleEvent) {
    const d = e.detail?.feature;

    if (!d.tooltipContent) {
      return;
    }

    const tooltip = this.querySelector<ProtvistaTooltip>('protvista-tooltip');
    if (!tooltip) {
      return;
    }

    tooltip.title = `${d.type} ${d.start}-${d.end}`;
    tooltip.innerHTML = d.tooltipContent;
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

  groupByCategory(filters, category) {
    return filters?.filter((f) => f.type.name === category);
  }

  getFilter(filters, filterName) {
    return filters?.filter((f) => f.name === filterName)?.[0];
  }
  
  handleFilterClick(e: MouseEvent) {
    const target = e.target as Element as NightingaleFilter;
    const consequenceFilters = this.groupByCategory(
      target.filters,
      'consequence'
    );
    const provenanceFilters = this.groupByCategory(
      target.filters,
      'provenance'
    );

    const selectedFilters = target.selectedFilters;

    if (selectedFilters) {
      const selectedConsequenceFilters = selectedFilters
        .map((f) => this.getFilter(consequenceFilters, f))
        .filter(Boolean);
      const selectedProvenanceFilters = selectedFilters
        .map((f) => this.getFilter(provenanceFilters, f))
        .filter(Boolean);
  
      const filteredVariants = this.transformedVariants.variants
        ?.filter((variant) =>
          selectedConsequenceFilters.some(
            (filter) => filter.filterPredicate(variant)
          )
        )
        .filter((variant) =>
          selectedProvenanceFilters.some(
            (filter) => filter.filterPredicate(variant)
          )
        );
  
      this.data['VARIATION-variation'] = {
        ...this.data['VARIATION-variation'],
        variants: filteredVariants,
      };
  
      this._loadDataInComponents();
    }
  }

  getCategoryTypesAsString(tracks: ProtvistaTrackConfig[]) {
    return tracks.map((t) => t.filter).join(',');
  }

  getFilterComponent(forId: string) {
    return html`
      <nightingale-filter
        style="minWidth: 20%"
        for="track-${forId}"
        @change="${this.handleFilterClick}"
      ></nightingale-filter>
    `;
  }

  getTrack(
    trackType: TrackType,
    layout = '',
    color = '',
    shape = '',
    id = '',
    scale = '',
    colorRange = ''
  ) {
    // lit-html doesn't allow to have dynamic tag names, hence the switch/case
    // with repeated code
    switch (trackType) {
      case 'nightingale-track':
        return html`
          <nightingale-track
            length="${this.sequence?.length}"
            height="40"
            layout="${layout}"
            color="${color}"
            shape="${shape}"
            display-start="${this.displayCoordinates?.start}"
            display-end="${this.displayCoordinates?.end}"
            id="track-${id}"
          >
          </nightingale-track>
        `;
      case 'nightingale-interpro-track':
        return html`
          <nightingale-interpro-track
            length="${this.sequence?.length}"
            height="40"
            color="${color}"
            shape="${shape}"
            display-start="${this.displayCoordinates?.start}"
            display-end="${this.displayCoordinates?.end}"
            id="track-${id}"
          >
          </nightingale-interpro-track>
        `;
      case 'nightingale-variation':
        return html`
          <nightingale-variation
            length="${this.sequence?.length}"
            height="500"
            display-start="${this.displayCoordinates?.start}"
            display-end="${this.displayCoordinates?.end}"
            id="track-${id}"
          >
          </nightingale-variation>
        `;
      case 'nightingale-linegraph-track':
        return html`
          <nightingale-linegraph-track
            length="${this.sequence?.length}"
            height="50"
            display-start="${this.displayCoordinates?.start}"
            display-end="${this.displayCoordinates?.end}"
            id="track-${id}"
          >
          </nightingale-linegraph-track>
        `;
      case 'nightingale-colored-sequence':
        return html`
          <nightingale-colored-sequence
            length="${this.sequence?.length}"
            display-start="${this.displayCoordinates?.start}"
            display-end="${this.displayCoordinates?.end}"
            id="track-${id}"
            scale="${scale}"
            color-range="${colorRange}"
            height="13"
          >
          </nightingale-colored-sequence>
        `;

      case 'nightingale-sequence-heatmap':
        return html`
          <nightingale-sequence-heatmap
            id="track-${id}"
            heatmap-id="seq-heatmap"
            length="${this.sequence?.length}"
            display-start="${this.displayCoordinates?.start}"
            display-end="${this.displayCoordinates?.end}"
            highlight-event="onmouseover"
            highlight-color="#EB3BFF66"
            height="300"
          >
          </nightingale-sequence-heatmap>
        `;
      default:
        console.warn('No Matching ProtvistaTrack Found.');
        break;
    }
  }
}

export default ProtvistaUniprot;

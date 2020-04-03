import { LitElement, html, css } from "lit-element";
import defaultConfig from "./config.json";
import ProtvistaNavigation from "protvista-navigation";
import ProtvistaTooltip from "protvista-tooltip";
import ProtvistaTrack from "protvista-track";
import ProtvistaInterproTrack from "protvista-interpro-track";
import ProtvistaSequence from "protvista-sequence";
import ProtvistaVariation from "protvista-variation";
import ProtvistaVariationGraph from "protvista-variation-graph";
import { load } from "data-loader";
import { transformData as transformDataFeatureAdapter } from "protvista-feature-adapter";
import { transformData as transformDataProteomicsAdapter } from "protvista-proteomics-adapter";
import { transformData as transformDataStructureAdapter } from "protvista-structure-adapter";
import { transformData as transformDataVariationAdapter } from "protvista-variation-adapter";
import { transformData as transformDataInterproAdapter } from "protvista-interpro-adapter";
import ProtvistaFilter from "protvista-filter";
import ProtvistaManager from "protvista-manager";
import ProtvistaStructure from "protvista-structure";
import { loadComponent } from "./loadComponents.js";
import filterConfig, { colorConfig } from "./filterConfig";

const adapters = {
  "protvista-feature-adapter": transformDataFeatureAdapter,
  "protvista-interpro-adapter": transformDataInterproAdapter,
  "protvista-proteomics-adapter": transformDataProteomicsAdapter,
  "protvista-structure-adapter": transformDataStructureAdapter,
  "protvista-variation-adapter": transformDataVariationAdapter
};
class ProtvistaUniprot extends LitElement {
  constructor() {
    super();
    this.openCategories = [];
    this.notooltip = false;
    this.nostructure = false;
    this.hasData = false;
    this.data = {};
    this.displayCoordinates = null;
  }

  static get properties() {
    return {
      accession: { type: String },
      sequence: { type: String },
      data: { type: Array },
      openCategories: { type: Array },
      config: { type: Array },
      notooltip: { type: Boolean },
      nostructure: { type: Boolean }
    };
  }

  get cssStyle() {
    return html`
      <style>
        protvista-tooltip a {
          text-decoration: underline;
        }
        .track-content {
          width: 80vw;
        }

        .nav-container,
        .category,
        .category__track {
          display: flex;
          margin-bottom: 0.1rem;
        }

        .category-label,
        .track-label,
        .action-buttons,
        .credits {
          width: 20vw;
          padding: 0.5em;
        }

        .action-buttons {
          display: flex;
          justify-content: flex-end;
          align-items: flex-end;
        }

        .category-label {
          background-color: #b2f5ff;
          cursor: pointer;
        }

        .category-label::before {
          content: " ";
          display: inline-block;
          width: 0;
          height: 0;
          border-top: 5px solid transparent;
          border-bottom: 5px solid transparent;
          border-left: 5px solid #333;
          margin-right: 5px;
          -webkit-transition: all 0.1s;
          /* Safari */
          -o-transition: all 0.1s;
          transition: all 0.1s;
        }

        .category-label.open::before {
          content: " ";
          display: inline-block;
          width: 0;
          height: 0;
          border-left: 5px solid transparent;
          border-right: 5px solid transparent;
          border-top: 5px solid #333;
          margin-right: 5px;
        }

        .track-label {
          background-color: #d9faff;
        }

        protvista-track {
          border-top: 1px solid #d9faff;
        }

        .feature {
          cursor: pointer;
        }
      </style>
    `;
  }

  registerWebComponents() {
    loadComponent("protvista-navigation", ProtvistaNavigation);
    loadComponent("protvista-tooltip", ProtvistaTooltip);
    loadComponent("protvista-track", ProtvistaTrack);
    loadComponent("protvista-interpro-track", ProtvistaInterproTrack);
    loadComponent("protvista-sequence", ProtvistaSequence);
    loadComponent("protvista-variation", ProtvistaVariation);
    loadComponent("protvista-variation-graph", ProtvistaVariationGraph);
    loadComponent("protvista-filter", ProtvistaFilter);
    loadComponent("protvista-manager", ProtvistaManager);
    loadComponent("protvista-structure", ProtvistaStructure);
  }

  _loadData() {
    this.config.categories.forEach(({ name, url, adapter, tracks }) => {
      const urlWithProtein =
        url.indexOf("{}") >= 0
          ? url.replace("{}", this.accession)
          : `${url}${this.accession}`;
      load(urlWithProtein).then(({ payload }) => {
        if (!payload) return;
        const data = adapter ? adapters[adapter](payload) : payload;
        this.data[name] =
          adapter === "protvista-feature-adapter"
            ? data.filter(({ category }) => !category || category === name)
            : data;
        if (tracks) {
          for (const track of tracks) {
            this.data[`${name}-${track.name}`] =
              Array.isArray(data) && track.filter
                ? data.filter(({ type }) => type === track.filter)
                : data;
          }
        } else if (Array.isArray(data)) {
          // if tracks are not defined we create a track per item in the result
          for (const item of data) {
            this.data[`${name}-${item.accession}`] = [item];
          }
        }
        this.requestUpdate();
      });
    });
  }

  _loadDataInComponents() {
    Object.entries(this.data).forEach(([id, data]) => {
      const element = document.getElementById(`track-${id}`);
      if (element) element.data = data;
      const currentCategory = this.config.categories.filter(
        ({ name }) => name === id
      );
      if (currentCategory.length && currentCategory[0].tracks) {
        for (const track of currentCategory[0].tracks) {
          const elementTrack = document.getElementById(
            `track-${id}-${track.name}`
          );
          if (elementTrack) {
            elementTrack.data = this.data[`${id}-${track.name}`];
          }
        }
      }
    });
  }

  updated(changedProperties) {
    super.updated(changedProperties);
    this._loadDataInComponents();
    const filterComponent = this.querySelector("protvista-filter");
    if (filterComponent && filterComponent.filters !== filterConfig) {
      filterComponent.filters = filterConfig;
    }
    const variationComponent = this.querySelector("protvista-variation");
    if (variationComponent && variationComponent.colorConfig !== colorConfig) {
      variationComponent.colorConfig = colorConfig;
    }
  }

  connectedCallback() {
    super.connectedCallback();
    this.registerWebComponents();
    if (!this.config) {
      this.config = defaultConfig;
    }

    this.loadEntry(this.accession).then(entryData => {
      this.sequence = entryData.sequence.sequence;
      this.displayCoordinates = { start: 1, end: this.sequence.length };
      // We need to get the length of the protein before rendering it
    });
    this._loadData();

    this.addEventListener("change", e => {
      if (e.detail.displaystart) {
        this.displayCoordinates.start = e.detail.displaystart;
      }
      if (e.detail.displayend) {
        this.displayCoordinates.end = e.detail.displayend;
      }

      if (!this.notooltip) {
        if (!e.detail.eventtype) {
          this._resetTooltip();
        } else if (e.detail.eventtype === "click") {
          this.updateTooltip(e, true);
        }
      }
    });

    if (!this.notooltip) {
      this.addEventListener("click", e => {
        if (
          !e.target.closest(".feature") &&
          !e.target.closest("protvista-tooltip")
        ) {
          const tooltip = this.querySelector("protvista-tooltip");
          tooltip.style.setProperty("display", "none");
        }
      });
      document.addEventListener("click", this._resetTooltip);
    }

    this.addEventListener("load", e => {
      if (!this.hasData) {
        this.dispatchEvent(
          new CustomEvent("protvista-event", {
            detail: {
              hasData: true
            },
            bubbles: true
          })
        );
        this.hasData = true;
      }
    });
  }

  disconnectedCallback() {
    if (!this.notooltip) {
      document.removeEventListener("click", this._resetTooltip);
    }
  }

  _resetTooltip(e) {
    if (this && (!e || !e.target.closest("protvista-uniprot"))) {
      const tooltip = this.querySelector("protvista-tooltip");
      tooltip.style.setProperty("display", "none");
    }
  }

  async loadEntry(accession) {
    try {
      return await (
        await fetch(`https://www.ebi.ac.uk/proteins/api/proteins/${accession}`)
      ).json();
    } catch (e) {
      console.log(`Couldn't load UniProt entry`, e);
    }
  }

  /**
   * LiteMol doesn't work well with the Shadow DOM, therefore
   * we need to use the light DOM.
   * */

  createRenderRoot() {
    return this;
  }

  render() {
    if (!this.sequence || !this.config) {
      return html``;
    }
    return html`
      ${this.cssStyle}
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
              displaystart=${this.displayCoordinates.start}
              displayend="${this.displayCoordinates.end}"
            ></protvista-sequence>
          </div>
        </div>
        ${this.config.categories.map(
          category =>
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
                    ? "opacity:0"
                    : "opacity:1"}"
                >
                  ${this.data[category.name] &&
                    this.getTrack(
                      category.trackType,
                      "non-overlapping",
                      category.color,
                      category.shape,
                      category.name
                    )}
                </div>
              </div>

              <!-- Expanded Categories -->
              ${category.tracks &&
                category.tracks.map(track => {
                  if (this.openCategories.includes(category.name)) {
                    const trackData = this.data[
                      `${category.name}-${track.name}`
                    ];
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
                                category.trackType,
                                "non-overlapping",
                                category.color,
                                category.shape,
                                `${category.name}-${track.name}`
                              )}
                            </div>
                          </div>
                        `
                      : "";
                  }
                })}
              ${!category.tracks
                ? this.data[category.name].map(item => {
                    if (this.openCategories.includes(category.name)) {
                      if (!item || !item.accession) return "";
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
                              "non-overlapping",
                              category.color,
                              category.shape,
                              `${category.name}-${item.accession}`
                            )}
                          </div>
                        </div>
                      `;
                    }
                  })
                : ""}
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
              <protvista-structure
                accession="${this.accession}"
              ></protvista-structure>
            `
          : ""}
        <protvista-tooltip />
      </protvista-manager>
    `;
  }

  updateTooltip(e) {
    const d = e.detail.feature;
    if (!d.tooltipContent) {
      return;
    }
    const tooltip = this.querySelector("protvista-tooltip");
    tooltip.style.setProperty("left", `${e.detail.coords[0] + 2}px`);
    tooltip.style.setProperty("top", `${e.detail.coords[1] + 3}px`);
    tooltip.style.setProperty("display", "block");
    tooltip.title = `${d.type} ${d.start}-${d.end}`;
    tooltip.innerHTML = d.tooltipContent;
  }

  handleCategoryClick(e) {
    const toggle = e.target.getAttribute("data-category-toggle");
    if (!e.target.classList.contains("open")) {
      e.target.classList.add("open");
      this.openCategories = [...this.openCategories, toggle];
    } else {
      e.target.classList.remove("open");
      this.openCategories = [...this.openCategories].filter(d => d !== toggle);
    }
  }

  getCategoryTypesAsString(tracks) {
    return tracks.map(t => t.filter).join(",");
  }

  getFilterComponent(forId) {
    return html`
      <protvista-filter
        style="minWidth: 20%"
        for="track-${forId}"
      ></protvista-filter>
    `;
  }

  getTrack(trackType, layout = "", color = "", shape = "", id = "") {
    // TODO Allow injection of static content into templates https://github.com/Polymer/lit-html/issues/78
    switch (trackType) {
      case "protvista-track":
        return html`
          <protvista-track
            length="${this.sequence.length}"
            layout="${layout}"
            color="${color}"
            shape="${shape}"
            displaystart=${this.displayCoordinates.start}
            displayend="${this.displayCoordinates.end}"
            id="track-${id}"
          >
          </protvista-track>
        `;
      case "protvista-interpro-track":
        return html`
          <protvista-interpro-track
            length="${this.sequence.length}"
            color="${color}"
            shape="${shape}"
            displaystart=${this.displayCoordinates.start}
            displayend="${this.displayCoordinates.end}"
            id="track-${id}"
          >
          </protvista-interpro-track>
        `;
      case "protvista-variation":
        return html`
          <protvista-variation
            length="${this.sequence.length}"
            displaystart=${this.displayCoordinates.start}
            displayend="${this.displayCoordinates.end}"
            id="track-${id}"
          >
          </protvista-variation>
        `;
      case "protvista-variation-graph":
        return html`
          <protvista-variation-graph
            length="${this.sequence.length}"
            displaystart=${this.displayCoordinates.start}
            displayend="${this.displayCoordinates.end}"
            id="track-${id}"
          >
          </protvista-variation-graph>
        `;
      default:
        console.log("No Matching ProtvistaTrack Found.");
        break;
    }
  }
}

export default ProtvistaUniprot;

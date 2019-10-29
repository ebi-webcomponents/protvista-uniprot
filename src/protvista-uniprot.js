import { LitElement, html, css } from "lit-element";
import defaultConfig from "./config.json";
import ProtvistaNavigation from "protvista-navigation";
import ProtvistaTooltip from "protvista-tooltip";
import ProtvistaTrack from "protvista-track";
import ProtvistaSequence from "protvista-sequence";
import ProtvistaVariation from "protvista-variation";
import ProtvistaVariationGraph from "protvista-variation-graph";
import DataLoader from "data-loader";
import ProtvistaFeatureAdapter from "protvista-feature-adapter";
import ProtvistaProteomicsAdapter from "protvista-proteomics-adapter";
import ProtvistaStructureAdapter from "protvista-structure-adapter";
import ProtvistaVariationAdapter from "protvista-variation-adapter";
import ProtvistaFilter, { ProtvistaCheckbox } from "protvista-filter";
import ProtvistaManager from "protvista-manager";
import ProtvistaStructure from "protvista-structure";
import { loadComponent } from "./loadComponents.js";

class ProtvistaUniprot extends LitElement {
  constructor() {
    super();
    this.openCategories = [];
    this.emptyTracks = [];
    this.notooltip = false;
    this.nostructure = false;
    this.hasData = false;
  }

  static get properties() {
    return {
      accession: { type: String },
      sequence: { type: String },
      data: { type: Array },
      openCategories: { type: Array },
      emptyTracks: { type: Array },
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
    loadComponent("protvista-sequence", ProtvistaSequence);
    loadComponent("protvista-variation", ProtvistaVariation);
    loadComponent("protvista-variation-graph", ProtvistaVariationGraph);
    loadComponent("data-loader", DataLoader);
    loadComponent("protvista-feature-adapter", ProtvistaFeatureAdapter);
    loadComponent("protvista-proteomics-adapter", ProtvistaProteomicsAdapter);
    loadComponent("protvista-structure-adapter", ProtvistaStructureAdapter);
    loadComponent("protvista-variation-adapter", ProtvistaVariationAdapter);
    loadComponent("protvista-checkbox", ProtvistaCheckbox);
    loadComponent("protvista-filter", ProtvistaFilter);
    loadComponent("protvista-manager", ProtvistaManager);
    loadComponent("protvista-structure", ProtvistaStructure);
  }

  connectedCallback() {
    super.connectedCallback();
    this.registerWebComponents();
    if (!this.config) {
      this.config = defaultConfig;
    }
    this.loadEntry(this.accession).then(entryData => {
      this.sequence = entryData.sequence.sequence;
      // We need to get the length of the protein before rendering it
    });
    if (!this.notooltip) {
      this.addEventListener("change", e => {
        if (!e.detail.eventtype) {
          this._resetTooltip();
        } else if (e.detail.eventtype === "click") {
          this.updateTooltip(e, true);
        }
      });
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

    this.addEventListener("error", e => {
      // Hide empty tracks
      this.handleTrackHidding(e);
    });

    this.addEventListener("load", e => {
      // Hide empty tracks
      if (e.detail.payload.length <= 0) {
        this.handleTrackHidding(e);
      } else if (!this.hasData) {
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

  handleTrackHidding(e) {
    const hideElement = e.composedPath().find(element => {
      return element.classList && element.classList.contains("track-content");
    });
    if (hideElement && hideElement.dataset.id) {
      this.querySelector(`#${hideElement.dataset.id}`).style.display = "none";
    }
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
      return await (await fetch(
        `https://www.ebi.ac.uk/proteins/api/proteins/${accession}`
      )).json();
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

  categoryTracksAreEmpty(tracks) {
    return tracks.every(track => this.emptyTracks.includes(track.name));
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
              displaystart="1"
              displayend="${this.sequence.length}"
            ></protvista-sequence>
          </div>
        </div>
        ${this.config.categories.map(category => {
          if (!this.categoryTracksAreEmpty(category.tracks)) {
            return html`
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
                  ${this.getTrack(
                    category.trackType,
                    category.adapter,
                    category.url,
                    this.getCategoryTypesAsString(category.tracks),
                    "non-overlapping"
                  )}
                </div>
              </div>

              ${category.tracks.map(track => {
                if (this.openCategories.includes(category.name)) {
                  return html`
                    <div class="category__track" id="track_${track.name}">
                      <div class="track-label" title="${track.tooltip}">
                        ${track.label
                          ? track.label
                          : this.getLabelComponent(track.labelComponent)}
                      </div>
                      <div class="track-content" data-id="track_${track.name}">
                        ${this.getTrack(
                          track.trackType,
                          category.adapter,
                          category.url,
                          track.filter,
                          "non-overlapping"
                        )}
                      </div>
                    </div>
                  `;
                }
              })}
            `;
          }
        })}
        <div class="nav-container">
          <div class="credits"></div>
          <div class="track-content">
            <protvista-sequence
              length="${this.sequence.length}"
              sequence="${this.sequence}"
              displaystart="1"
              displayend="${this.sequence.length}"
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

  getAdapter(adapter, url, trackTypes = "") {
    // TODO Allow injection of static content into templates https://github.com/Polymer/lit-html/issues/78
    switch (adapter) {
      case "protvista-feature-adapter":
        return html`
          <protvista-feature-adapter filters="${trackTypes}">
            <data-loader>
              <source src="${url}${this.accession}" />
            </data-loader>
          </protvista-feature-adapter>
        `;
      case "protvista-structure-adapter":
        return html`
          <protvista-structure-adapter>
            <data-loader>
              <source src="${url}${this.accession}" />
            </data-loader>
          </protvista-structure-adapter>
        `;
      case "protvista-proteomics-adapter":
        return html`
          <protvista-proteomics-adapter filters="${trackTypes}">
            <data-loader>
              <source src="${url}${this.accession}" />
            </data-loader>
          </protvista-proteomics-adapter>
        `;
      case "protvista-variation-adapter":
        return html`
          <protvista-variation-adapter>
            <data-loader>
              <source src="${url}${this.accession}" />
            </data-loader>
          </protvista-variation-adapter>
        `;
      default:
        console.log("No Matching ProtvistaAdapter Found.");
        break;
    }
  }

  getLabelComponent(name) {
    switch (name) {
      case "protvista-filter":
        return html`
          <protvista-filter style="minWidth: 20%"></protvista-filter>
        `;
    }
  }

  getTrack(trackType, adapter, url, trackTypes, layout = "") {
    // TODO Allow injection of static content into templates https://github.com/Polymer/lit-html/issues/78
    switch (trackType) {
      case "protvista-track":
        return html`
          <protvista-track
            length="${this.sequence.length}"
            layout="${layout}"
            displaystart="1"
            displayend="${this.sequence.length}"
          >
            ${this.getAdapter(adapter, url, trackTypes)}
          </protvista-track>
        `;
      case "protvista-variation":
        return html`
          <protvista-variation
            length="${this.sequence.length}"
            displaystart="1"
            displayend="${this.sequence.length}"
          >
            ${this.getAdapter(adapter, url, trackTypes)}
          </protvista-variation>
        `;
      case "protvista-variation-graph":
        return html`
          <protvista-variation-graph
            length="${this.sequence.length}"
            displaystart="1"
            displayend="${this.sequence.length}"
          >
            ${this.getAdapter(adapter, url, trackTypes)}
          </protvista-variation-graph>
        `;
      default:
        console.log("No Matching ProtvistaTrack Found.");
        break;
    }
  }
}

export default ProtvistaUniprot;

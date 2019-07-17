import { LitElement, html, css } from "lit-element";
import defaultConfig from "./config.json";

class ProtvistaUniprot extends LitElement {
  constructor() {
    super();
    this.openCategories = [];
    this.emptyTracks = [];
    this.notooltip = false;
    this.nostructure = false;
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

  static get styles() {
    return css`
      :host {
        font-family: Arial, Helvetica, sans-serif;
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
    `;
  }

  connectedCallback() {
    super.connectedCallback();
    if (!this.config) {
      this.config = defaultConfig;
    }
    this.loadEntry(this.accession).then(entryData => {
      this.sequence = entryData.sequence.sequence;
      // We need to get the length of the protein before rendering it
    });
    if (!this.notooltip) {
      this.shadowRoot.addEventListener("change", e => {
        if (e.detail.eventtype === "click") {
          this.updateTooltip(e, true);
        }
      });
      this.shadowRoot.addEventListener("click", e => {
        if (
          !e.target.closest(".feature") &&
          !e.target.closest("protvista-tooltip")
        ) {
          const tooltip = this.shadowRoot.querySelector("protvista-tooltip");
          tooltip.visible = false;
        }
      });
      document.addEventListener("click", this._resetTooltip);
    }
    this.shadowRoot.addEventListener("load", e => {
      // Hide empty tracks
      if (e.detail.payload.length <= 0) {
        const hideElement = e
          .composedPath()
          .find(
            element =>
              element.classList && element.classList.contains("track-content")
          );
        if (hideElement) {
          this.emptyTracks = [...this.emptyTracks, hideElement.dataset.id];
        }
      }
    });
  }

  disconnectedCallback() {
    if (!this.notooltip) {
      document.removeEventListener("click", this._resetTooltip);
    }
  }

  _resetTooltip(e) {
    if (this.shadowRoot && !e.target.closest("protvista-uniprot")) {
      const tooltip = this.shadowRoot.querySelector("protvista-tooltip");
      tooltip.visible = false;
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

  updated() {
    // if (this.shadowRoot.querySelector("protvista-manager")) {
    //   this.shadowRoot.querySelector("protvista-manager").applyAttributes();
    // }
  }

  render() {
    if (!this.sequence || !this.config) {
      return html``;
    }
    return html`
      <protvista-manager
        attributes="length displaystart displayend highlight activefilters filters"
        additionalsubscribers="protvista-structure"
      >
        <div class="nav-container">
          <div class="action-buttons"></div>
          <div class="track-content">
            <protvista-navigation
              length="${this.sequence.length}"
            ></protvista-navigation>
            <protvista-sequence
              length="${this.sequence.length}"
              sequence="${this.sequence}"
            ></protvista-sequence>
          </div>
        </div>
        ${this.config.categories.map(
          category =>
            html`
              <div class="category">
                <div
                  class="category-label"
                  data-category-toggle="${category.name}"
                  @click="${this.handleCategoryClick}"
                >
                  ${category.label}
                </div>

                <div
                  id="${category.name}"
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
                if (
                  this.openCategories.includes(category.name) &&
                  !this.emptyTracks.includes(track.name)
                ) {
                  return html`
                    <div class="category__track">
                      <div class="track-label">
                        ${track.label
                          ? track.label
                          : this.getLabelComponent(track.labelComponent)}
                      </div>
                      <div class="track-content" data-id="${track.name}">
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
            `
        )}
        <div class="nav-container">
          <div class="credits"></div>
          <div class="track-content">
            <protvista-sequence
              length="${this.sequence.length}"
              sequence="${this.sequence}"
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
    const tooltip = this.shadowRoot.querySelector("protvista-tooltip");
    tooltip.left = e.detail.coords[0] + 2;
    tooltip.top = e.detail.coords[1] + 3;
    tooltip.title = `${d.type} ${d.start}-${d.end}`;
    tooltip.innerHTML = d.tooltipContent;
    tooltip.visible = true;
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
          <protvista-track length="${this.sequence.length}" layout="${layout}">
            ${this.getAdapter(adapter, url, trackTypes)}
          </protvista-track>
        `;
      case "protvista-variation":
        return html`
          <protvista-variation length="${this.sequence.length}">
            ${this.getAdapter(adapter, url, trackTypes)}
          </protvista-variation>
        `;
      case "protvista-variation-graph":
        return html`
          <protvista-variation-graph length="${this.sequence.length}">
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

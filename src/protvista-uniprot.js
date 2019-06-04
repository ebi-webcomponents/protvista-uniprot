import { categories } from "./categories";
import { LitElement, html, css } from "lit-element";

class ProtvistaUniprot extends LitElement {
  static get properties() {
    return {
      accession: { type: String },
      sequence: { type: String },
      data: { type: Array }
    };
  }

  static get styles() {
    return css`
      :host {
        font-family: Arial, Helvetica, sans-serif;
      }

      protvista-manager {
        display: grid;
        grid-template-columns: 200px 1fr;
        grid-gap: 2px 10px;
      }

      protvista-navigation,
      protvista-sequence {
        grid-column-start: 2;
      }

      uuw-litemol-component {
        grid-column: span 2;
      }

      .category-label,
      .track-label {
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
        padding-left: 1em;
      }

      protvista-track {
        border-top: 1px solid #d9faff;
      }

      .aggregate-track-content {
        opacity: 1;
        -webkit-transition: opacity 0.1s;
        /* Safari */
        transition: opacity 0.1s;
      }

      .track-label,
      .track-content {
        display: none;
      }
    `;
  }

  connectedCallback() {
    super.connectedCallback();
    this.loadEntry(this.accession).then(entryData => {
      this.sequence = entryData.sequence.sequence;
      // We need to get the length of the protein before rendering it
    });
    this.addEventListener("change", e => {
      if (e.detail.eventtype === "click") {
        this.updateTooltip(e, true);
      }
    });
    // document.addEventListener("click", this._resetTooltip);
  }

  disconnectedCallback() {
    // document.removeEventListener("click", this._resetTooltip);
  }

  _resetTooltip(e) {
    if (!e.target.closest(".feature")) {
      const tooltip = this.querySelector("protvista-tooltip");
      tooltip.visible = false;
      tooltip.render();
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

  render() {
    if (!this.sequence) {
      return null;
    }
    return html`
      <protvista-manager
        attributes="length displaystart displayend highlight activefilters filters"
        additionalsubscribers="uuw-litemol-component"
      >
        <protvista-navigation
          length="${this.sequence.length}"
        ></protvista-navigation>
        <protvista-sequence
          length="${this.sequence.length}"
          sequence="${this.sequence}"
        ></protvista-sequence>
        ${categories.map(
          category =>
            html`
              <div
                class="category-label"
                data-category-toggle="${category.name}"
                @click="${this.handleCategoryClick}"
              >
                ${category.label}
              </div>
              <div
                class="aggregate-track-content"
                data-toggle-aggregate="${category.name}"
              >
                ${this.getTrack(
                  category.trackType,
                  category.adapter,
                  category.url,
                  this.getCategoryTypesAsString(category.tracks),
                  "non-overlapping"
                )}
              </div>
              ${category.tracks.map(
                track => html`
                  <div class="track-label" data-toggle="${category.name}">
                    ${track.label
                      ? track.label
                      : this.getLabelComponent(track.labelComponent)}
                  </div>
                  <div class="track-content" data-toggle="${category.name}">
                    ${this.getTrack(
                      track.trackType,
                      category.adapter,
                      category.url,
                      track.filter,
                      "non-overlapping"
                    )}
                  </div>
                `
              )}
            `
        )}
        <protvista-sequence
          length="${this.sequence.length}"
          sequence="${this.sequence}"
        ></protvista-sequence>
        <uuw-litemol-component
          accession="${this.accession}"
        ></uuw-litemol-component>
        <protvista-tooltip />
      </protvista-manager>
    `;
  }

  updateTooltip(e) {
    const d = e.detail.feature;
    if (!d.feature || !d.feature.tooltipContent) {
      return;
    }
    const tooltip = this.querySelector("protvista-tooltip");
    tooltip.left = e.detail.coords[0] + 2;
    tooltip.top = e.detail.coords[1] + 3;
    tooltip.title = `${d.feature.type} ${d.start}-${d.end}`;
    tooltip.content = d.feature.tooltipContent;
    tooltip.visible = true;
    tooltip.render();
  }

  handleCategoryClick(e) {
    const toggle = e.target.getAttribute("data-category-toggle");
    if (!e.target.classList.contains("open")) {
      e.target.classList.add("open");
    } else {
      e.target.classList.remove("open");
    }
    this.toggleOpacity(
      this.shadowRoot.querySelector(`[data-toggle-aggregate=${toggle}]`)
    );
    this.shadowRoot
      .querySelectorAll(`[data-toggle=${toggle}]`)
      .forEach(track => this.toggleVisibility(track));
  }

  toggleOpacity(elt) {
    if (elt.style.opacity === "" || parseInt(elt.style.opacity) === 1) {
      elt.style.opacity = 0;
    } else {
      elt.style.opacity = 1;
    }
  }

  toggleVisibility(elt) {
    if (elt.style.display === "" || elt.style.display === "none") {
      elt.style.display = "block";
    } else {
      elt.style.display = "none";
    }
  }

  getCategoryTypesAsString(tracks) {
    return tracks.map(t => t.filter).join(",");
  }

  getAdapter(adapter, url, trackTypes) {
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

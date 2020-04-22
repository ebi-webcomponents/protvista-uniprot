import { LitElement, html } from "lit-element";
import { load } from "data-loader";
import ProtvistaStructure from "protvista-structure";
import ProtvistaDatatable from "protvista-datatable";
import { loadComponent } from "./loadComponents";

const PDBLinks = [
  { name: "PDB", link: "https://www.ebi.ac.uk/pdbe-srv/view/entry/" },
  { name: "RCSB-PDB", link: "https://www.rcsb.org/structure/" },
  { name: "PDBj", link: "https://pdbj.org/mine/summary/" },
  { name: "PDBsum", link: "https://www.ebi.ac.uk/pdbsum/" },
];

const processData = (data) =>
  data.dbReferences
    .filter((xref) => xref.type === "PDB")
    .sort((refA, refB) => refA.id.localeCompare(refB.id))
    .map(({ id, properties }) => {
      if (!properties) {
        return null;
      }
      const { chains, resolution, method } = properties;

      let chain;
      let positions;
      if (chains) {
        const tokens = chains.split("=");
        if (tokens.length === 2) {
          [chain, positions] = tokens;
        }
      }
      return {
        id,
        method,
        resolution: !resolution || resolution === "-" ? null : resolution,
        chain,
        positions,
        protvistaFeatureId: id,
      };
    });

const getColumnConfig = () => ({
  type: {
    label: "PDB Entry",
    resolver: ({ id }) => id,
  },
  method: {
    label: "Method",
    resolver: ({ method }) => method,
  },
  resolution: {
    label: "Resolution",
    resolver: ({ resolution }) => resolution && resolution.replace("A", "Å"),
  },
  chain: {
    label: "Chain",
    resolver: ({ chain }) => chain,
  },
  positions: {
    label: "Positions",
    resolver: ({ positions }) => positions,
  },
  links: {
    label: "Links",
    resolver: ({ id }) =>
      html`
        ${PDBLinks.map((pdbLink) => {
          return html` <a href="${pdbLink.link}${id}">${pdbLink.name}</a> `;
        }).reduce((prev, curr) => html` ${prev} · ${curr} `)}
      `,
  },
});

class ProtvistaUniprotStructure extends LitElement {
  constructor() {
    super();
    loadComponent("protvista-structure", ProtvistaStructure);
    loadComponent("protvista-datatable", ProtvistaDatatable);
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
    const url = `https://www.ebi.ac.uk/proteins/api/proteins/${this.accession}`;
    const { payload } = await load(url);
    if (!payload) return;
    const data = processData(payload);
    if (!data || !data.length) return;
    this.data = data;
    const protvistaDatatableElt = this.querySelector("protvista-datatable");
    // Select the first element in the table
    this.pdbId = this.data[0].id;
    protvistaDatatableElt.columns = getColumnConfig();
    protvistaDatatableElt.data = this.data;
    protvistaDatatableElt.rowClickEvent = this.onTableRowClick;
    protvistaDatatableElt.selectedid = this.pdbId;
  }

  onTableRowClick({ id }) {
    this.pdbId = id;
  }

  /**
   * LiteMol doesn't work well with the Shadow DOM, therefore
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

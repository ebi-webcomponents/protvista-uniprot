import { LitElement, html, css, svg } from 'lit-element';
import { unsafeHTML } from 'lit-html/directives/unsafe-html.js';
import urlJoin from 'url-join';
import { saveAs } from 'file-saver';

import downloadIcon from './icons/download.svg';

import { DownloadConfig } from './protvista-uniprot';

const downloadFiles = (
  downloadConfig: DownloadConfig,
  format = 'json',
  accession: string
) => {
  downloadConfig.forEach((config) => {
    saveAs(
      urlJoin(
        config.url,
        `${accession}.${format}`,
        `${accession}_${config.type}.${format}`
      ),
      `${accession}_${config.type}.${format}`
    );
  });
};

class DownloadPanel extends LitElement {
  open: boolean;
  format: string;
  config?: DownloadConfig;
  accession?: string;

  constructor() {
    super();
    this.open = false;
    this.format = 'json';
  }

  static get properties() {
    return {
      accession: { type: String },
      config: { type: Array },
      open: { type: Boolean },
      format: { type: String },
    };
  }

  static get styles() {
    return css`
      :host {
        position: relative;
      }

      :host button {
        display: inline-block;
        background-color: #FFF;
        border: none;
        padding: 0.2rem;
        margin: 0;
        text-decoration: none;
        font-size: 1rem;
        cursor: pointer;
        text-align: center;
        color: #00709b;
        transition: opacity 250ms ease-in-out, transform 150ms ease;
        opacity: 0.8
        -webkit-appearance: none;
        -moz-appearance: none;
      }

      :host button:hover {
        opacity:1;
      }

      :host button svg {
        width: 1.5rem;
        height: 1.5rem;
        transition: opacity 250ms ease-in-out, transform 150ms ease;
        opacity: 0.8;
      }
      :host button svg:hover {
        opacity: 1;
      }

      .download-menu {
        display: none;
        position: absolute;
        background-color: #fff;
        padding: 1rem;
        box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24);
        transition: all 0.3s cubic-bezier(.25,.8,.25,1);      
      }
      :host(:hover) .download-menu {
        display: block;
      }
      .download-menu ul {
        margin: 0;
        padding: 0;
      }
      .download-menu li {
        list-style: none;
        margin: 0.5rem 0;
      }
    `;
  }

  handleDownload() {
    if (this.config && this.accession) {
      downloadFiles(this.config, this.format, this.accession);
    }
  }

  handleSetFormat(format: string) {
    this.format = format;
  }

  downloadSVG() {
    return svg`${unsafeHTML(downloadIcon)}`;
  }

  render() {
    return html`
      <button title="Download">${this.downloadSVG()}</button>
      <div class="${`download-menu ${this.open && `download-menu-open`}`}">
        <ul>
          <li>
            <label
              ><input
                type="radio"
                name="download-type"
                value="json"
                checked
                @click="${() => this.handleSetFormat('json')}"
              />JSON</label
            >
          </li>
          <li>
            <label
              ><input
                type="radio"
                name="download-type"
                value="xml"
                @click="${() => this.handleSetFormat('xml')}"
              />XML</label
            >
          </li>
          <li>
            <label
              ><input
                type="radio"
                name="download-type"
                value="gff"
                @click="${() => this.handleSetFormat('gff')}"
              />GFF</label
            >
          </li>
        </ul>
        <button @click="${this.handleDownload}">Download</button>
      </div>
    `;
  }
}

export default DownloadPanel;

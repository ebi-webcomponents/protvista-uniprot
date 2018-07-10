import {
    categories
} from './categories';
import {
    html,
    render
} from 'lit-html';
import _isEmpty from 'lodash-es/isEmpty';

import '../styles/protvista-uniprot.css';

class ProtvistaUniprot extends HTMLElement {

    constructor() {
        super();
        this._accession = this.getAttribute('accession');
        // get properties here
    }

    connectedCallback() {
        this.loadEntry(this._accession).then(entryData => {
            this._sequenceLength = entryData.sequence.sequence.length;
            // We need to get the length of the protein before rendering it
            this._render();
        })
    }

    async loadEntry(accession) {
        try {
            return await (await fetch(`https://www.ebi.ac.uk/proteins/api/proteins/${accession}`)).json();
        } catch (e) {
            console.log(`Couldn't load UniProt entry`, e);
        }
    }

    _render() {
        const mainHtml = () => html `
        <protvista-manager attributes="length displaystart displayend highlightstart highlightend variantfilters" additionalsubscribers="uuw-litemol-component">
            <protvista-navigation length="${this._sequenceLength}"></protvista-navigation>
            <protvista-sequence length="${this._sequenceLength}"></protvista-sequence>
            ${categories.map(category =>
                html`
                    <div class="category-label" data-category-toggle="${category.name}" name="pv-up-cat-${category.name}">
                        ${category.label}
                    </div>
                    <div class="aggregate-track-content" data-toggle-aggregate="${category.name}" name="pv-up-cat-${category.name}">
                        ${this.getTrack(category.trackType, category.adapter, category.url, this.getCategoryTypesAsString(category.tracks), `pv-up-cat-${category.name}`, 'non-overlapping')}
                    </div>
                    ${category.tracks.map(track => html`
                        <div class="track-label" data-toggle="${category.name}" name="pv-up-track-${track.filter || category.name}">
                            ${track.label ? track.label : this.getLabelComponent(track.labelComponent)}
                        </div>
                        <div class="track-content" data-toggle="${category.name}" name="pv-up-track-${track.filter || category.name}">
                            ${this.getTrack(track.trackType, category.adapter, category.url, track.filter, `pv-up-track-${track.filter || category.name}`, 'non-overlapping')}
                        </div>`)}
                `
            )}
            <protvista-sequence id="seq1" length="${this._sequenceLength}"></protvista-sequence>
            <uuw-litemol-component accession="${this._accession}"></uuw-litemol-component>
        </protvista-manager>`;
        render(mainHtml(), this);
        this.querySelectorAll('.category-label').forEach(cat => {
            cat.addEventListener('click', e => {
                this.handleCategoryClick(e);
            });
        });
        this._listenLoaders();
    }

    _listenLoaders() {
        this.addEventListener('load', (e) => {
            if (e.target !== this) {
                e.stopPropagation(); //Not sure we want to stop propagation here
                try {
                    if (e.detail.payload.errorMessage) {
                        throw e.detail.payload.errorMessage;
                    }
                    switch (e.target.localName) {
                        case ('protvista-feature-adapter') :
                            this._removeEmptyDataElements(e.detail.payload, e.target.attributes.name.nodeValue);
                            break;
                        case ('protvista-topology-adapter') :
                            break;
                        case ('protvista-topology-adapter') :
                            break;
                    }
                } catch (error) {
                    this.dispatchEvent(new CustomEvent(
                        'error', {
                            detail: error,
                            bubbles: true,
                            cancelable: true
                        }
                    ));
                }
            }
        });
    }

    _removeEmptyDataElements(data, nodeName) {
        const parentNode = document.getElementsByTagName('protvista-manager')[0];
        if (data && (data.length === 0)) {
            const allByName = document.getElementsByName(nodeName);
            while (allByName.length !== 0) {
                let firstEl = allByName[0];
                parentNode.removeChild(firstEl);
            }
        }
    }

    handleCategoryClick(e) {
        const toggle = e.target.getAttribute('data-category-toggle');
        if (!e.target.classList.contains('open')) {
            e.target.classList.add('open');
        } else {
            e.target.classList.remove('open');
        }
        this.toggleOpacity(this.querySelector(`[data-toggle-aggregate=${toggle}]`));
        this.querySelectorAll(`[data-toggle=${toggle}]`).forEach(track => this.toggleVisibility(track));
    }

    toggleOpacity(elt) {
        if (elt.style.opacity === '' || parseInt(elt.style.opacity) === 1) {
            elt.style.opacity = 0;
        } else {
            elt.style.opacity = 1;
        }
    }

    toggleVisibility(elt) {
        if (elt.style.display === '' || elt.style.display === 'none') {
            elt.style.display = 'block';
        } else {
            elt.style.display = 'none';
        }
    }

    getCategoryTypesAsString(tracks) {
        return tracks.map(t => t.filter).join(",");
    }

    getAdapter(adapter, url, trackTypes, name) {
        // TODO Allow injection of static content into templates https://github.com/Polymer/lit-html/issues/78
        switch (adapter) {
            case ('protvista-feature-adapter'):
                return html `
                <protvista-feature-adapter filters="${trackTypes}" name="${name}">
                    <data-loader>
                        <source src="${url}${this._accession}" />
                    </data-loader>
                </protvista-feature-adapter>
                `;
            case ('protvista-topology-adapter'):
                return html `
                <protvista-topology-adapter filters="${trackTypes}" name="${name}">
                    <data-loader>
                        <source src="${url}${this._accession}" />
                    </data-loader>
                </protvista-topology-adapter>
                `;
            case ('protvista-structure-adapter'):
                return html `
                <protvista-structure-adapter name="${name}">
                    <data-loader>
                        <source src="${url}${this._accession}" />
                    </data-loader>
                </protvista-structure-adapter>
                `;
            case ('protvista-proteomics-adapter'):
                return html `
                <protvista-proteomics-adapter filters="${trackTypes}" name="${name}">
                    <data-loader>
                        <source src="${url}${this._accession}" />
                    </data-loader>
                </protvista-proteomics-adapter>
            `;
            case 'protvista-variation-adapter':
                return html `
                    <protvista-variation-adapter name="${name}">
                        <data-loader>
                            <source src="${url}${this._accession}" />
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
            case ('protvista-variation-filter'):
                return html `<protvista-variation-filter></protvista-variation-filter>`;
        }
    }

    getTrack(trackType, adapter, url, trackTypes, name = '', layout = '') {
        // TODO Allow injection of static content into templates https://github.com/Polymer/lit-html/issues/78
        switch (trackType) {
            case ('protvista-track'):
                return html `
                <protvista-track length="${this._sequenceLength}" tooltip-event="click" layout="${layout}">
                    ${this.getAdapter(adapter, url, trackTypes, name)}
                </protvista-track>
                `;
            case ('protvista-variation'):
                return html `
                <protvista-variation length="${this._sequenceLength}" tooltip-event="click">
                    ${this.getAdapter(adapter, url, trackTypes, name)}
                </protvista-variation>
                `;
            case 'protvista-variation-graph':
                return html `
                    <protvista-variation-graph length="${this._sequenceLength}" tooltip-event="click">
                        ${this.getAdapter(adapter, url, trackTypes, name)}
                    </protvista-variation-graph>
                `;
            default:
                console.log("No Matching ProtvistaTrack Found.");
                break;
        }

    }

}

export default ProtvistaUniprot;
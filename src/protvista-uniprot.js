import {
    categories
} from './categories';
import {
    html,
    render
} from 'lit-html';
import _each from 'lodash-es/each';

import '../styles/protvista-uniprot.css';

class ProtvistaUniprot extends HTMLElement {

    constructor() {
        super();
        this._accession = this.getAttribute('accession');
        this._processTopology = true;
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
                this._addCategoriesAndTracks(category)
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
        this._listenEmptyData();
    }

    _addCategoriesAndTracks(category) {
        if (!category.tracks) {
            return html`
                <div class="delayed-container">
                    <div class="delayed-category-grid" name="pv-up-cat-delayed-${category.name}">
                        ${this._addCategoryLabel(category)}
                        ${this._addCategoryContent(category, true)}
                    </div>                    
                    <div class="delayed-tracks-grid" name="pv-up-tracks-delayed-${category.name}">
                    </div>
                </div>
            `;
        } else {
            return html`  
                ${this._addCategoryLabel(category)}
                ${this._addCategoryContent(category)}
                ${category.tracks.map(track => html`
                    ${this._addTrackLabel(category.name, track)}                    
                    ${this._addTrackContent(category, track)}
                `)}
            `;
        }
    }

    _addCategoryLabel(category) {
        return html`
            <div class="category-label" data-category-toggle="${category.name}" name="pv-up-cat-${category.name}">
                ${category.label}
            </div>
        `;
    }

    _addCategoryContent(category, adapter = false) {
        if (adapter === true) {
            return html`<div class="aggregate-track-content" data-toggle-aggregate="${category.name}" name="pv-up-cat-${category.name}">
                ${this.getAdapter(category.adapter, category.url, '', category.name)}
                </div>    
            `;
        } else {
            return html`<div class="aggregate-track-content" data-toggle-aggregate="${category.name}" name="pv-up-cat-${category.name}">
                ${this.getTrack(category.trackType, category.adapter, category.url, this.getCategoryTypesAsString(category.tracks), `pv-up-cat-${category.name}`, 'non-overlapping')}
                </div>
            `;
        }
    }

    _addTrackLabel(categoryName, track, type) {
        type = type || track.filter;
        return html`
            <div class="track-label" data-toggle="${categoryName}" name="pv-up-track-${type || categoryName}">
                ${track.label ? track.label : this.getLabelComponent(track.labelComponent)}
            </div>
        `;
    }

    _addTrackContent(category, track) {
        return html`
            <div class="track-content" data-toggle="${category.name}" name="pv-up-track-${track.filter || category.name}">
                ${this.getTrack(track.trackType, category.adapter, category.url, track.filter, `pv-up-track-${track.filter || category.name}`, 'non-overlapping')}
            </div>
        `;
    }

    _listenLoaders() {
        this.addEventListener('load', (e) => {
            if (e.target !== this) {
                e.stopPropagation(); //Not sure we want to stop propagation here
                try {
                    if (e.detail.payload.errorMessage) {
                        throw e.detail.payload.errorMessage;
                    }
                    if (e.detail.adapterType === 'type') {
                        this._listenDelayedData(e.detail.payload, e.detail.type);
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

    _listenDelayedData(data, category) {
        if (this._processTopology) {
            this._processTopology = false;

            const protvistaCategory = this._addCategoryDelayedContent(data, category);
            this._addTracksDelayedContent(data, category, protvistaCategory);
        }
    }

    _addCategoryDelayedContent(data, category) {
        const aggregateTrack = document.querySelector(`.aggregate-track-content[name="pv-up-cat-${category}"]`);
        const htmlCategory = () => html `
                <protvista-track length="${this._sequenceLength}" tooltip-event="click" layout="non-overlapping">                    
                </protvista-track>
            `;
        render(htmlCategory(), aggregateTrack);

        let catData = [];
        _each(data, type => {catData = catData.concat(type.features)});
        const protvistaCategory = aggregateTrack.getElementsByTagName('protvista-track')[0];
        protvistaCategory.data = catData;
        return protvistaCategory;
    }

    _addTracksDelayedContent(data, category, protvistaCategory) {
        const delayedGrid = document.querySelector(`.delayed-tracks-grid[name="pv-up-tracks-delayed-${category}"]`);
        //without _displayend and _displaystart it does not work, why not???
        const htmlTracks = () => html `
            ${data.map(track => html`
                ${this._addTrackLabel(category, track, track.type)}
                <div class="track-content" data-toggle="${category}" name="pv-up-track-${track.type}">
                    <protvista-track length="${this._sequenceLength}" tooltip-event="click" layout="non-overlapping" 
                        displayend="${protvistaCategory._displayend}" displaystart="${protvistaCategory._displaystart}">                    
                    </protvista-track>
                </div>`)}
        `;
        render(htmlTracks(), delayedGrid);

        const protvistaTracks = delayedGrid.getElementsByTagName('protvista-track');
        _each(data, (type, index) => {
            protvistaTracks[index].data = type.features;
            protvistaTracks[index].initZoom();
        });
    }

    _listenEmptyData() {
        this.addEventListener('empty', (e) => {
            if (e.target !== this) {
                e.stopPropagation(); //Not sure we want to stop propagation here
                try {
                    this._removeEmptyDataElements(e.target.attributes.name.nodeValue);
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

    _removeEmptyDataElements(nodeName) {
        const parentNode = document.getElementsByTagName('protvista-manager')[0];
        const allByName = document.getElementsByName(nodeName);
        while (allByName.length !== 0) {
            let firstEl = allByName[0];
            parentNode.removeChild(firstEl);
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
        return tracks.map(t => t.filter).join(",").replace(/,{2,}/g, '');
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
                <protvista-topology-adapter name="${name}">
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
                console.log(`No Matching ProtvistaAdapter Found : ${adapter}.`);
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
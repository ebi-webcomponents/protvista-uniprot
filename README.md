# protvista-uniprot

A Web Component which uses [Nightingale](https://github.com/ebi-webcomponents/nightingale) components to display protein sequence information.

![Image of protvista-uniprot](protvista.png)

## Compatibility

- [protvista-uniprot v3](https://github.com/ebi-webcomponents/protvista-uniprot) is compatible with [nightingale v5](https://github.com/ebi-webcomponents/nightingale)
- [protvista-uniprot v2](https://github.com/ebi-webcomponents/protvista-uniprot/tree/v2) is compatible with [nightingale v3](https://github.com/ebi-webcomponents/nightingale/tree/v3)

## Usage

### Use within an HTML file

Create an [es-module](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules) import within a static HTML file:

```html
<script type="module" src="./protvista-uniprot.mjs"></script>
```

and then the component can be displayed with:

```html
<protvista-uniprot accession="P05067"></protvista-uniprot>
```

### Importing as a module

```
import ProtvistaUniprot from 'protvista-uniprot';
...
window.customElements.define('protvista-uniprot', ProtvistaUniprot);
```

You can then use it like this:

```
<protvista-uniprot accession="P05067" />
```

### API

- accession: String
- config?: Array [see below](#configuration)
- nostructure?: Boolean(false)

## Development

Run `yarn install` to install dependencies and `yarn start` to start the local server.

## Configuration

You can pass your own configuration to the component using the `config` attribute/property.

```
{
  "categories": [
    {
      "name": string,
      "label": string,
      "trackType": nightingale-track|nightingale-linegraph-track|nightingale-variation,
      "adapter": feature-adapter|structure-adapter|proteomics-adapter|variation-adapter,
      "url": string,
      "tracks": [
        {
          "name": string,
          "label": string,
          "filter": string,
          "trackType": "nightingale-track|nightingale-linegraph-track|nightingale-variation",
          "tooltip": string
        }
      ]
    }
  ]
}
```

## Events

Custom `protvista-event` are emitted:

- when at least one of the track returns data

```
detail: {
    hasData: true
}
```

## Publishing

```
npm login; rm -rf node_modules dist; yarn; yarn build; yarn publish; git push
```

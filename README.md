# protvista-uniprot

A Web Component which uses [Nightingale](https://github.com/ebi-webcomponents/nightingale) components to display protein sequence information.

![Image of protvista-uniprot](protvista.png)

## 📣 Monthly Office Hours

Have questions about using or contributing to ProtVista?

We host regular virtual office hours to help with setup, integration, and contributions. Everyone is welcome — no registration required.

See dates and joining details here: [Office Hours](./CONTRIBUTING.md#office-hours)

## Contributing

We welcome contributions!  
Please see [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, pull request guidelines, and office hours.

## Compatibility

- [protvista-uniprot v3](https://github.com/ebi-webcomponents/protvista-uniprot) is compatible with [nightingale v5](https://github.com/ebi-webcomponents/nightingale)
- [protvista-uniprot v2](https://github.com/ebi-webcomponents/protvista-uniprot/tree/v2) is compatible with [nightingale v3](https://github.com/ebi-webcomponents/nightingale/tree/v3)

## Usage

### Use within an HTML file

Create an [ES module](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules) import within a static HTML file:

```html
<script type="module" src="./protvista-uniprot.mjs"></script>
```

Then display the component:

```html
<protvista-uniprot accession="P05067"></protvista-uniprot>
```

### Importing as a module

```js
import ProtvistaUniprot from 'protvista-uniprot';

window.customElements.define('protvista-uniprot', ProtvistaUniprot);
```

You can then use it like this:

```html
<protvista-uniprot accession="P05067"></protvista-uniprot>
```

## API

- `accession`: `string`
- `config?`: `Array` (see [Configuration](#configuration))
- `nostructure?`: `boolean` (default: `false`)

## Development

Run:

```bash
yarn install
yarn start
```

to install dependencies and start the local development server.

## Configuration

You can pass your own configuration to the component using the `config` attribute/property.

```json
{
  "categories": [
    {
      "name": "string",
      "label": "string",
      "trackType": "nightingale-track-canvas|nightingale-linegraph-track|nightingale-variation",
      "adapter": "feature-adapter|structure-adapter|proteomics-adapter|variation-adapter",
      "url": "string",
      "tracks": [
        {
          "name": "string",
          "label": "string",
          "filter": "string",
          "trackType": "nightingale-track-canvas|nightingale-linegraph-track|nightingale-variation",
          "tooltip": "string"
        }
      ]
    }
  ]
}
```

## Events

A custom `protvista-event` is emitted:

- When at least one of the tracks returns data

Example event detail:

```js
detail: {
  hasData: true;
}
```

## Publishing

```bash
npm login
rm -rf node_modules dist
yarn
yarn build
yarn publish
git push
```

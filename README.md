# protvista-uniprot

A Web Component which uses [Nightingale](https://github.com/ebi-webcomponents/nightingale) components to display protein sequence information.

![Image of protvista-uniprot](protvista.png)

## Usage

See [here](https://codepen.io/xwatkins/pen/rXpZXX)

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
      "trackType": protvista-track|protvista-variation-graph|protvista-variation,
      "adapter": protvista-feature-adapter|protvista-structure-adapter|protvista-proteomics-adapter|protvista-variation-adapter,
      "url": string,
      "tracks": [
        {
          "name": string,
          "label": string,
          "filter": string,
          "trackType": "protvista-track|protvista-variation-graph|protvista-variation",
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

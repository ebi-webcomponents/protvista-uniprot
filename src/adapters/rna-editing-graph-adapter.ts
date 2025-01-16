import { RnaEditing } from './types/rna-editing';

const transformData = (data: RnaEditing) => {
  if (data.sequence && data.features.length) {
    const rnaEdits = data.features.map((f) => ({
      ...f,
      accession: f.variantType.genomicLocation?.join(', '),
      start: f.locationType.position,
    }));

    const total = new Uint8ClampedArray(data.sequence.length);
    const missense = new Uint8ClampedArray(data.sequence.length);
    const synonymous = new Uint8ClampedArray(data.sequence.length);

    for (const { start, variantType } of rnaEdits) {
      const index = +start;
      if (index >= 0 && index <= data.sequence.length) {
        total[index] += 1;
        if (variantType.consequenceType === 'missense') {
          missense[index] += 1;
        } else if (variantType.consequenceType === 'synonymous') {
          synonymous[index] += 1;
        }
      }
    }

    const range = [0, Math.max(...total)];
    const graphData = [
      {
        name: 'missense',
        range,
        color: 'darkgrey',
        values: [...missense].map((value, index) => ({
          position: index,
          value: value,
        })),
      },
      {
        name: 'synonymous',
        range,
        color: 'red',
        values: [...synonymous].map((value, index) => ({
          position: index,
          value: value,
        })),
      },
    ];
    return graphData;
  }
};

export default transformData;

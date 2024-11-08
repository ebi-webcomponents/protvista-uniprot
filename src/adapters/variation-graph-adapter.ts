const transformData = (data) => {
  if (data.sequence && data.features.length) {
    const variants = data.features.map((variant) => ({
      ...variant,
      accession: variant.genomicLocation?.join(', '),
      start: variant.begin,
    }));

    const total = new Uint8ClampedArray(data.sequence.length);
    const diseaseTotal = new Uint8ClampedArray(data.sequence.length);

    for (const { start, association } of variants) {
      const index = +start;
      // skip if the variant is outside of bounds
      // eslint-disable-next-line no-continue
      if (index < 1 || index > data.sequence.length) continue;

      // eslint-disable-next-line no-plusplus
      total[index]++;

      // eslint-disable-next-line no-continue
      if (!association) continue;
      const hasDisease = association.find(
        (association) => association.disease === true
      );
      // eslint-disable-next-line no-plusplus
      if (hasDisease) diseaseTotal[index]++;
    }

    const graphData = [
      {
        name: 'variant',
        range: [0, Math.max(Math.max(...total), Math.max(...diseaseTotal))],
        color: 'darkgrey',
        values: [...total].map((value, index) => ({
          position: index,
          value: value,
        })),
      },
      {
        name: 'disease causing variant',
        range: [0, Math.max(Math.max(...total), Math.max(...diseaseTotal))],
        color: 'red',
        values: [...diseaseTotal].map((value, index) => ({
          position: index,
          value: value,
        })),
      },
    ];
    return graphData;
  }
};

export default transformData;

import {
  ProteinsAPIVariation,
  AminoAcid,
} from '@nightingale-elements/nightingale-variation';

// TODO: import types
export type RNAEditing = any;

const transformData = (
  data: ProteinsAPIVariation
): {
  sequence: string;
  variants: RNAEditing[];
} => {
  const { sequence, features } = data;
  const variants = features.map((variant) => ({
    ...variant,
    accession: variant.genomicLocation?.join(', '),
    variant: variant.alternativeSequence
      ? variant.alternativeSequence
      : AminoAcid.Empty,
    start: +variant.begin,
    tooltipContent: 'foo',
  }));
  return variants ? { sequence, variants } : null;
};

export default transformData;

import {
  ProteinsAPIVariation,
  VariationDatum,
} from '@nightingale-elements/nightingale-variation';

import formatTooltip from './tooltip';

import { Xref, SourceType, Variant, AminoAcid } from './types';

export type TransformedVariant = VariationDatum & Variant;

const getSourceType = (xrefs: Xref[], sourceType: SourceType) => {
  const xrefNames = xrefs ? xrefs.map((ref) => ref.name) : [];
  if (sourceType === 'uniprot' || sourceType === 'mixed') {
    xrefNames.push('uniprot');
  }
  return xrefNames;
};

export const transformData = (
  data: ProteinsAPIVariation
): {
  sequence: string;
  variants: TransformedVariant[];
} => {
  const { sequence, features } = data;
  const variants = features.map((variant) => ({
    ...variant,
    accession: variant.genomicLocation?.join(', '),
    variant: variant.alternativeSequence
      ? variant.alternativeSequence
      : AminoAcid.Empty,
    start: variant.begin,
    xrefNames: getSourceType(variant.xrefs, variant.sourceType),
    hasPredictions: variant.predictions && variant.predictions.length > 0,
    tooltipContent: formatTooltip(variant),
  }));
  if (!variants) return null;
  return { sequence, variants };
};

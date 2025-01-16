import {
  AminoAcid,
  VariationDatum,
} from '@nightingale-elements/nightingale-variation';
import { RnaEditing } from './types/rna-editing';

const transformData = ({
  sequence,
  features,
}: RnaEditing): {
  sequence: string;
  variants: VariationDatum[];
} => {
  const variants = features.map((feature) => ({
    ...feature,
    accession: feature.variantType.genomicLocation?.join(', '),
    variant: feature.variantType.mutatedType || AminoAcid.Empty,
    start: +feature.locationType.position.position,
    end: +feature.locationType.position.position,
    tooltipContent: 'foo',
    xrefNames: [],
    hasPredictions: false,
    consequenceType: feature.variantType.consequenceType,
  }));
  return { sequence, variants };
};

export default transformData;

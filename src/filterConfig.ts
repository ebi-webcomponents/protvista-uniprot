import { ClinicalSignificance } from 'protvista-variation-adapter/dist/es/variants';

const scaleColors = {
  UPDiseaseColor: '#990000',
  UPNonDiseaseColor: '#99cc00',
  predictedColor: '#4c8acd',
  othersColor: '#009e73',
};

const consequences = {
  uncertain: [/uncertain/i, /conflicting/i, /unclassified/i, /risk factor/i],
};

const significanceMatches = (
  clinicalSignificance: ClinicalSignificance[],
  values: RegExp[]
) =>
  clinicalSignificance.some(({ type }) => {
    return values.some((rx) => rx.test(type));
  });

export const getFilteredVariants = (
  variants: ProtvistaVariationData,
  callbackFilter: (variantPos: ProtvistaVariant) => void
) =>
  variants.map((variant) => {
    const matchingVariants = variant.variants.filter((variantPos) =>
      callbackFilter(variantPos)
    );
    return {
      ...variant,
      variants: [...matchingVariants],
    };
  });

const filterConfig = [
  {
    name: 'disease',
    type: {
      name: 'consequence',
      text: 'Filter Consequence',
    },
    options: {
      labels: ['Likely disease'],
      colors: [scaleColors.UPDiseaseColor],
    },
    filterData: (variants: ProtvistaVariationData) =>
      getFilteredVariants(variants, (variantPos) =>
        variantPos.association?.some((association) => association.disease)
      ),
  },
  {
    name: 'predicted',
    type: {
      name: 'consequence',
      text: 'Filter Consequence',
    },
    options: {
      labels: ['Predicted consequence'],
      colors: [scaleColors.predictedColor],
    },
    filterData: (variants: ProtvistaVariationData) =>
      getFilteredVariants(variants, (variantPos) => variantPos.hasPredictions),
  },
  {
    name: 'nonDisease',
    type: {
      name: 'consequence',
      text: 'Filter Consequence',
    },
    options: {
      labels: ['Likely benign'],
      colors: [scaleColors.UPNonDiseaseColor],
    },
    filterData: (variants: ProtvistaVariationData) =>
      getFilteredVariants(variants, (variantPos) =>
        variantPos.association?.some(
          (association) => association.disease === false
        )
      ),
  },
  {
    name: 'uncertain',
    type: {
      name: 'consequence',
      text: 'Filter Consequence',
    },
    options: {
      labels: ['Uncertain'],
      colors: [scaleColors.othersColor],
    },
    filterData: (variants: ProtvistaVariationData) =>
      getFilteredVariants(
        variants,
        (variantPos) =>
          (typeof variantPos.clinicalSignificances === 'undefined' &&
            !variantPos.hasPredictions) ||
          (variantPos.clinicalSignificances &&
            significanceMatches(
              variantPos.clinicalSignificances,
              consequences.uncertain
            ))
      ),
  },
  {
    name: 'UniProt',
    type: {
      name: 'provenance',
      text: 'Filter Provenance',
    },
    options: {
      labels: ['UniProt reviewed'],
      colors: ['#9f9f9f'],
    },
    filterData: (variants: ProtvistaVariationData) =>
      getFilteredVariants(
        variants,
        (variantPos) =>
          variantPos.xrefNames &&
          (variantPos.xrefNames.includes('uniprot') ||
            variantPos.xrefNames.includes('UniProt'))
      ),
  },
  {
    name: 'ClinVar',
    type: {
      name: 'provenance',
      text: 'Filter Provenance',
    },
    options: {
      labels: ['ClinVar reviewed'],
      colors: ['#9f9f9f'],
    },
    filterData: (variants: ProtvistaVariationData) =>
      getFilteredVariants(
        variants,
        (variantPos) =>
          variantPos.xrefNames &&
          (variantPos.xrefNames.includes('ClinVar') ||
            variantPos.xrefNames.includes('clinvar'))
      ),
  },
  {
    name: 'LSS',
    type: {
      name: 'provenance',
      text: 'Filter Provenance',
    },
    options: {
      labels: ['Large scale studies'],
      colors: ['#9f9f9f'],
    },
    filterData: (variants: ProtvistaVariationData) =>
      getFilteredVariants(
        variants,
        (variantPos) =>
          variantPos.sourceType === 'large_scale_study' ||
          variantPos.sourceType === 'mixed'
      ),
  },
];

const countVariantsForFilter = (
  filterName: 'disease' | 'nonDisease' | 'uncertain' | 'predicted',
  variant: ProtvistaVariant
) => {
  const variantWrapper = [{ variants: [variant] }];
  const filter = filterConfig.find((filter) => filter.name === filterName);
  if (filter) {
    return filter.filterData(variantWrapper)[0].variants.length > 0;
  }
  return false;
};

export const colorConfig = (variant: ProtvistaVariant) => {
  if (countVariantsForFilter('disease', variant)) {
    return scaleColors.UPDiseaseColor;
  } else if (countVariantsForFilter('nonDisease', variant)) {
    return scaleColors.UPNonDiseaseColor;
  } else if (countVariantsForFilter('uncertain', variant)) {
    return scaleColors.othersColor;
  } else if (countVariantsForFilter('predicted', variant)) {
    return scaleColors.predictedColor;
  }
  return scaleColors.othersColor;
};

export default filterConfig;

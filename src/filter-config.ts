import { ClinicalSignificance } from 'variation-adapter/dist/es/variants';

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

const filterPredicates = {
  disease: (variantPos) =>
    variantPos.association?.some((association) => association.disease),
  predicted: (variantPos) => variantPos.hasPredictions,
  nonDisease: (variantPos) =>
    variantPos.association?.some(
      (association) => association.disease === false
    ),
  uncertain: (variantPos) =>
    (typeof variantPos.clinicalSignificances === 'undefined' &&
      !variantPos.hasPredictions) ||
    (variantPos.clinicalSignificances &&
      significanceMatches(
        variantPos.clinicalSignificances,
        consequences.uncertain
      )),
  UniProt: (variantPos) =>
    variantPos.xrefNames &&
    (variantPos.xrefNames.includes('uniprot') ||
      variantPos.xrefNames.includes('UniProt')),
  ClinVar: (variantPos) =>
    variantPos.xrefNames &&
    (variantPos.xrefNames.includes('ClinVar') ||
      variantPos.xrefNames.includes('clinvar')),
  LSS: (variantPos) =>
    variantPos.sourceType === 'large_scale_study' ||
    variantPos.sourceType === 'mixed',
};

const filterConfig = [
  {
    name: 'disease',
    type: {
      name: 'consequence',
      text: 'Filter Consequence',
    },
    options: {
      label: 'Likely pathogenic or pathogenic',
      color: scaleColors.UPDiseaseColor,
    },
    filterPredicate: filterPredicates['disease'],
    filterData: (variants: ProtvistaVariationData) =>
      getFilteredVariants(variants, filterPredicates['disease']),
  },
  {
    name: 'predicted',
    type: {
      name: 'consequence',
      text: 'Filter Consequence',
    },
    options: {
      label: 'Predicted consequence',
      color: scaleColors.predictedColor,
    },
    filterPredicate: filterPredicates['predicted'],
    filterData: (variants: ProtvistaVariationData) =>
      getFilteredVariants(variants, filterPredicates['predicted']),
  },
  {
    name: 'nonDisease',
    type: {
      name: 'consequence',
      text: 'Filter Consequence',
    },
    options: {
      label: 'Likely benign or benign',
      color: scaleColors.UPNonDiseaseColor,
    },
    filterPredicate: filterPredicates['nonDisease'],
    filterData: (variants: ProtvistaVariationData) =>
      getFilteredVariants(variants, filterPredicates['nonDisease']),
  },
  {
    name: 'uncertain',
    type: {
      name: 'consequence',
      text: 'Filter Consequence',
    },
    options: {
      label: 'Uncertain significance',
      color: scaleColors.othersColor,
    },
    filterPredicate: filterPredicates['uncertain'],
    filterData: (variants: ProtvistaVariationData) =>
      getFilteredVariants(variants, filterPredicates['uncertain']),
  },
  {
    name: 'UniProt',
    type: {
      name: 'provenance',
      text: 'Filter Provenance',
    },
    options: {
      label: 'UniProt reviewed',
      color: '#9f9f9f',
    },
    filterPredicate: filterPredicates['UniProt'],
    filterData: (variants: ProtvistaVariationData) =>
      getFilteredVariants(variants, filterPredicates['UniProt']),
  },
  {
    name: 'ClinVar',
    type: {
      name: 'provenance',
      text: 'Filter Provenance',
    },
    options: {
      label: 'ClinVar',
      color: '#9f9f9f',
    },
    filterPredicate: filterPredicates['ClinVar'],
    filterData: (variants: ProtvistaVariationData) =>
      getFilteredVariants(variants, filterPredicates['ClinVar']),
  },
  {
    name: 'LSS',
    type: {
      name: 'provenance',
      text: 'Filter Provenance',
    },
    options: {
      label: 'Large scale studies',
      color: '#9f9f9f',
    },
    filterPredicate: filterPredicates['LSS'],
    filterData: (variants: ProtvistaVariationData) =>
      getFilteredVariants(variants, filterPredicates['LSS']),
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

export const colorConfig = (variant: any) => {
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

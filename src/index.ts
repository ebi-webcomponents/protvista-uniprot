import ProtvistaUniprot from './protvista-uniprot';
import ProtvistaUniprotStructure from './protvista-uniprot-structure';

import filterConfig, { colorConfig } from './filter-config';

import getFeatureTooltip from './tooltips/featureTooltip';
import getStructureTooltip from './tooltips/structureTooltip';
import getVariationTooltip from './tooltips/variationTooltip';

export {
  ProtvistaUniprot as default,
  ProtvistaUniprotStructure,
  filterConfig,
  colorConfig,
  getFeatureTooltip,
  getStructureTooltip,
  getVariationTooltip,
};

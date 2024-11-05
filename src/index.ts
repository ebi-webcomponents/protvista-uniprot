import { loadComponent } from './utils';

import ProtvistaUniprot from './protvista-uniprot';
import ProtvistaUniprotStructure from './protvista-uniprot-structure';

import filterConfig, { colorConfig } from './filter-config';

loadComponent('protvista-uniprot', ProtvistaUniprot);
loadComponent('protvista-uniprot-structure', ProtvistaUniprotStructure);

export {
  ProtvistaUniprot as default,
  ProtvistaUniprotStructure,
  filterConfig,
  colorConfig,
};

import { loadComponent } from './loadComponents';

import ProtvistaUniprot from './protvista-uniprot';
import _DownloadPanel from './download-panel';
import _ProtvistaUniprotStructure from './protvista-uniprot-structure';

import { transformDataFeatureAdapter as _transformDataFeatureAdapter } from './protvista-uniprot';
import { transformDataProteomicsAdapter as _transformDataProteomicsAdapter } from './protvista-uniprot';
import { transformDataStructureAdapter as _transformDataStructureAdapter } from './protvista-uniprot';
import { transformDataVariationAdapter as _transformDataVariationAdapter } from './protvista-uniprot';
import { transformDataInterproAdapter as _transformDataInterproAdapter } from './protvista-uniprot';

export const transformDataFeatureAdapter = _transformDataFeatureAdapter;
export const transformDataProteomicsAdapter = _transformDataProteomicsAdapter;
export const transformDataStructureAdapter = _transformDataStructureAdapter;
export const transformDataVariationAdapter = _transformDataVariationAdapter;
export const transformDataInterproAdapter = _transformDataInterproAdapter;
export const ProtvistaUniprotStructure = _ProtvistaUniprotStructure;
export const DownloadPanel = _DownloadPanel;

loadComponent('protvista-uniprot', ProtvistaUniprot);
loadComponent('download-panel', _DownloadPanel);
loadComponent('protvista-uniprot-structure', _ProtvistaUniprotStructure);

export default ProtvistaUniprot;

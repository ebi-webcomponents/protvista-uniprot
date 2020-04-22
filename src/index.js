import { loadComponent } from "./loadComponents";

import ProtvistaUniprot from "./protvista-uniprot";
import DownloadPanel from "./download-panel";

import _transformDataFeatureAdapter from "./protvista-uniprot";
import _transformDataProteomicsAdapter from "./protvista-uniprot";
import _transformDataStructureAdapter from "./protvista-uniprot";
import _transformDataVariationAdapter from "./protvista-uniprot";
import _transformDataInterproAdapter from "./protvista-uniprot";

export const transformDataFeatureAdapter = _transformDataFeatureAdapter;
export const transformDataProteomicsAdapter = _transformDataProteomicsAdapter;
export const transformDataStructureAdapter = _transformDataStructureAdapter;
export const transformDataVariationAdapter = _transformDataVariationAdapter;
export const transformDataInterproAdapter = _transformDataInterproAdapter;

loadComponent("protvista-uniprot", ProtvistaUniprot);
loadComponent("download-panel", DownloadPanel);

export default ProtvistaUniprot;

import Protvista from "./protvista";

import ProtvistaNavigation from "protvista-navigation";
import ProtvistaTooltip from "protvista-tooltip";
import ProtvistaTrack from "protvista-track";
import ProtvistaInterproTrack from "protvista-interpro-track";
import ProtvistaSequence from "protvista-sequence";
import ProtvistaVariation from "protvista-variation";
import ProtvistaVariationGraph from "protvista-variation-graph";
import ProtvistaFilter from "protvista-filter";
import ProtvistaManager from "protvista-manager";

import { transformData as _transformDataFeatureAdapter } from "protvista-feature-adapter";
import { transformData as _transformDataProteomicsAdapter } from "protvista-proteomics-adapter";
import { transformData as _transformDataStructureAdapter } from "protvista-structure-adapter";
import { transformData as _transformDataVariationAdapter } from "protvista-variation-adapter";
import { transformData as _transformDataInterproAdapter } from "protvista-interpro-adapter";

import defaultConfig from "./config.json";
import filterConfig, { colorConfig } from "./filterConfig";
import ProtvistaUniprotStructure from "./protvista-uniprot-structure";

export const transformDataFeatureAdapter = _transformDataFeatureAdapter;
export const transformDataProteomicsAdapter = _transformDataProteomicsAdapter;
export const transformDataStructureAdapter = _transformDataStructureAdapter;
export const transformDataVariationAdapter = _transformDataVariationAdapter;
export const transformDataInterproAdapter = _transformDataInterproAdapter;

const adapters = {
  "protvista-feature-adapter": transformDataFeatureAdapter,
  "protvista-interpro-adapter": transformDataInterproAdapter,
  "protvista-proteomics-adapter": transformDataProteomicsAdapter,
  "protvista-structure-adapter": transformDataStructureAdapter,
  "protvista-variation-adapter": transformDataVariationAdapter,
};

const components = {
  protvista_navigation: ProtvistaNavigation,
  protvista_tooltip: ProtvistaTooltip,
  protvista_track: ProtvistaTrack,
  protvista_interpro_track: ProtvistaInterproTrack,
  protvista_sequence: ProtvistaSequence,
  protvista_variation: ProtvistaVariation,
  protvista_variation_graph: ProtvistaVariationGraph,
  protvista_filter: ProtvistaFilter,
  protvista_manager: ProtvistaManager,
  protvista_uniprot_structure: ProtvistaUniprotStructure
};

class ProtvistaUniprot extends Protvista {
  constructor() {
    super(
      {
        adapters,
        colorConfig,
        filterConfig,
        components,
        getConfig: () => defaultConfig,
      }
    );
  }
}

export default ProtvistaUniprot;

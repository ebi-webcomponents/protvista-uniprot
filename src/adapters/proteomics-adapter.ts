import { renameProperties } from '../utils';
import formatTooltip from '../tooltips/feature-tooltip';

const proteomicsTrackProperties = (feature, taxId) => {
  return {
    category: 'PROTEOMICS',
    type: feature.unique ? 'unique' : 'non_unique',
    tooltipContent: formatTooltip(feature, taxId),
  };
};

const transformData = (data) => {
  let adaptedData = [];

  if (data && data.length !== 0) {
    /* Important: The PTM map is a temporary patch until multiple modifications are shown in the peptide. At this point, only 'phospho' sites are of interest. 
      Once they are available in the data, there is no need for the below merging */

    // To merge PTM data present in same residue in a same length peptide, have a map [key: start-end-phospho site 1-... phosphosite n, value: corresponding feature elements]
    const ptmMap: Record<string, any> = {};
    data.features.forEach((feature) => {
      let ft = `${feature.begin}-${feature.end}`;
      if (feature.ptms) {
        feature.ptms.forEach((ptm) => {
          ft += `-${ptm.position}`;
        });
        ptmMap[ft] = ft in ptmMap ? [...ptmMap[ft], feature] : [feature];
      }
    });

    // The else part alone is enough if the PTM information need not be merged.
    if (Object.keys(ptmMap).length) {
      adaptedData = Object.values(ptmMap).map((features) => {
        // Only the dbReferences have to be merged as the rest is all the same
        const mergedDbReferences = [];
        features.forEach((feature) => {
          feature.ptms.forEach((ptm) => {
            ptm.dbReferences.forEach((dbReference) => {
              mergedDbReferences.push(dbReference);
            });
          });
        });

        const mergedFeatures = {
          type: features[0].type,
          begin: features[0].begin,
          end: features[0].end,
          xrefs: features[0].xrefs,
          evidences: features[0].evidences,
          peptide: features[0].peptide,
          unique: features[0].unique,
          residuesToHighlight: features[0].ptms.map((ptm) => ({
            name: ptm.name,
            position: ptm.position,
            sources: ptm.sources,
            dbReferences: mergedDbReferences,
          })),
        };

        return Object.assign(
          mergedFeatures,
          proteomicsTrackProperties(mergedFeatures, data.taxid)
        );
      }, []);
    } else {
      adaptedData = data.features.map((feature) => {
        return Object.assign(
          feature,
          proteomicsTrackProperties(feature, data.taxid)
        );
      });
    }

    adaptedData = renameProperties(adaptedData);
  }
  return adaptedData;
};

export default transformData;

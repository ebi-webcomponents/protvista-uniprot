import { formatTooltip } from '../tooltips/structureTooltip';

const featureType = 'PDBE_COVER';
const featureCategory = 'STRUCTURE_COVERAGE';

const capitalizeFirstLetter = (word) => {
  return word.charAt(0).toUpperCase() + word.slice(1);
};

const getDescription = (properties) => {
  return Object.keys(properties).reduce(
    (accumulator, propertyKey) =>
      `${accumulator}${capitalizeFirstLetter(propertyKey)}: ${
        properties[propertyKey]
      }. `,
    ''
  );
};

const parseChainString = (value) => {
  const posEqual = value.indexOf('=');
  const posDash = value.indexOf('-');
  if (posEqual === -1 || posDash === -1) {
    return { start: 0, end: 0 };
  }
  return {
    start: +value.slice(posEqual + 1, posDash),
    end: +value.slice(posDash + 1),
  };
};

// Iterate over references and extract chain start and end
export const getAllFeatureStructures = (data) => {
  return data.dbReferences
    .filter((reference) => {
      return reference.type === 'PDB';
    })
    .map((structureReference) => {
      const parsedChain = structureReference.properties.chains
        ? parseChainString(structureReference.properties.chains)
        : { start: 0, end: 0 };
      return {
        type: featureType,
        category: featureCategory,
        structures: [
          {
            description: getDescription(structureReference.properties),
            start: parsedChain.start,
            end: parsedChain.end,
            source: {
              id: structureReference.id,
              url: `http://www.ebi.ac.uk/pdbe-srv/view/entry/${structureReference.id}`,
            },
          },
        ],
        start: parsedChain.start,
        end: parsedChain.end,
      };
    });
};

export const mergeOverlappingIntervals = (structures) => {
  if (!structures || structures.length <= 0) {
    return [];
  }
  // Sort by start position
  const sortedStructures = structures.sort((a, b) => a.start - b.start);
  const mergedIntervals = [];
  sortedStructures.forEach((structure) => {
    const lastItem = mergedIntervals[mergedIntervals.length - 1];
    if (
      !lastItem ||
      // If item doesn't overlap, push it
      lastItem.end < structure.start
    ) {
      mergedIntervals.push(structure);
    }
    // If the end is bigger update the last one
    else if (lastItem.end < structure.end) {
      lastItem.end = structure.end;
      lastItem.structures.push(structure.structures[0]);
    }
    // Otherwise just add to last item
    else {
      lastItem.structures.push(structure.structures[0]);
    }
  });
  return mergedIntervals;
};

const transformData = (data) => {
  let transformedData = [];
  if (data && data.length !== 0) {
    const allFeatureStructures = getAllFeatureStructures(data);
    transformedData = mergeOverlappingIntervals(allFeatureStructures);

    transformedData.forEach((feature) => {
      /* eslint-disable no-param-reassign */
      feature.tooltipContent = formatTooltip(feature);
    });
  }
  return transformedData;
};

export default transformData;

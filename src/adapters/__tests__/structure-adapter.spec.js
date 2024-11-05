import {
  getAllFeatureStructures,
  mergeOverlappingIntervals,
} from '../structure-adapter';

import entryData from './__mocks__/uniprotkb-entry-data';
import featuresData from './__mocks__/uniprotkb-features-data';

describe('structure data', () => {
  it('should turn structures into features', () => {
    const features = getAllFeatureStructures(entryData);
    expect(features).toMatchSnapshot();
  });

  it('should merge Overlapping Intervals', () => {
    const overlapping = mergeOverlappingIntervals(featuresData);
    expect(overlapping).toMatchSnapshot();
  });
});

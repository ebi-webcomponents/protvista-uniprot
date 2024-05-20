import {
  cellSplitter,
  rowSplitter,
} from './protvista-alphamissense-pathogenicity';
import { AlphafoldPayload } from './commonTypes';

// const rowSplitter = /\s*\n\s*/;
// const cellSplitter = /^(.)(\d+)(.),(.+),(\w+)$/;

const parseCSV = (rawText: string): Array<Object> => {
  const data = [];

  for (const [i, row] of rawText.split(rowSplitter).entries()) {
    if (i === 0 || !row) {
      continue;
    }
    const [, , positionString, mutated, pathogenicityScore] =
      row.match(cellSplitter);

    data.push({
      xValue: +positionString,
      yValue: mutated,
      score: +pathogenicityScore,
    });
  }
  return data;
};

// Load and parse
const loadAndParseAnnotations = async (url: string): Promise<Array<Object>> => {
  try {
    const payload = await fetch(url);
    const rawCSV = await payload.text();
    return parseCSV(rawCSV);
  } catch (e) {
    console.error('Could not load AlphaMissense pathogenicity', e);
  }
};

type PartialProtein = {
  sequence: {
    sequence: string;
  };
};

export const transformData = async (
  data: AlphafoldPayload,
  protein: PartialProtein
) => {
  const { amAnnotationsUrl, uniprotSequence } = data?.[0] || {};
  if (amAnnotationsUrl && uniprotSequence === protein.sequence.sequence) {
    const heatmapData = await loadAndParseAnnotations(amAnnotationsUrl);
    return heatmapData;
  }
};

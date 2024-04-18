type AlphafoldPayload = Array<{
  entryId: string;
  gene: string;
  uniprotAccession: string;
  uniprotId: string;
  uniprotDescription: string;
  taxId: number;
  organismScientificName: string;
  uniprotStart: number;
  uniprotEnd: number;
  uniprotSequence: string;
  modelCreatedDate: string;
  latestVersion: number;
  allVersions: number[];
  cifUrl?: string;
  bcifUrl?: string;
  amAnnotationsUrl?: string;
  pdbUrl: string;
  paeImageUrl: string;
  paeDocUrl: string;
}>;

// from example data
// benign: [0.0448,0.3397]: x < 0.34
// ambiguous: [0.34,0.564]: 0.34 <= x <= 0.564
// pathogenic: [0.5646,0.9999]: 0.564 < x
const benign = 0.34;
const pathogenic = 0.564;

const rowSplitter = /\s*\n\s*/;
const cellSplitter = /^(.)(\d+)(.),(.+),(\w+)$/;

type Row = {
  wildType: string;
  position: number;
  mutated: string;
  pathogenicityScore: number;
  pathogenicityLabel: string;
};

const parseCSV = (rawText: string): string => {
  const positions: Array<Array<Row>> = [];
  for (const [i, row] of rawText.split(rowSplitter).entries()) {
    if (i === 0 || !row) {
      continue;
    }
    const [
      ,
      wildType,
      positionString,
      mutated,
      pathogenicityScore,
      pathogenicityLabel,
    ] = row.match(cellSplitter);
    const position = +positionString;
    const index = position - 1;
    if (!positions[index]) {
      positions[index] = [];
    }
    positions[index].push({
      wildType,
      position,
      mutated,
      pathogenicityScore: +pathogenicityScore,
      pathogenicityLabel,
    });
  }

  const out = [];
  for (const position of positions) {
    let letter = 'A';
    // maximum
    // const value = Math.max(
    //   ...position.map((variation) => variation.pathogenicityScore)
    // );
    // average
    const value =
      position.reduce(
        (acc, variation) => acc + +variation.pathogenicityScore,
        0
      ) / position.length;
    if (value > pathogenic) {
      letter = 'P';
    } else if (value < benign) {
      letter = 'B';
    }
    out.push(letter);
  }

  return out.join('');
};

// Load and parse
const loadAndParseAnnotations = async (url: string): Promise<string> => {
  try {
    const payload = await fetch(
      // Temporary, to cope with test data endpoint, remove after PR review
      `https://corsproxy.io?${encodeURIComponent(url)}`
    );
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
    const variationData = await loadAndParseAnnotations(amAnnotationsUrl);
    // return confidenceData?.confidenceCategory.join('');
    return variationData;
  }
};

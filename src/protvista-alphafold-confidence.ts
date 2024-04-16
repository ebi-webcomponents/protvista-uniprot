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

type AlphafoldConfidencePayload = {
  residueNumber: Array<number>;
  confidenceScore: Array<number>;
  confidenceCategory: Array<string>;
};

export const getConfidenceURLFromPayload = (data: AlphafoldPayload) => {
  const cifURL = data?.[0]?.cifUrl;
  return cifURL?.length
    ? cifURL.replace('-model', '-confidence').replace('.cif', '.json')
    : null;
};

const loadConfidence = async (
  url: string
): Promise<AlphafoldConfidencePayload> => {
  try {
    const payload = await fetch(url);
    return payload.json();
  } catch (e) {
    console.error('Could not load AlphaFold confidence', e);
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
  const confidenceUrl = getConfidenceURLFromPayload(data);
  const { uniprotSequence } = data?.[0] || {};
  if (confidenceUrl && uniprotSequence === protein.sequence.sequence) {
    const confidenceData = await loadConfidence(confidenceUrl);
    return confidenceData?.confidenceCategory.join('');
  }
};

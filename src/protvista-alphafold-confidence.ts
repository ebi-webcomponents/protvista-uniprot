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
  cifUrl: string;
  bcifUrl: string;
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

export const transformData = async (data: AlphafoldPayload) => {
  const confidenceUrl = getConfidenceURLFromPayload(data);
  if (confidenceUrl) {
    const confidenceData = await loadConfidence(confidenceUrl);
    return confidenceData?.confidenceCategory.join('');
  }
};

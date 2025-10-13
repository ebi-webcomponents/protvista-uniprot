import { AlphaFoldPayload } from '@nightingale-elements/nightingale-structure';

type AlphafoldConfidencePayload = {
  residueNumber: Array<number>;
  confidenceScore: Array<number>;
  confidenceCategory: Array<string>;
};

const getConfidenceURLFromPayload = (data: AlphaFoldPayload) => {
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

const transformData = async (
  data: AlphaFoldPayload,
  protein: PartialProtein
) => {
  const confidenceUrl = getConfidenceURLFromPayload(data);
  if (!confidenceUrl) {
    return;
  }
  const alphaFoldSequenceMatch = data?.filter(
    ({ sequence }) => protein.sequence.sequence === sequence
  );
  if (alphaFoldSequenceMatch.length) {
    const confidenceData = await loadConfidence(confidenceUrl);
    return confidenceData?.confidenceCategory.join('');
  }
};

export default transformData;

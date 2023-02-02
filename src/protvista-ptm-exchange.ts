type ProteomicsPtm = {
  accession: string;
  entryName: string;
  sequence: string;
  sequenceChecksum: string;
  taxid: number;
  features: ProteomicsPtmFeature[];
};

type ProteomicsPtmFeature = {
  type: string;
  begin: string;
  end: string;
  xrefs: Xref[];
  evidences: Evidence[];
  peptide: string;
  unique: boolean;
  ptms: PTM[];
};

type Evidence = {
  code: string;
  source: Source;
};

type Source = {
  id: string;
  url: string;
};

type Xref = {
  name: string;
  id: string;
  url: string;
};

type PTM = {
  name: string;
  position: number;
  sources: string[];
  dbReferences: DBReference[];
};

type DBReference = {
  id: string;
  properties: { [key: string]: string };
};

enum ConfidenceScoreColors {
  Gold = '#c39b00',
  Silver = '#8194a1',
  Bronze = '#a65708',
}

const aaToPhosphorylated = {
  R: 'Phosphoarginine',
  C: 'Phosphocysteine',
  H: 'Phosphohistidine',
  S: 'Phosphoserine',
  T: 'Phosphothreonine',
  Y: 'Phosphotyrosine',
};

const phosphorylate = (aa: string) => {
  const AA = aa.toUpperCase();
  if (AA in aaToPhosphorylated) {
    return aaToPhosphorylated[AA as keyof typeof aaToPhosphorylated];
  }
  console.error(`${AA} not a valid amino acid for phosphorylation`);
  return '';
};

const convertPtmExchangePtms = (
  ptms: PTM[],
  aa: string,
  absolutePosition: number
) => {
  const evidences = [
    ...ptms.flatMap(({ dbReferences }) =>
      dbReferences?.flatMap(({ id }) => [id])
    ),
  ];
  const confidenceScores = new Set(
    ptms.flatMap(({ dbReferences }) =>
      dbReferences?.map(({ properties }) => properties['Confidence score'])
    )
  );
  let confidenceScore: string;

  if (!confidenceScores.size) {
    console.log('PTM has no confidence score');
  } else if (confidenceScores.size > 1) {
    console.error(
      `PTM has a mixture of confidence scores: ${Array.from(
        confidenceScores
      )}`
    );
  } else {
    [confidenceScore] = confidenceScores;
  }

  const tooltip = `
  <h5>Description</h5><p>${phosphorylate(aa)}</p>
  ${confidenceScore ? `<h5 data-article-id="mod_res_large_scale#confidence-score">Confidence Score</h5><p>${confidenceScore}</p>` : ''}
  ${
    evidences
      ? `<h5>Evidence</h5><ul>${evidences
          .map(
            (id) => {
              const datasetID = id === 'Glue project' ? 'PXD012174' : id;
              return `<li title='${datasetID}' style="padding: .25rem 0">${datasetID}&nbsp;
              (<a href="https://www.ebi.ac.uk/pride/archive/projects/${id}" style="color:#FFF" target="_blank">PRIDE</a>)
              </li>
              ${id === 'Glue project' ?  
              `<li title="publication" style="padding: .25rem 0">Publication:&nbsp;31819260&nbsp;(<a href="https://pubmed.ncbi.nlm.nih.gov/31819260" style="color:#FFF" target="_blank">PubMed</a>)</li>`
              : ''}
              `
            }
          )
          .join('')}</ul>`
      : ''
  }
  `;

  return {
    source: 'PTMeXchange',
    type: 'MOD_RES_LS',
    start: absolutePosition,
    end: absolutePosition,
    shape: 'triangle',
    tooltipContent: tooltip,
    color: ConfidenceScoreColors[confidenceScore] || 'black',
  };
};

export const transformData = (data: ProteomicsPtm) => {
  if (data) {
    const { features } = data;

    const absolutePositionToPtms: Record<number, { ptms: PTM[]; aa: string }> =
      {};
  
    if (features) {
      for (const feature of features) {
        for (const ptm of feature.ptms) {
          const absolutePosition = +feature.begin + ptm.position - 1;
          if (!Number.isFinite(absolutePosition)) {
            console.error(
              `Encountered infinite number: +feature.begin + ptm.position - 1 = ${+feature.begin} + ${
                ptm.position
              } - 1`
            );
            // eslint-disable-next-line no-continue
            continue;
          }
          const aa = feature.peptide[ptm.position - 1];
          if (absolutePosition in absolutePositionToPtms) {
            if (absolutePositionToPtms[absolutePosition].aa !== aa) {
              console.error(
                `One PTM has different amino acid values: [${absolutePositionToPtms[absolutePosition].aa}, ${aa}]`
              );
            } else {
              absolutePositionToPtms[absolutePosition].ptms.push(ptm);
            }
          } else {
            absolutePositionToPtms[absolutePosition] = { ptms: [ptm], aa };
          }
        }
      }
   
      return Object.entries(absolutePositionToPtms).map(
        ([absolutePosition, { ptms, aa }]) =>
          convertPtmExchangePtms(ptms, aa, +absolutePosition)
      );
    } 
  }
  return []; 
};

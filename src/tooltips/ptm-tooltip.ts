import { PTM } from "../adapters/ptm-exchange-adapter";

type Modification = 'Phosphorylation' | 'SUMOylation';

const aaToPhosphorylated = {
  R: 'Phosphoarginine',
  C: 'Phosphocysteine',
  H: 'Phosphohistidine',
  S: 'Phosphoserine',
  T: 'Phosphothreonine',
  Y: 'Phosphotyrosine',
};

const aaToSumoylated = {
  K: 'Sumoylated lysine',
};

export const phosphorylate = (aa: string) => {
  const AA = aa.toUpperCase();
  if (AA in aaToPhosphorylated) {
    return aaToPhosphorylated[AA as keyof typeof aaToPhosphorylated];
  }
  console.error(`${AA} not a valid amino acid for phosphorylation`);
  return '';
};

export const sumoylate = (aa: string) => {
  const AA = aa.toUpperCase();
  if (AA in aaToSumoylated) {
    return aaToSumoylated[AA as keyof typeof aaToSumoylated];
  }
  console.error(`${AA} not a valid amino acid for SUMOylation`);
  return '';
};

const formatTooltip = (title: string, ptms: PTM[], aa: string, confidenceScore: string): string => {
    const evidences = [
        ...ptms.flatMap(({ dbReferences }) =>
          dbReferences?.flatMap(({ id }) => [id])
        ),
      ];
   
      let modification: Modification | undefined;
      const modifications = new Set(ptms.flatMap(({name}) => name as Modification));
      if (modifications.size) {
        if (modifications.size > 1) {
          console.error(
            `PTMeXchange PTM has a mixture of modifications: ${Array.from(
              modifications
            )}`
          );
        } else {
          [modification] = modifications;
        }
      }
      
  return `
  ${
    title
      ? `<h4>${title}</h4><hr />`
      : ''
  }
  <h5>Description</h5><p>${
    modification === 'Phosphorylation' ? phosphorylate(aa) : sumoylate(aa)
  }</p>
  ${
    confidenceScore
      ? `<h5 data-article-id="mod_res_large_scale#confidence-score">Confidence Score</h5><p>${confidenceScore}</p>`
      : ''
  }
  ${
    evidences
      ? `<h5>Evidence</h5><ul class="no-bullet">${evidences
          .map((id) => {
            const datasetID = id === 'Glue project' ? 'PXD012174' : id;
            return `<li title='${datasetID}' style="padding: .25rem 0">${datasetID}&nbsp;
              (<a href="https://proteomecentral.proteomexchange.org/dataset/${datasetID}" style="color:#FFF" target="_blank">ProteomeXchange</a>)
              </li>
              ${
                id === 'Glue project'
                  ? `<li title="publication" style="padding: .25rem 0">Publication:&nbsp;31819260&nbsp;(<a href="https://pubmed.ncbi.nlm.nih.gov/31819260" style="color:#FFF" target="_blank">PubMed</a>)</li>`
                  : ''
              }
              `;
          })
          .join('')}</ul>`
      : ''
  }`;
};

export default formatTooltip;

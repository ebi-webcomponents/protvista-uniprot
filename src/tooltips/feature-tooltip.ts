import ecoMap from '../adapters/config/evidence';
import { phosphorylate, sumoylate } from './ptm-tooltip';

const taxIdToPeptideAtlasBuildData = {
  '36329': { build: '542', organism: 'Plasmodium' },
  '39947': { build: '539', organism: 'Rice' },
  '10090': { build: '577', organism: 'Mouse' },
  '9606': { build: '537', organism: 'Human' },
  '559292': { build: '586', organism: 'Yeast' },
  '4577': { build: '591', organism: 'Maize' },
  '185431': { build: '590', organism: 'T Brucei' },
};

const formatSource = (source) => {
  if (source.name?.toLowerCase() === 'PubMed'.toLowerCase()) {
    return `${source.id}&nbsp;(<a href='${source.url}' style="color:#FFF" target='_blank'>${source.name}</a>&nbsp;<a href='${source.alternativeUrl}' style="color:#FFF" target='_blank'>EuropePMC</a>)`;
  }
  const sourceLink = `&nbsp;<a href='${source.url}' style="color:#FFF" target='_blank'>${source.id}</a>`;
  if (source.name) {
    // Temporary until we get the expected value as 'PeptideAtlas' instead of 'HppPeptideAtlas'
    if (source.name.startsWith('Hpp')) {
      return `${sourceLink}&nbsp;(${source.name.slice(3)})`;
    }
    return `${sourceLink}&nbsp;(${source.name})`;
  }
  return sourceLink;
};

export const getEvidenceFromCodes = (evidenceList) => {
  if (!evidenceList) return ``;
  return `
        <ul class="no-bullet">${evidenceList
          .map((ev) => {
            const ecoMatch = ecoMap.find((eco) => eco.name === ev.code);
            if (!ecoMatch) return ``;
            return `<li title='${
              ecoMatch.description
            }' style="padding: .25rem 0">${ecoMatch.shortDescription}:&nbsp;${
              ev.source ? formatSource(ev.source) : ''
            }</li>`;
          })
          .join('')}</ul>
      `;
};

export const formatXrefs = (xrefs) => {
  return `<ul class="no-bullet">${xrefs
    .map(
      (xref) =>
        `<li style="padding: .25rem 0">${xref.name} ${
          xref.url
            ? `<a href="${xref.url}" style="color:#FFF" target="_blank">${xref.id}</a>`
            : `${xref.name} ${xref.id}`
        }</li>`
    )
    .join('')}</ul>`;
};

const getPTMEvidence = (ptms, taxId) => {
  if (!ptms) return ``;
  const ids = ptms.flatMap(({ dbReferences }) =>
    dbReferences.map((ref) => ref.id)
  );
  const uniqueIds = [...new Set(ids.flat())];
  // Urls in the payload are not relevant. For 'Glue project' dataset, Dataset ID and publication reference is hardcoded. Need to be checked in 2024 if it still exists in the payload
  const proteomexchange =
    'https://proteomecentral.proteomexchange.org/dataset/';
  return `
    <ul class="no-bullet">${uniqueIds
      .map((id) => {
        const datasetID = id === 'Glue project' ? 'PXD012174' : id;
        return `<li title='${datasetID}' style="padding: .25rem 0">${datasetID}&nbsp;(<a href="${proteomexchange}${datasetID}" style="color:#FFF" target="_blank">ProteomeXchange</a>${
          id === 'Glue project'
            ? `)</li><li title="publication" style="padding: .25rem 0">Publication:&nbsp;31819260&nbsp;(<a href="https://pubmed.ncbi.nlm.nih.gov/31819260" style="color:#FFF" target="_blank">PubMed</a>)</li>`
            : `&nbsp;<a href="https://db.systemsbiology.net/sbeams/cgi/PeptideAtlas/buildDetails?atlas_build_id=${taxIdToPeptideAtlasBuildData[taxId].build}" style="color:#FFF" target="_blank">PeptideAtlas</a>)</li>`
        }`;
      })
      .join('')}</ul>
  `;
};

const formatPTMPeptidoform = (peptide, ptms) => {
  if (!ptms) return ``;
  const modificationValues = ptms.map((ptm) => ({
    name: ptm.name,
    position: ptm.position,
  }));
  let peptidoform = '';
  let lastModPosition = 0;
  modificationValues.forEach((p) => {
    peptidoform = `${peptidoform}${peptide.slice(
      lastModPosition,
      p.position
    )}[${p.name}]`;
    lastModPosition = p.position;
  });
  // Add last remaining part of the peptide if any
  peptidoform = `${peptidoform}${peptide.slice(lastModPosition)}`;
  return peptidoform;
};

const findModifiedResidueName = (feature, ptm) => {
  const { peptide, begin: peptideStart } = feature;
  const proteinLocation = Number(peptideStart) + ptm.position - 1;
  const modifiedResidue = peptide.charAt(ptm.position - 1); // CharAt index starts from 0
  if (ptm.name === 'Phosphorylation') {
    return `${proteinLocation} ${phosphorylate(modifiedResidue)}`;
  } else if (ptm.name === 'SUMOylation') {
    return `${proteinLocation} ${sumoylate(modifiedResidue)}`;
  }
  return '';
};

const formatTooltip = (feature, taxId?: string) => {
  const evidenceHTML =
    feature.type === 'PROTEOMICS_PTM'
      ? getPTMEvidence(feature.residuesToHighlight, taxId)
      : getEvidenceFromCodes(feature.evidences);
  const ptms =
    feature.type === 'PROTEOMICS_PTM' &&
    feature.residuesToHighlight.map((ptm) => findModifiedResidueName(feature, ptm));

  const dataset =
    feature.type === 'PROTEOMICS_PTM' &&
    feature.residuesToHighlight.flatMap(({ dbReferences }) =>
      dbReferences.map((ref) => ref.id)
    );

  let { description } = feature;

  if (feature.type === 'BINDING' || feature.type === 'Binding site') {
    let bindingDescription = '';
    if (feature.ligandPart) {
      bindingDescription += `${feature.ligandPart.name} of `;
    }
    if (feature.ligand) {
      bindingDescription += feature.ligand.name;
    }
    if (feature.description) {
      bindingDescription += `; ${feature.description}`;
    }
    description = bindingDescription;
  }

  try {
    return `
        ${
          feature.type && feature.begin && feature.end
            ? `<h4>${feature.type} ${feature.begin}-${feature.end}</h4><hr />`
            : ''
        }
        ${description ? `<h5>Description</h5><p>${description}</p>` : ``}
        ${feature.ftId ? `<h5>Feature ID</h5><p>${feature.ftId}</p>` : ``}
        ${
          feature.alternativeSequence
            ? `<h5>Alternative sequence</h5><p>${feature.alternativeSequence}</p>`
            : ``
        }
        ${
          ptms
            ? `<h5 data-article-id="ptm_processing_section">PTMs</h5><ul class="no-bullet">${ptms
                .map((item) => `<li>${item}</li>`)
                .join('')}</ul>
              `
            : ''
        }
        ${
          feature.peptide && feature.type === 'PROTEOMICS_PTM'
            ? `<h5 data-article-id="mod_res_large_scale#what-is-the-goldsilverbronze-criterion">Peptidoform</h5><p>${formatPTMPeptidoform(
                feature.peptide,
                feature.residuesToHighlight
              )}</p>`
            : ``
        }
        ${
          feature.peptide && feature.type !== 'PROTEOMICS_PTM'
            ? `<h5>Peptide</h5><p>${feature.peptide}</p>`
            : ``
        }
        ${feature.unique ? `<h5>Unique</h5><p>${feature.unique ? 'Yes' : 'No'}</p>` : ``}
        ${
          feature.xrefs
            ? `<h5>Cross-references</h5>${formatXrefs(feature.xrefs)}`
            : ``
        }
        ${evidenceHTML ? `<h5>Evidence</h5>${evidenceHTML}` : ``}
        ${
          feature.residuesToHighlight && dataset && !dataset.includes('Glue project')
            ? `<hr /><h5 data-article-id="mod_res_large_scale#what-is-the-goldsilverbronze-criterion">PTM statistical attributes</h5><ul class="no-bullet">${feature.residuesToHighlight
                .map((ptm) =>
                  ptm.dbReferences
                    .map(
                      (ref) =>
                        `<li><b>${ref.id}</b></li>
                        <li style="text-indent: 1em"><b>${findModifiedResidueName(
                          feature,
                          ptm
                        )}</b></li>
                        ${
                          ref.properties['Pubmed ID']
                            ? `<li style="text-indent: 2em">PubMed ID: <a href="https://europepmc.org/article/MED/${ref.properties['Pubmed ID']}" style="color:#FFF" target="_blank">${ref.properties['Pubmed ID']}</a></li>`
                            : ``
                        }
                        ${
                          ref.properties['Confidence score']
                            ? `<li style="text-indent: 2em"><span data-article-id="mod_res_large_scale#confidence-score">Confidence score</span>: ${ref.properties['Confidence score']}</li>`
                            : ``
                        }
                        ${
                          ref.properties['Sumo isoforms']
                            ? `<li style="text-indent: 2em">SUMO family member: ${ref.properties['Sumo isoforms']}</li>`
                            : ``
                        }
                        ${
                          ref.properties['Organism part']
                            ? `<li style="text-indent: 2em">Organism part: ${ref.properties['Organism part']}</li>`
                            : ``
                        }
                        ${
                          ref.properties['PSM Count (0.05 gFLR)']
                            ? `<li style="text-indent: 2em">PSM Count (0.05 gFLR): ${ref.properties['PSM Count (0.05 gFLR)']}</li>`
                            : ``
                        }
                        ${
                          ref.properties['Final site probability']
                            ? `<li style="text-indent: 2em">Final site probability: ${ref.properties['Final site probability']}</li>`
                            : ``
                        }
                        ${
                          ref.properties['Universal Spectrum Id']
                            ? `<li style="text-indent: 2em; white-space: nowrap;">Universal Spectrum Id: 
                        <a href="http://proteomecentral.proteomexchange.org/usi/?usi=${ref.properties['Universal Spectrum Id']}" target="_blank">View on ProteomeXchange</a>
                        </li>`
                            : ``
                        }                        
                        `
                    )
                    .join('')
                )
                .join('')}</ul>`
            : ''
        }
      `;
  } catch (error) {
    console.error(error);
    return '';
  }
};

export default formatTooltip;

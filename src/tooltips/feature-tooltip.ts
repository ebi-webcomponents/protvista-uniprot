import ecoMap from '../adapters/config/evidence';
import {
  acetylate,
  phosphorylate,
  sumoylate,
  ubiquitinate,
} from './ptm-tooltip';

// Original mapping in src/main/java/uk/ac/ebi/uniprot/tools/proteomics/reader/ptm/PtmXchangeTsvReader.java.
// from the GitLab repository https://gitlab.ebi.ac.uk/uniprot/framework/unp.fw.tools/
const taxIdToPeptideAtlasBuildData = {
  '36329': { build: '542', organism: 'Plasmodium' },
  '39947': { build: '539', organism: 'Rice' },
  '10090': { build: '577', organism: 'Mouse' },
  '9606': { build: '537', organism: 'Human' },
  '559292': { build: '586', organism: 'Yeast' },
  '4577': { build: '591', organism: 'Maize' },
  '185431': { build: '590', organism: 'T Brucei' },
  '508771': { build: '601', organism : 'T Gondii'},
};

const unimodIdMapping = {
  'Glu-&gt;pyro-Glu': 27,
  'Ammonia-loss': 385,
  NQTGG: 2084,
  Formyl: 122,
  Carbamidomethyl: 4,
  Ubiquitination: 121,
  TMT6plex: 737,
  Phospho: 21,
  iTRAQ8plex: 730,
  Deamidated: 7,
  'Pyro-QQTGG': 2083,
  QQTGG: 2082,
  GlyGly: 121,
  Oxidation: 35,
  'Gln-&gt;pyro-Glu': 28,
  Dehydrated: 23,
  DVFQQQTGG: 2085,
  Acetyl: 1,
  iTRAQ4plex: 214,
};

const formatSource = (source) => {
  if (source.name?.toLowerCase() === 'PubMed'.toLowerCase()) {
    return `${source.id}&nbsp;(<a href='${source.url}' target='_blank'>${source.name}</a>&nbsp;<a href='${source.alternativeUrl}' target='_blank'>EuropePMC</a>)`;
  }
  const sourceLink = `&nbsp;<a href='${source.url}' target='_blank'>${source.id}</a>`;
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
            return `<li title='${ecoMatch.description}'>${
              ecoMatch.shortDescription
            }:&nbsp;${ev.source ? formatSource(ev.source) : ''}</li>`;
          })
          .join('')}</ul>
      `;
};

export const formatXrefs = (xrefs) => {
  return `<ul class="no-bullet">${xrefs
    .map(
      (xref) =>
        `<li>${xref.name} ${
          xref.url
            ? `<a href="${xref.url}" target="_blank">${xref.id}</a>`
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
  // For 'Glue project' dataset (PXD012174), publication reference is hardcoded.
  const proteomexchange =
    'https://proteomecentral.proteomexchange.org/dataset/';
  return `
    <ul class="no-bullet">${uniqueIds
      .map((id) => {
        return `<li title='${id}'>${id}&nbsp;(<a href="${proteomexchange}${id}" target="_blank">ProteomeXchange</a>${
          id === 'PXD012174'
            ? `&nbsp;<a href="https://www.ebi.ac.uk/pride/archive/projects/${id}" target="_blank">PRIDE</a>)</li><li title="publication">Publication:&nbsp;31819260&nbsp;(<a href="https://pubmed.ncbi.nlm.nih.gov/31819260" target="_blank">PubMed</a>)</li>`
            : ``
        }${
          taxId && taxIdToPeptideAtlasBuildData[taxId]
            ? `&nbsp;<a href="https://db.systemsbiology.net/sbeams/cgi/PeptideAtlas/buildDetails?atlas_build_id=${taxIdToPeptideAtlasBuildData[taxId].build}" target="_blank">PeptideAtlas</a>`
            : ``
        })</li>`;
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

const formatProformaWithLink = (proforma = '') => {
  return proforma.replace(/\[([^\]]+)\]/g, (_, modification) => {
    const id = unimodIdMapping[modification];
    if (!id) {
      console.error('Unimod ID not found for modification:', modification);
      return `[${modification}]`;
    }
    return `<span class="mod-link">[<a href="https://www.unimod.org/modifications_view.php?editid1=${id}" target="_blank">${modification}</a>]</span>`;
  });
};

const findModifiedResidueName = (feature, ptm) => {
  const { peptide, begin: peptideStart } = feature;
  const proteinLocation = Number(peptideStart) + ptm.position - 1;
  const modifiedResidue = peptide.charAt(ptm.position - 1); // CharAt index starts from 0
  switch (ptm.name) {
    case 'Phosphorylation':
      return `${proteinLocation} ${phosphorylate(modifiedResidue)}`;
    case 'SUMOylation':
      return `${proteinLocation} ${sumoylate(modifiedResidue)}`;
    case 'Ubiquitinylation':
      return `${proteinLocation} ${ubiquitinate(modifiedResidue)}`;
    case 'Acetylation':
      return `${proteinLocation} ${acetylate(modifiedResidue)}`;
    default:
      return '';
  }
};

const formatTooltip = (feature, taxId?: string) => {
  const evidenceHTML =
    feature.type === 'PROTEOMICS_PTM'
      ? getPTMEvidence(feature.residuesToHighlight, taxId)
      : getEvidenceFromCodes(feature.evidences);
  const ptms =
    feature.type === 'PROTEOMICS_PTM' &&
    feature.residuesToHighlight.map((ptm) =>
      findModifiedResidueName(feature, ptm)
    );

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
        ${
          feature.unique
            ? `<h5>Unique</h5><p>${feature.unique ? 'Yes' : 'No'}</p>`
            : ``
        }
        ${
          feature.xrefs
            ? `<h5>Cross-references</h5>${formatXrefs(feature.xrefs)}`
            : ``
        }
        ${evidenceHTML ? `<h5>Evidence</h5>${evidenceHTML}` : ``}
        ${
          feature.residuesToHighlight &&
          dataset &&
          !dataset.includes('PXD012174') // Exclude 'Glue project' dataset as it is from PRIDE and it doesn't have PTM statistical attributes
            ? `<hr /><h5 class="margin-bottom" data-article-id="mod_res_large_scale#what-is-the-goldsilverbronze-criterion">PTM statistical attributes</h5><ul class="no-bullet">${feature.residuesToHighlight
                .map((ptm) =>
                  ptm.dbReferences
                    .map(
                      (ref) =>
                        `<li><b>${ref.id}</b></li>
                        <li class="text-indent-1"><b>${findModifiedResidueName(
                          feature,
                          ptm
                        )}</b></li>
                        ${
                          ref.properties['Pubmed ID']
                            ? `<li class="text-indent-2">PubMed ID: <a href="https://europepmc.org/article/MED/${ref.properties['Pubmed ID']}" target="_blank">${ref.properties['Pubmed ID']}</a></li>`
                            : ``
                        }
                        ${
                          ref.properties['Confidence score']
                            ? `<li class="text-indent-2"><span data-article-id="mod_res_large_scale#confidence-score">Confidence score</span>: ${ref.properties['Confidence score']}</li>`
                            : ``
                        }
                        ${
                          ref.properties['Sumo isoforms']
                            ? `<li class="text-indent-2">SUMO family member: ${ref.properties['Sumo isoforms']}</li>`
                            : ``
                        }
                        ${
                          ref.properties['Organism part']
                            ? `<li class="text-indent-2">Organism part: ${ref.properties['Organism part']}</li>`
                            : ``
                        }
                        ${
                          ref.properties['PSM Count (0.05 gFLR)']
                            ? `<li class="text-indent-2">PSM Count (0.05 gFLR): ${ref.properties['PSM Count (0.05 gFLR)']}</li>`
                            : ``
                        }
                        ${
                          ref.properties['Final site probability']
                            ? `<li class="text-indent-2">Final site probability: ${ref.properties['Final site probability']}</li>`
                            : ``
                        }
                        ${
                          ref.properties['Universal Spectrum Id']
                            ? `<li class="text-indent-2 nowrap">Universal Spectrum Id: 
                                <a href="http://proteomecentral.proteomexchange.org/usi/?usi=${encodeURIComponent(
                                  ref.properties['Universal Spectrum Id']
                                )}" target="_blank">View on ProteomeXchange</a>
                              </li>`
                            : ``
                        }
                        ${
                          ref.properties['Proforma']
                            ? `<li class="nowrap margin-bottom"><div class="text-indent-2">Experimental Peptidoform:</div><div class="proforma">
                                  ${formatProformaWithLink(
                                    ref.properties['Proforma']
                                  )}</div></li>`
                            : ``
                        }`
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

import { TransformedRnaEditing } from '../adapters/types/rna-editing';

const getREDIportalId = (feature: TransformedRnaEditing) =>
  feature.dbReferenceType.find((db) => db.type === 'rna_editing')?.id;

const getREDIportalLink = (id: string) =>
  `http://srv00.recas.ba.infn.it/cgi/atlas/getpage_dev.py?query9=hg&query10=hg38&acc=${id}`;

const getEnsemblLink = (id: string) => `https://www.ensembl.org/id/${id}`;

const getLinks = (feature: TransformedRnaEditing) => {
  const links = [];
  const rediPortalId = getREDIportalId(feature);
  if (rediPortalId) {
    links.push(
      `REDIportal <a href="${getREDIportalLink(
        rediPortalId
      )}" target="_blank">${rediPortalId}</a>`
    );
  }
  for (const variantLocation of feature.variantType.variantLocation) {
    if (variantLocation.source === 'Ensembl') {
      links.push(
        `Ensembl <a href="${getEnsemblLink(variantLocation.seqId)}">${
          variantLocation.seqId
        }</a>`
      );
    }
  }
  return links.length === 0
    ? ''
    : `<br><ul class="no-bullet">${links
        .map((link) => `<li>${link}</li>`)
        .join('')}</ul>`;
};

const formatTooltip = (feature: TransformedRnaEditing): string => `
  ${
    feature.start && feature.end
      ? `<h4>RNA Edit ${feature.start}-${feature.end}</h4><hr />`
      : ''
  }
  <h5>Variant</h5>
  <p>${feature.variantType.wildType} > ${feature.variantType.mutatedType}</p>
  <h5>Consequence</h5>
  <p>${feature.consequenceType}</p>
  <h5>Location</h5>
  <ul class="no-bullet">${feature.variantType.genomicLocation
    .map((l) => `<li>${l}</li>`)
    .join('')}
  ${getLinks(feature)}
  `;

export default formatTooltip;

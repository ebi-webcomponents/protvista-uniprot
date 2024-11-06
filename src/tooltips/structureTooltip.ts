const getStructuresHTML = (structureList) => {
  return `<ul>
              ${structureList
                .map(
                  (
                    structure
                  ) => `<li style="margin: 0.25rem 0"><a style="color:#FFF" href='${structure.source.url}' target='_blank'>
              ${structure.source.id}
          </a> (${structure.start}-${structure.end})</li>`
                )
                .join('')}
          </ul>`;
};

const formatTooltip = (feature) => {
  const structuresHTML = getStructuresHTML(feature.structures);
  return `${structuresHTML ? `<h5>Structures</h5>${structuresHTML}` : ``}`;
};

export default formatTooltip;

import { Metadata } from '../adapters/types/interpro';

const formatTooltip = (
  start: number | '',
  end: number | '',
  metadata: Metadata
) => `
      ${
        start && end
          ? `<h4>InterPro Representative Domain ${start}-${end}</h4><hr />`
          : ''
      }
        <h5>Accession</h5>
        <p>
        <a
          target="_blank"
          rel="noopener"
          href="https://www.ebi.ac.uk/interpro/entry/${
            metadata.source_database
          }/${metadata.accession}/"
        >
        ${metadata.accession}
        </a>
        </p>
        <h5>Name</h5>
        <p>${metadata.name}</p>
        ${
          metadata.integrated
            ? `<h5>Integrated into </h5>
        <p>
        <a
          target="_blank"
          rel="noopener"
          href="https://www.ebi.ac.uk/interpro/entry/InterPro/${metadata.integrated}/"
        >
          ${metadata.integrated}
        </a>
        </p>`
            : ''
        }
      `;

export default formatTooltip;

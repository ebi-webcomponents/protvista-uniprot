import { loadComponent } from "./loadComponents";

import ProtvistaUniprot from "./protvista-uniprot";
import DownloadPanel from "./download-panel";
loadComponent("protvista-uniprot", ProtvistaUniprot);
loadComponent("download-panel", DownloadPanel);

export default ProtvistaUniprot;

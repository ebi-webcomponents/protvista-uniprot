export type RNAEditing = {
  accession: string;
  entryName: string;
  sequence: string;
  sequenceChecksum: string;
  taxid: number;
  features: Feature[];
};

export type Feature = {
  type: string;
  xrefs: Xref[];
  dbReferenceType: DBReferenceType[];
  variantType: VariantType;
  rnaEditingInfo: RnaEditingInfo;
  locationType: LocationType;
  variantlocation: string[];
};

export type DBReferenceType = {
  id: string;
  type: string;
};

export type LocationType = {
  position: Position;
};

export type Position = {
  position: number;
  status: string;
};

export type RnaEditingInfo = {
  nedBS: number;
  nsamples: number;
  nbodySites: number;
  ntissues: number;
  nedInd: number;
};

export type VariantType = {
  genomicLocation: string[];
  variantLocation: VariantLocation[];
  codon: string;
  consequenceType: string;
  wildType: string;
  mutatedType: string;
  somaticStatus: boolean;
  sourceType: string;
};

export type VariantLocation = {
  loc: string;
  seqId: string;
  source: string;
};

export type Xref = {
  id: string;
};

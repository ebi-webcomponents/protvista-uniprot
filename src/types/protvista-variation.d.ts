declare module 'protvista-variation';

type ProtvistaVariant =
  import('protvista-variation-adapter/dist/es/variants').Variant & {
    hasPredictions?: boolean;
    xrefNames?: string[];
  };

type ProtvistaVariationData = {
  variants: ProtvistaVariant[];
}[];

declare class ProtvistaVariation extends HTMLElement {
  colorConfig: (variant: any) => string;
}

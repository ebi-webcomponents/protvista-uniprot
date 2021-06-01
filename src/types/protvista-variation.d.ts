import { Variant } from 'protvista-variation-adapter/dist/es/variants';

declare module 'protvista-variation';

interface ProtvistaVariation extends ProtvistaTrack {
  colorConfig: (variant: any) => string;
}

type ProtvistaVariant = Variant & {
  hasPredictions?: boolean;
  xrefNames?: string[];
};

type ProtvistaVariationData = {
  variants: ProtvistaVariant[];
}[];

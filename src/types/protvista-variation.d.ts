declare module 'protvista-variation';

interface ProtvistaVariation extends ProtvistaTrack {
  colorConfig: (variant: any) => string;
}

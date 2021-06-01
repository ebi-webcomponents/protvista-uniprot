declare module 'protvista-tooltip';

interface ProtvistaTooltip extends HTMLElement {
  title: string;
  visible: boolean;
  x: number;
  y: number;
}

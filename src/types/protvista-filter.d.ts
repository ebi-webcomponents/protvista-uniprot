declare module 'protvista-filter';

declare class ProtvistaFilter extends HTMLElement {
  filters: {
    name: string;
    type: {
      name: string;
      text: string;
    };
    options: {
      labels: string[];
      colors: string[];
    };
    filterData: (data: any) => any;
  }[];
}

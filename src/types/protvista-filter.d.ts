declare module 'protvista-filter';

interface ProtvistaFilter extends HTMLElement {
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
    filterData: (data: any) => returnedData;
  }[];
}

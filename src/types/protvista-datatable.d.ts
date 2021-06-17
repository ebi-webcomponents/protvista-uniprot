declare module 'protvista-datatable';

type ColumnConfig<T> = {
  [key: string]: {
    label: string;
    resolver: (data: T) => string | import('lit-html').TemplateResult;
  };
};

declare class ProtvistaDatatable extends HTMLElement {
  columns: ColumnConfig<any>;
  data: any[];
  rowClickEvent: (e) => void;
  selectedid?: string;
}

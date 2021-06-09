export type NightingaleEvent = Event & {
  detail?: {
    displaystart?: number;
    displayend?: number;
    eventtype?: 'click';
    feature?: any;
    coords?: [number, number];
  };
};

type NightingaleDataAdapter = {
  transformData;
};

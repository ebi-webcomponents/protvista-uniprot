export type NightingaleEvent = Event & {
  detail?: {
    displaystart?: number;
    displayend?: number;
    eventType?: 'click';
    feature?: any;
    coords?: [number, number];
  };
};

type NightingaleDataAdapter = {
  transformData;
};

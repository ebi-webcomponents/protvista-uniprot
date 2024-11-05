export const renameProperties = (features) => {
  return features.map((ft) => {
    const obj = {};
    if (ft.begin) {
      obj.start = ft.begin;
    }
    return {
      ...ft,
      ...obj,
    };
  });
};

export const loadComponent = function (
  name: string,
  elementConstructor: CustomElementConstructor
) {
  if (!customElements.get(name)) {
    customElements.define(name, elementConstructor);
  }
};

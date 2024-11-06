export const renameProperties = (features) =>
  features.map((ft) => ({
    ...ft,
    start: ft.begin || undefined,
  }));

export const loadComponent = function (
  name: string,
  elementConstructor: CustomElementConstructor
) {
  if (!customElements.get(name)) {
    customElements.define(name, elementConstructor);
  }
};

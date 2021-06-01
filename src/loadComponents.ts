const loadComponent = function (
  name: string,
  elementConstructor: CustomElementConstructor
) {
  if (!customElements.get(name)) {
    customElements.define(name, elementConstructor);
  }
};

export { loadComponent };

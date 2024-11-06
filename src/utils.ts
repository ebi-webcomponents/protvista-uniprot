export const renameProperties = (features) =>
  features.map((ft) => ({
    ...ft,
    start: ft.begin || undefined,
  }));

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

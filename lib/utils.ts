export function groupBy<T, R>(
  array: T[],
  callbackfn: (item: T) => R
): { id: R; items: T[] }[] {
  return array.reduce(
    (groupedArray, value) => {
      const key = callbackfn(value);
      let grouped = groupedArray.find(i => i.id === key);
      if (!grouped) {
        grouped = { id: key, items: [] };
        groupedArray.push(grouped);
      }
      grouped.items.push(value);
      return groupedArray;
    },
    [] as Array<{ id: R; items: T[] }>
  );
}

export function arrayToMap<T>(
  array: T[],
  callbackfn: (item: T) => string | number
): Record<string | number, T> {
  return array.reduce<Record<string | number, T>>((acc, item) => {
    const id = callbackfn(item);

    acc[id] = item;
    return acc;
  }, {});
}

export function flatMap<T, U>(
  array: T[],
  callbackfn: (value: T, index: number, array: T[]) => U[]
): U[] {
  return Array.prototype.concat(...array.map(callbackfn));
}

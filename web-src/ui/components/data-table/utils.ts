export function getValueAsArrayOfStrings(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === 'string')
    return value.split(',').map((item) => item.trim());
  return [];
}

export function addPlural(value: number, word: string, plural = `${word}s`) {
  return `${value} ${value === 1 ? word : plural}`;
}

export function applySetStateAction<T>(
  applier: T | ((previous: T) => T),
  value: T
) {
  return typeof applier === 'function'
    ? (applier as (previous: T) => T)(value)
    : applier;
}

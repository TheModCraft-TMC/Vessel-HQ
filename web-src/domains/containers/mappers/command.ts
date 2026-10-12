export function commandStringToArray(input: string) {
  const result: string[] = [];
  let current = '';
  let quote: string | undefined;

  for (const character of input) {
    if (
      (character === '"' || character === "'") &&
      (!quote || quote === character)
    ) {
      quote = quote ? undefined : character;
    } else if (!quote && /\s/.test(character)) {
      if (current) {
        result.push(current);
        current = '';
      }
    } else {
      current += character;
    }
  }

  if (current) result.push(current);
  return result;
}

export function commandArrayToString(array: string[]) {
  return array.map((element) => `'${element}'`).join(' ');
}

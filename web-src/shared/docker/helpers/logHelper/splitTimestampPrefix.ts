// RFC3339Nano has 0–9 fractional digits. Match only the bounded prefix,
// including Docker's single separator space; never normalize timestamp text.
const timestampPrefixRegex =
  /^\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{1,9})?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d) /;

export function splitTimestampPrefix(text: string) {
  // 19 date/time + 10 fraction + 6 timezone + 1 separator, at most.
  const prefix = timestampPrefixRegex.exec(text.slice(0, 36))?.[0];
  return prefix ? { prefix, text: text.slice(prefix.length) } : undefined;
}

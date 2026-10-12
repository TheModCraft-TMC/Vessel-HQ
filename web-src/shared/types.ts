export interface AutomationTestingProps {
  /**
   * Used by cypress to identify this property.
   *
   * Change with care and communicate this with QA
   */
  'data-cy': string;
}

export type WithRequiredProperties<T, K extends keyof T> = Omit<T, K> &
  Required<Pick<T, K>>;

export type ValueOf<T extends Record<string, unknown>> = T[keyof T];

export function stringEnumValues<T extends Record<string, string>>(
  value: T
): T[keyof T][] {
  return Object.values(value) as T[keyof T][];
}

export type DeepPartial<T> = T extends object
  ? { [K in keyof T]?: DeepPartial<T[K]> }
  : T;

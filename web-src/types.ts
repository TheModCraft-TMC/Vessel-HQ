import type { AutomationTestingProps } from '@/shared/types';

export type {
  AutomationTestingProps,
  DeepPartial,
  ValueOf,
  WithRequiredProperties,
} from '@/shared/types';
export { stringEnumValues } from '@/shared/types';

declare module 'react' {
  interface HTMLAttributes<T>
    extends AriaAttributes, DOMAttributes<T>, Partial<AutomationTestingProps> {
    // keep AutomationTestingProps 'data-cy' optional because HTMLAttributes covers non interactive elements
  }
}

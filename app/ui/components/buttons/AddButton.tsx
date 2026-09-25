import { Plus } from 'lucide-react';
import { ComponentProps, PropsWithChildren } from 'react';

import type { AutomationTestingProps } from '@/shared/types';
import { Link } from '@/ui/components/links/Link';

import { Button } from './Button';

export function AddButton({
  to = '.new',
  params,
  children,
  color = 'primary',
  disabled,
  'data-cy': dataCy,
}: PropsWithChildren<
  {
    to?: string;
    params?: object;
    color?: ComponentProps<typeof Button>['color'];
    disabled?: boolean;
  } & AutomationTestingProps
>) {
  return (
    <Button
      as={Link}
      props={{ to, params }}
      icon={Plus}
      className="!m-0"
      data-cy={dataCy}
      color={color}
      disabled={disabled}
    >
      {children || 'Add'}
    </Button>
  );
}

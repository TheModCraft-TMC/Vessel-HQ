import { Environment } from '@/domains/environments';

import { useHomeViewState } from '../hooks/useHomeViewState';

import { EnvironmentHeader } from './EnvironmentHeader/EnvironmentHeader';
import { EnvironmentList } from './EnvironmentList';

interface Props {
  onClickBrowse(environment: Environment): void;
}

export function EnvironmentHomeView({ onClickBrowse }: Props) {
  const tableState = useHomeViewState();

  return (
    <div className="mx-5 mb-5 flex flex-col gap-6">
      <EnvironmentHeader tableState={tableState} />
      <EnvironmentList onClickBrowse={onClickBrowse} tableState={tableState} />
    </div>
  );
}

import { addPlural } from './utils';

interface SelectedRowsCountProps {
  value: number;
  hidden: number;
}

export function SelectedRowsCount({ value, hidden }: SelectedRowsCountProps) {
  return value !== 0 ? (
    <div className="infoBar">
      {addPlural(value, 'item')} selected
      {hidden !== 0 && ` (${hidden} hidden by filters)`}
    </div>
  ) : null;
}

import { Checkbox } from '@/ui/components/forms/Checkbox';

import { useTableSettings } from './useTableSettings';

export interface Action {
  id: string;
  label: string;
}

interface QuickActionsSettings {
  hiddenQuickActions: string[];
  setHiddenQuickActions: (hiddenQuickActions: string[]) => void;
}

interface Props {
  actions: Action[];
}

export function QuickActionsSettings({ actions }: Props) {
  const settings = useTableSettings<QuickActionsSettings>();

  return (
    <>
      {actions.map(({ id, label }) => (
        <Checkbox
          key={id}
          data-cy="quick-actions-checkbox"
          label={label}
          id={`quick-actions-${id}`}
          checked={!settings.hiddenQuickActions.includes(id)}
          onChange={(e) => toggleAction(id, e.target.checked)}
        />
      ))}
    </>
  );

  function toggleAction(key: string, visible: boolean) {
    if (!visible) {
      settings.setHiddenQuickActions([...settings.hiddenQuickActions, key]);
    } else {
      settings.setHiddenQuickActions(
        settings.hiddenQuickActions.filter((action) => action !== key)
      );
    }
  }
}

export function buildAction(id: string, label: string): Action {
  return { id, label };
}

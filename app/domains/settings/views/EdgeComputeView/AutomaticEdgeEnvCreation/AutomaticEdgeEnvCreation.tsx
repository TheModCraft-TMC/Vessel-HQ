import { Laptop } from 'lucide-react';

import { useSettings } from '@/domains/settings/queries';

import { Widget, WidgetBody, WidgetTitle } from '@@/Widget';


import { AutoEnvCreationSettingsForm } from './AutoEnvCreationSettingsForm';

export function AutomaticEdgeEnvCreation() {
  const settingsQuery = useSettings();

  if (!settingsQuery.data) {
    return null;
  }

  const settings = settingsQuery.data;

  return (
    <Widget>
      <WidgetTitle icon={Laptop} title="Automatic Edge Environment Creation" />
      <WidgetBody>
        <AutoEnvCreationSettingsForm settings={settings} />
      </WidgetBody>
    </Widget>
  );
}

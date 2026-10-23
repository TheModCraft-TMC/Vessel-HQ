import { Settings } from 'lucide-react';

import { Widget, WidgetBody, WidgetTitle } from '@/ui/components/Widget';

import { ApplicationSettingsForm } from './ApplicationSettingsForm';

export function ApplicationSettingsWidget() {
  return (
    <Widget>
      <WidgetTitle icon={Settings} title="Application settings" />
      <WidgetBody>
        <ApplicationSettingsForm />
      </WidgetBody>
    </Widget>
  );
}

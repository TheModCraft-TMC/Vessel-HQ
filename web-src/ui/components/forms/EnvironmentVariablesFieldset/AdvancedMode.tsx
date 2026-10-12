import { List } from 'lucide-react';

import type { AutomationTestingProps } from '@/ui/types';
import { TextTip } from '@/ui/components/feedback/Tip/TextTip';
import { Button } from '@/ui/components/buttons';

import { convertToArrayOfStrings, parseDotEnvFile } from './utils';
import { type Values } from './types';

export function AdvancedMode({
  value,
  onChange,
  onSimpleModeClick,
  'data-cy': dataCy,
}: {
  value: Values;
  onChange: (value: Values) => void;
  onSimpleModeClick: () => void;
} & AutomationTestingProps) {
  const editorValue = convertToArrayOfStrings(value).join('\n');

  return (
    <>
      <Button
        size="small"
        color="link"
        icon={List}
        className="!ml-0 p-0 hover:no-underline"
        onClick={onSimpleModeClick}
        data-cy="env-simple-mode-button"
      >
        Simple mode
      </Button>

      <TextTip color="blue" inline={false}>
        Switch to simple mode to define variables line by line, or load from
        .env file
      </TextTip>

      <textarea
        id="environment-variables-editor"
        value={editorValue}
        onChange={(event) => handleEditorChange(event.target.value)}
        placeholder="e.g. key=value"
        className="min-h-64 w-full rounded border border-solid border-gray-5 p-2 font-mono"
        data-cy={dataCy}
      />
    </>
  );

  function handleEditorChange(value: string) {
    onChange(parseDotEnvFile(value));
  }
}

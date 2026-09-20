import { useMemo, useState } from 'react';
import YAML from 'yaml';
import { Minus, Plus } from 'lucide-react';

import { AutomationTestingProps } from '@/types';

import { WebEditorForm } from '@@/WebEditorForm';
import { Button } from '@@/buttons';
import { Alert } from '@@/Alert';
import { Loading } from '@@/Widget/Loading';

type Props = {
  identifier: string;
  data: string;
  hideMessage?: boolean;
  isLoading?: boolean;
  isError?: boolean;
} & AutomationTestingProps;

export function YAMLInspector({
  identifier,
  data,
  hideMessage,
  'data-cy': dataCy,
  isLoading,
  isError,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const yaml = useMemo(() => cleanYamlUnwantedFields(data), [data]);

  if (isLoading) {
    return <Loading />;
  }

  if (isError) {
    return <Alert color="error">Error loading YAML</Alert>;
  }

  return (
    <div>
      <WebEditorForm
        data-cy={dataCy}
        value={yaml}
        textTip={
          hideMessage
            ? undefined
            : 'Define or paste the content of your manifest here'
        }
        readonly
        hideTitle
        id={identifier}
        type="yaml"
        height={expanded ? '800px' : '500px'}
        onChange={() => undefined}
      />
      <div className="flex items-center justify-between py-5">
        <Button
          icon={expanded ? Minus : Plus}
          data-cy={`expand-collapse-yaml-${identifier}`}
          color="default"
          className="!ml-0"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? 'Collapse' : 'Expand'}
        </Button>
      </div>
    </div>
  );
}

export function cleanYamlUnwantedFields(yml: string) {
  try {
    const ymls = yml.split('---');
    const cleanYmls = ymls.map((yml) => {
      const y = YAML.parse(yml);
      if (y.metadata) {
        const metadata = { ...y.metadata };
        delete metadata.managedFields;
        delete metadata.resourceVersion;
        y.metadata = metadata;
      }
      return YAML.stringify(y);
    });
    return cleanYmls.join('---\n');
  } catch {
    return yml;
  }
}

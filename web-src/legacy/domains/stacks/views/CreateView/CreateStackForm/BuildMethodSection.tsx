import { useFormikContext } from 'formik';
import type { JSONSchema7 } from 'json-schema';

import { WebhookFieldset } from '@/domains/stacks/components/common/WebhookFieldset';
import { FormSection } from '@/ui/components/forms/FormSection';

import {
  customTemplate,
  editor,
  git,
  upload,
} from '@@/BoxSelector/common-options/build-methods';
import { BoxSelector } from '@@/BoxSelector';

import { EditorSection } from './EditorSection/EditorSection';
import { GitSection } from './GitSection/GitSection';
import { TemplateSection } from './TemplateSection/TemplateSection';
import { FormValues } from './types';
import { UploadSection } from './UploadSection/UploadSection';

const buildMethods = [editor, upload, git, customTemplate];

export function BuildMethodSection({
  isSwarm,
  isSaved,
  webhookId,
  schema,
}: {
  isSwarm: boolean;
  isSaved: boolean;
  webhookId: string;
  schema?: JSONSchema7;
}) {
  const { values, setFieldValue } = useFormikContext<FormValues>();

  return (
    <>
      <FormSection title="Build method">
        <BoxSelector
          radioName="build-method"
          value={values.method}
          onChange={(method) => setFieldValue('method', method)}
          options={buildMethods}
          slim
        />
      </FormSection>

      {values.method === 'upload' && <UploadSection isSwarm={isSwarm} />}

      {values.method === 'repository' && (
        <GitSection isDockerStandalone={!isSwarm} webhookId={webhookId} />
      )}

      {values.method === 'template' && (
        <TemplateSection isSwarm={isSwarm} schema={schema} isSaved={isSaved} />
      )}

      {values.method === 'editor' && (
        <EditorSection schema={schema} isSwarm={isSwarm} isSaved={isSaved} />
      )}

      {values.method !== 'repository' && (
        <WebhookFieldset
          value={values.enableWebhook}
          onChange={(value) => setFieldValue('enableWebhook', value)}
          webhookId={webhookId}
        />
      )}
    </>
  );
}

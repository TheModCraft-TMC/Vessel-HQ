import { useCallback } from 'react';
import { useFormikContext } from 'formik';
import { JSONSchema7 } from 'json-schema';

import { CustomTemplatesVariablesField } from '@/domains/templates';
import {
  isTemplateVariablesEnabled,
  renderTemplate,
} from '@/domains/templates';
import { TemplateNote } from '@/domains/templates';
import { useCustomTemplateFile } from '@/domains/templates';
import { CustomTemplate } from '@/domains/templates';
import { useCurrentUser } from '@/react/hooks/useUser';
import { textByType } from '@/domains/stacks/components/common/form-texts';
import { StackType } from '@/domains/stacks/models/types';
import { useCustomTemplate } from '@/domains/templates';
import { FormSection } from '@/ui/components/forms/FormSection';
import { InlineLoader } from '@/ui/components/feedback/InlineLoader';
import { Link } from '@/ui/components/links/Link';
import { TextTip } from '@/ui/components/feedback/Tip/TextTip';

import { CustomTemplateSelector } from '@@/CustomTemplateSelector';
import { usePreventExit, WebEditorForm } from '@@/WebEditorForm';

import { FormValues } from '../types';

import { useTemplateInitialization } from './useTemplateInitialization';

export function TemplateSection({
  isSwarm,
  schema,
  isSaved,
}: {
  isSwarm: boolean;
  schema?: JSONSchema7;
  isSaved: boolean;
}) {
  const texts =
    textByType[isSwarm ? StackType.DockerSwarm : StackType.DockerCompose];
  const { values, errors, setFieldValue, isSubmitting } =
    useFormikContext<FormValues>();

  const { user, isPureAdmin } = useCurrentUser();

  const templateQuery = useCustomTemplate(values.template.selectedId);

  const selectedTemplate = templateQuery.data;

  const templateFileQuery = useCustomTemplateFile(
    values.template.selectedId,
    !!selectedTemplate?.GitConfig
  );

  const templateFile = templateFileQuery.data || '';

  usePreventExit(
    templateFile,
    values.template.fileContent,
    !isSubmitting && !isSaved
  );

  const isAdminOrEditor =
    isPureAdmin || user.Id === selectedTemplate?.CreatedByUserId;

  const handleVariablesChange = useCallback(
    (newVariables: Array<{ key: string; value?: string }>) => {
      setFieldValue('template.variables', newVariables);
      if (selectedTemplate && templateFile) {
        const rendered = renderTemplate(
          templateFile,
          newVariables,
          selectedTemplate.Variables
        );
        setFieldValue('template.fileContent', rendered);
      }
    },
    [selectedTemplate, setFieldValue, templateFile]
  );

  const handleFileContentChange = useCallback(
    (value: string) => {
      setFieldValue('template.fileContent', value);
    },
    [setFieldValue]
  );

  useTemplateInitialization({
    selectedTemplate,
    templateFile,
    onVariablesChange: handleVariablesChange,
    onFileContentChange: handleFileContentChange,
  });

  function handleTemplateChange(templateId: CustomTemplate['Id'] | undefined) {
    setFieldValue('template.selectedId', templateId);
    if (templateId) {
      setFieldValue('template.variables', []);
      setFieldValue('template.fileContent', '');
    }
  }

  return (
    <>
      <FormSection title="Template">
        <CustomTemplateSelector
          value={values.template.selectedId}
          onChange={handleTemplateChange}
          error={errors.template?.selectedId}
        />

        {!!values.template.selectedId && templateFileQuery.isLoading && (
          <InlineLoader>Loading template...</InlineLoader>
        )}
      </FormSection>

      {selectedTemplate && (
        <>
          <TemplateNote note={selectedTemplate.Note} />

          {isTemplateVariablesEnabled && (
            <CustomTemplatesVariablesField
              definitions={selectedTemplate.Variables}
              onChange={handleVariablesChange}
              value={values.template.variables}
              errors={errors.template?.variables}
            />
          )}

          {templateFileQuery.isError && (
            <TextTip color="orange">
              {isAdminOrEditor ? (
                <>
                  Custom template could not be loaded, please{' '}
                  <Link
                    to="kubernetes.templates.custom.edit"
                    params={{ id: selectedTemplate.Id }}
                    data-cy="template-error-edit-link"
                  >
                    click here
                  </Link>{' '}
                  for configuration.
                </>
              ) : (
                <>
                  Custom template could not be loaded, please contact your
                  administrator.
                </>
              )}
            </TextTip>
          )}

          {values.template.fileContent && (
            <WebEditorForm
              id="stack-creation-editor"
              type="yaml"
              value={values.template.fileContent}
              textTip={texts.editor.placeholder}
              readonly={!!selectedTemplate.GitConfig}
              data-cy="stack-creation-editor"
              schema={schema}
              onChange={handleFileContentChange}
            >
              {texts.editor.description}
            </WebEditorForm>
          )}
        </>
      )}
    </>
  );
}

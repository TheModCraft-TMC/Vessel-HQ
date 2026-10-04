import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';

import { useDebouncedValue } from '@/react/hooks/useDebouncedValue';
import { EnvironmentId } from '@/domains/environments';
import { FormSection } from '@/ui/components/forms/FormSection';
import { InlineLoader } from '@/ui/components/feedback/InlineLoader';
import { Alert } from '@/ui/components/feedback/Alert';
import { TextTip } from '@/ui/components/feedback/Tip/TextTip';
import { Badge } from '@/ui/components/status/Badge';
import { Icon } from '@/ui/components/icons/Icon';

import { DiffViewer } from '@@/CodeEditor/DiffViewer';
import { CodeEditor } from '@@/CodeEditor';
import { ExpandableMessageByLines } from '@@/ExpandableMessageByLines';

import { useHelmDryRun } from '../helmReleaseQueries/useHelmDryRun';
import { UpdateHelmReleasePayload } from '../types';

type Props = {
  payload: UpdateHelmReleasePayload;
  onChangePreviewValidation: (isValid: boolean) => void;
  currentManifest?: string; // only true on upgrade, not install
  title: string;
  environmentId: EnvironmentId;
};

export function ManifestPreviewFormSection({
  payload,
  currentManifest,
  onChangePreviewValidation,
  title,
  environmentId,
}: Props) {
  const debouncedPayload = useDebouncedValue(payload, 500);
  const manifestPreviewQuery = useHelmDryRun(environmentId, debouncedPayload);
  const [isFolded, setIsFolded] = useState(true);

  useEffect(() => {
    onChangePreviewValidation(!manifestPreviewQuery.isError);
  }, [manifestPreviewQuery.isError, onChangePreviewValidation]);

  if (
    !debouncedPayload.name ||
    !debouncedPayload.namespace ||
    !debouncedPayload.chart
  ) {
    return null;
  }

  // only show loading state or the error to keep the view simple (omitting the preview section because there is nothing to preview)
  if (manifestPreviewQuery.isInitialLoading) {
    return <InlineLoader>Generating manifest preview...</InlineLoader>;
  }

  return (
    <FormSection
      title={
        <>
          {title}
          {manifestPreviewQuery.isError && (
            <Badge
              type="dangerSecondary"
              className="ml-2"
              data-cy="helm-manifest-preview-error-badge"
            >
              <Icon icon={AlertTriangle} size="md" />
            </Badge>
          )}
        </>
      }
      isFoldable
      defaultFolded={isFolded}
      setIsDefaultFolded={setIsFolded}
    >
      {manifestPreviewQuery.isError ? (
        <Alert color="error" title="Error with Helm chart configuration">
          <ExpandableMessageByLines>
            {manifestPreviewQuery.error?.message ||
              'Error generating manifest preview'}
          </ExpandableMessageByLines>
        </Alert>
      ) : (
        <ManifestPreview
          currentManifest={currentManifest}
          newManifest={manifestPreviewQuery.data?.manifest ?? ''}
        />
      )}
    </FormSection>
  );
}

function ManifestPreview({
  currentManifest,
  newManifest,
}: {
  currentManifest?: string;
  newManifest: string;
}) {
  if (!newManifest) {
    return <TextTip color="blue">No manifest preview available</TextTip>;
  }

  if (currentManifest) {
    return (
      <DiffViewer
        originalCode={currentManifest}
        newCode={newManifest}
        id="manifest-preview"
        data-cy="manifest-diff-preview"
        type="yaml"
      />
    );
  }

  return (
    <CodeEditor
      id="manifest-preview"
      value={newManifest}
      data-cy="manifest-preview"
      type="yaml"
      readonly
      showToolbar={false}
    />
  );
}

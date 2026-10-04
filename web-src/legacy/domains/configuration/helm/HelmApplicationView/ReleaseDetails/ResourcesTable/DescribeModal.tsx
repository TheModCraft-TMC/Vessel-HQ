import { Alert } from '@/ui/components/feedback/Alert';
import { InlineLoader } from '@/ui/components/feedback/InlineLoader';
import { Modal } from '@/ui/components/dialog';
import { ModalBody } from '@/ui/components/dialog/Modal/ModalBody';
import { ModalHeader } from '@/ui/components/dialog/Modal/ModalHeader';

import { CodeEditor } from '@@/CodeEditor';

import { useDescribeResource } from './queries/useDescribeResource';

type Props = {
  name: string;
  resourceType?: string;
  namespace?: string;
  onDismiss: () => void;
};

export function DescribeModal({
  name,
  resourceType,
  namespace,
  onDismiss,
}: Props) {
  const title = `Describe ${resourceType}`;

  const { data, isLoading, isError } = useDescribeResource(
    name,
    resourceType,
    namespace
  );

  return (
    <Modal onDismiss={onDismiss} size="lg" aria-label={title}>
      <ModalHeader title={title} />
      <ModalBody>
        {isLoading ? (
          <InlineLoader>Loading...</InlineLoader>
        ) : (
          <>
            {isError ? (
              <Alert color="error" title="Error">
                Error loading resource details
              </Alert>
            ) : (
              <CodeEditor
                id="describe-resource"
                data-cy="describe-resource"
                readonly
                value={data?.describe}
                type="yaml"
              />
            )}
          </>
        )}
      </ModalBody>
    </Modal>
  );
}

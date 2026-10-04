import { Save } from 'lucide-react';

import { LoadingButton } from '@/ui/components/buttons/LoadingButton';
import { Button } from '@/ui/components/buttons';
import { Link } from '@/ui/components/links/Link';

interface Props {
  isLoading: boolean;
  isValid: boolean;
  isDirty: boolean;
}

export function EnvironmentFormActions({ isLoading, isValid, isDirty }: Props) {
  return (
    <div className="form-group">
      <div className="col-sm-12">
        <LoadingButton
          className="wizard-connect-button !ml-0"
          loadingText="Updating environment..."
          isLoading={isLoading}
          disabled={!isDirty || !isValid}
          icon={Save}
          data-cy="environment-update-button"
        >
          Update environment
        </LoadingButton>

        <Button
          type="button"
          color="default"
          as={Link}
          props={{ to: '/environments' }}
          disabled={isLoading}
          data-cy="environment-cancel-button"
          className="!ml-2"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}

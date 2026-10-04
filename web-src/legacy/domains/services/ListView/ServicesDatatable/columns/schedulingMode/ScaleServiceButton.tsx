import { Minimize2 } from 'lucide-react';
import { useState } from 'react';

import { ServiceViewModel } from '@/domains/services/models/service';
import { Authorized } from '@/react/hooks/useUser';
import { Button } from '@/ui/components/buttons';

import { ScaleForm } from './ScaleForm';

export function ScaleServiceButton({ service }: { service: ServiceViewModel }) {
  const [isEdit, setIsEdit] = useState(false);

  if (!isEdit) {
    return (
      <Authorized authorizations="DockerServiceUpdate">
        <Button
          color="none"
          icon={Minimize2}
          onClick={() => setIsEdit(true)}
          data-cy="scale-service-button"
        >
          Scale
        </Button>
      </Authorized>
    );
  }

  return <ScaleForm onClose={() => setIsEdit(false)} service={service} />;
}

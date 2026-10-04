'use client';

import { CreateForm } from '@/domains/gitops/sources/CreateView/CreateForm';
import {
  AccessControlStep,
  validateAccessControlStep,
} from '@/domains/gitops/sources/CreateView/steps/AccessControlStep';
import {
  ConfigureStep,
  validateConfigureStep,
} from '@/domains/gitops/sources/CreateView/steps/ConfigureStep';
import {
  TypeSelectStep,
  validateTypeSelectStep,
} from '@/domains/gitops/sources/CreateView/steps/TypeSelectStep';
import {
  WizardProvider,
  WizardStep,
} from '@/domains/gitops/sources/CreateView/WizardContext';

import { useWizardSteps } from '@@/Stepper/useWizardSteps';

const STEPS: WizardStep[] = [
  {
    id: 'type',
    label: 'Select source type',
    component: TypeSelectStep,
    validateStep: validateTypeSelectStep,
  },
  {
    id: 'configure',
    label: 'Configure connection',
    component: ConfigureStep,
    validateStep: validateConfigureStep,
  },
  {
    id: 'access',
    label: 'Access control',
    component: AccessControlStep,
    validateStep: validateAccessControlStep,
  },
];

export function SourceCreateContent() {
  const wizard = useWizardSteps<WizardStep>({ steps: STEPS });

  return (
    <div className="form-horizontal pb-20">
      <div className="row">
        <div className="col-sm-12">
          <WizardProvider context={wizard}>
            <CreateForm steps={STEPS} />
          </WizardProvider>
        </div>
      </div>
    </div>
  );
}

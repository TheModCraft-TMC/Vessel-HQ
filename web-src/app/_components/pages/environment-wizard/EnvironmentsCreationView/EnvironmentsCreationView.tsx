import { useRouteParams } from '@console/console/routing/useRouteParams';
import { usePathname, useRouter } from 'next/navigation';
import { buildHref } from '@console/console/routing/buildHref';
import { useState, useMemo } from 'react';
import _ from 'lodash';
import { Wand2 } from 'lucide-react';

import { notifyError } from '@/ui/components/toast/notifications';
import { Environment, EnvironmentId } from '@/domains/environments';
import { PageHeader } from '@/ui/layouts/view-layout/page-header';
import { Button } from '@/ui/components/buttons';
import { FormSection } from '@/ui/components/forms/FormSection';

import { Widget, WidgetBody, WidgetTitle } from '@@/Widget';
import { Stepper } from '@@/Stepper/Stepper';
import { StickyFooter } from '@@/StickyFooter/StickyFooter';

import {
  EnvironmentOptionValue,
  environmentTypes,
  formTitles,
} from '../EnvironmentTypeSelectView/environment-types';

import { WizardDocker } from './WizardDocker';
import { WizardAzure } from './WizardAzure';
import { WizardKubernetes } from './WizardKubernetes';
import { AnalyticsState, AnalyticsStateKey } from './types';
import styles from './EnvironmentsCreationView.module.css';
import { WizardEndpointsList } from './WizardEndpointsList';
import { WizardPodman } from './WizardPodman';

type Props = {
  environmentTypes?: EnvironmentOptionValue[];
  step?: EnvironmentOptionValue;
  localEnvironmentId?: EnvironmentId;
  onStepChange?: (step: EnvironmentOptionValue, replace: boolean) => void;
  onFinish?: () => void;
};

export function EnvironmentCreationView({
  environmentTypes: suppliedEnvironmentTypes,
  step: suppliedStep,
  localEnvironmentId,
  onStepChange,
  onFinish,
}: Props = {}) {
  const {
    localEndpointId: localEndpointIdParam,
    referrer,
    step: urlStep,
  } = useRouteParams();

  const [environmentIds, setEnvironmentIds] = useState<EnvironmentId[]>(() => {
    const localEndpointId =
      localEnvironmentId || parseInt(localEndpointIdParam, 10);

    if (!localEndpointId || Number.isNaN(localEndpointId)) {
      return [];
    }

    return [localEndpointId];
  });

  const envTypes = useParamEnvironmentTypes(suppliedEnvironmentTypes);
  const router = useRouter();
  const pathname = usePathname();

  const steps = useMemo(
    () =>
      _.compact(
        envTypes.map((id) => environmentTypes.find((eType) => eType.id === id))
      ).map((step) => ({ ...step, enabled: true })),
    [envTypes]
  );

  const { setAnalytics } = useAnalyticsState();

  const currentStepIndex = useMemo(() => {
    const activeStep = suppliedStep || urlStep;
    if (!activeStep) return 0;
    const idx = steps.findIndex((s) => s.id === activeStep);
    return idx >= 0 ? idx : 0;
  }, [suppliedStep, urlStep, steps]);

  const currentStep = steps[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;
  const Component = getComponent(currentStep.id);

  const isDockerStandalone = currentStep.id === 'dockerStandalone';

  return (
    <div className="pb-20">
      <PageHeader
        title="Quick Setup"
        breadcrumbs={[{ label: 'Environment Wizard' }]}
        reload
      />

      <div className="row">
        <div className="col-sm-12">
          <Stepper
            steps={steps}
            currentStepIndex={currentStepIndex}
            onStepClick={onStepClick}
          />
        </div>
      </div>
      <div className={styles.wizardWrapper}>
        <Widget>
          <WidgetTitle icon={Wand2} title="Environment Wizard" />
          <WidgetBody>
            <FormSection title={formTitles[currentStep.id]}>
              <Component
                onCreate={handleCreateEnvironment}
                isDockerStandalone={isDockerStandalone}
              />
            </FormSection>
          </WidgetBody>
        </Widget>
        <div>
          <WizardEndpointsList environmentIds={environmentIds} />
        </div>
      </div>

      <StickyFooter className="justify-end gap-4">
        <Button
          color="default"
          onClick={onPreviousClick}
          disabled={isFirstStep}
          data-cy="environment-wizard-back-button"
          size="medium"
        >
          Back
        </Button>
        <Button
          color="primary"
          onClick={onNextClick}
          data-cy="environment-wizard-continue-button"
          size="medium"
        >
          {isLastStep ? 'Close' : 'Continue'}
        </Button>
      </StickyFooter>
    </div>
  );

  function navigateToStep(index: number, replace = false) {
    const nextStep = steps[index]?.id;
    if (nextStep && onStepChange) {
      onStepChange(nextStep, replace);
      return;
    }

    router.push(buildHref('', { step: nextStep ?? null }, pathname));
  }

  function onNextClick() {
    if (isLastStep) {
      handleFinish();
      return;
    }
    navigateToStep(currentStepIndex + 1);
  }

  function onPreviousClick() {
    navigateToStep(currentStepIndex - 1, true);
  }

  function onStepClick(index: number) {
    navigateToStep(index, index < currentStepIndex);
  }

  function handleCreateEnvironment(
    environment: Environment,
    analytics: AnalyticsStateKey
  ) {
    setEnvironmentIds((prev) => [...prev, environment.Id]);
    setAnalytics(analytics);
  }

  function handleFinish() {
    if (onFinish) {
      onFinish();
      return;
    }

    if (referrer === 'environments') {
      router.push(buildHref('/environments', {}, pathname));
      return;
    }
    router.push(buildHref('/', {}, pathname));
  }
}

function useParamEnvironmentTypes(
  suppliedEnvironmentTypes?: EnvironmentOptionValue[]
): EnvironmentOptionValue[] {
  const { envType } = useRouteParams();
  const router = useRouter();
  const pathname = usePathname();

  if (suppliedEnvironmentTypes?.length) {
    return suppliedEnvironmentTypes;
  }

  if (!envType) {
    notifyError('No environment type provided');
    router.push(buildHref('/environments/new', {}, pathname));
    return [];
  }

  return isEnvironmentOptionValue(envType) ? [envType] : [];
}

function isEnvironmentOptionValue(
  value: string
): value is EnvironmentOptionValue {
  return [
    'dockerStandalone',
    'dockerSwarm',
    'podman',
    'aci',
    'kubernetes',
    'kubesolo',
    'k8sInstall',
  ].includes(value);
}

function getComponent(id: EnvironmentOptionValue) {
  switch (id) {
    case 'dockerStandalone':
    case 'dockerSwarm':
      return WizardDocker;
    case 'podman':
      return WizardPodman;
    case 'aci':
      return WizardAzure;
    case 'kubernetes':
      return WizardKubernetes;
    default:
      throw new Error(`Unknown environment type ${id}`);
  }
}

function useAnalyticsState() {
  const [analytics, setAnalyticsState] = useState<AnalyticsState>({
    dockerAgent: 0,
    dockerApi: 0,
    dockerEdgeAgentAsync: 0,
    dockerEdgeAgentStandard: 0,
    podmanAgent: 0,
    podmanEdgeAgentAsync: 0,
    podmanEdgeAgentStandard: 0,
    podmanLocalEnvironment: 0,
    kubernetesAgent: 0,
    kubernetesEdgeAgentAsync: 0,
    kubernetesEdgeAgentStandard: 0,
    kubesoloEdgeAgentStandard: 0,
    kubesoloEdgeAgentAsync: 0,
    aciApi: 0,
    localEndpoint: 0,
  });

  return { analytics, setAnalytics };

  function setAnalytics(key: AnalyticsStateKey) {
    setAnalyticsState((prevState) => ({
      ...prevState,
      [key]: prevState[key] + 1,
    }));
  }
}

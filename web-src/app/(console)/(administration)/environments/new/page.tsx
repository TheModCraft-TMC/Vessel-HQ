'use client';

import { useRouter, useSearchParams } from 'next/navigation';

import {
  EnvironmentCreationView,
  EnvironmentTypeSelectView,
} from '@/react/portainer/environments/wizard';
import {
  EnvironmentOptionValue,
  environmentTypes,
} from '@/react/portainer/environments/wizard/EnvironmentTypeSelectView/environment-types';

const validTypes = new Set<EnvironmentOptionValue>(
  environmentTypes.map((type) => type.id)
);

export default function NewEnvironmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const types = parseTypes(searchParams.get('types'));
  const step = types.find((type) => type === searchParams.get('step'));

  if (types.length === 0) {
    return (
      <EnvironmentTypeSelectView
        onStart={(selectedTypes) => {
          const params = new URLSearchParams();
          params.set('types', selectedTypes.join(','));
          router.push(`/environments/new?${params}`);
        }}
      />
    );
  }

  return (
    <EnvironmentCreationView
      environmentTypes={types}
      step={step}
      onFinish={() => router.push('/environments')}
      onStepChange={(nextStep, replace) => {
        const params = new URLSearchParams(searchParams);
        params.set('step', nextStep);
        const href = `/environments/new?${params}`;
        if (replace) router.replace(href);
        else router.push(href);
      }}
    />
  );
}

function parseTypes(value: string | null): EnvironmentOptionValue[] {
  if (!value) return [];

  return value
    .split(',')
    .filter((type): type is EnvironmentOptionValue =>
      validTypes.has(type as EnvironmentOptionValue)
    );
}

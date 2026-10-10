import { Form, useFormikContext } from 'formik';
import { useMemo } from 'react';

import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { FormControl } from '@/ui/components/forms/FormControl';
import { Option, PortainerSelect } from '@/ui/components/forms/PortainerSelect';
import { FormSection } from '@/ui/components/forms/FormSection';
import { LoadingButton } from '@/ui/components/buttons';
import { Chart } from '@/domains/configuration/helm/types';
import { useHelmChartValues } from '@/domains/configuration/helm/helmChartSourceQueries/useHelmChartValues';
import { HelmValuesInput } from '@/domains/configuration/helm/components/HelmValuesInput';
import { ChartVersion } from '@/domains/configuration/helm/helmChartSourceQueries/useHelmRepoVersions';
import { ManifestPreviewFormSection } from '@/domains/configuration/helm/components/ManifestPreviewFormSection';

import { HelmInstallFormValues } from './types';

type Props = {
  selectedChart: Chart;
  namespace?: string;
  name?: string;
  versionOptions: Option<ChartVersion>[];
  isVersionsLoading: boolean;
  isRepoAvailable: boolean;
  setPreviewIsValid: (isValid: boolean) => void;
};

export function HelmInstallInnerForm({
  selectedChart,
  namespace,
  name,
  versionOptions,
  isVersionsLoading,
  isRepoAvailable,
  setPreviewIsValid,
}: Props) {
  const environmentId = useEnvironmentId();
  const { values, setFieldValue, isSubmitting } =
    useFormikContext<HelmInstallFormValues>();

  const selectedVersion: ChartVersion | undefined = useMemo(
    () =>
      versionOptions.find(
        (v) =>
          v.value.Version === values.version &&
          v.value.Repo === selectedChart.repo
      )?.value ?? versionOptions[0]?.value,
    [versionOptions, values.version, selectedChart.repo]
  );

  const repoParams = {
    repo: selectedChart.repo,
  };
  // use isLatestVersionFetched to cache the latest version, to avoid duplicate fetches
  const isLatestVersionFetched =
    // if no version is selected, the latest version gets fetched
    !versionOptions.length ||
    // otherwise check if the selected version is the latest version
    (selectedVersion?.Version === versionOptions[0]?.value.Version &&
      selectedVersion?.Repo === versionOptions[0]?.value.Repo);
  const chartValuesRefQuery = useHelmChartValues(
    {
      chart: selectedChart.name,
      version: values?.version,
      ...repoParams,
    },
    isLatestVersionFetched
  );

  const payload = useMemo(
    () => ({
      name: name || '',
      namespace: namespace || '',
      chart: selectedChart.name,
      version: values?.version,
      repo: selectedChart.repo,
      values: values.values,
    }),
    [
      name,
      namespace,
      selectedChart.name,
      values?.version,
      selectedChart.repo,
      values.values,
    ]
  );

  return (
    <Form className="form-horizontal">
      <div className="form-group !m-0">
        <FormSection title="Configuration" className="mt-4">
          <FormControl
            label="Version"
            inputId="version-input"
            isLoading={isVersionsLoading}
            loadingText="Loading versions..."
          >
            <PortainerSelect<ChartVersion>
              value={selectedVersion}
              options={versionOptions}
              noOptionsMessage={() => 'No versions found'}
              placeholder="Select a version"
              onChange={(version) => {
                if (version) {
                  setFieldValue('version', version.Version);
                  setFieldValue('repo', version.Repo);
                }
              }}
              data-cy="helm-version-input"
            />
          </FormControl>
          <HelmValuesInput
            values={values.values}
            setValues={(values) => setFieldValue('values', values)}
            valuesRef={chartValuesRefQuery.data?.values ?? ''}
            isValuesRefLoading={chartValuesRefQuery.isInitialLoading}
          />
        </FormSection>
        <ManifestPreviewFormSection
          payload={payload}
          onChangePreviewValidation={setPreviewIsValid}
          title="Manifest preview"
          environmentId={environmentId}
        />
      </div>

      <LoadingButton
        className="!ml-0 mt-5"
        loadingText="Installing Helm chart"
        isLoading={isSubmitting}
        disabled={!namespace || !name || !isRepoAvailable}
        data-cy="helm-install"
      >
        Install
      </LoadingButton>
    </Form>
  );
}

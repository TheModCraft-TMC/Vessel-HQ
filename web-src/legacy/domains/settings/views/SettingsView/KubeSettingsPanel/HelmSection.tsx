import { Field, useField } from 'formik';

import { TextTip } from '@/ui/components/feedback/Tip/TextTip';
import { FormControl } from '@/ui/components/forms/FormControl';
import { FormSection } from '@/ui/components/forms/FormSection';
import { Input } from '@/ui/components/forms/Input';

import { ExternalLink } from '@@/ExternalLink';

export function HelmSection() {
  const [{ name }, { error }] = useField<string>('helmRepositoryUrl');

  return (
    <FormSection title="Helm repository">
      <div className="mb-2">
        <TextTip color="blue">
          You can specify the URL to your own{' '}
          <ExternalLink
            to="https://helm.sh/docs/topics/chart_repository/"
            data-cy="helm-repository-link"
          >
            Helm repository
          </ExternalLink>{' '}
          here.
        </TextTip>
      </div>

      <FormControl label="URL" errors={error} inputId="helm-repo-url">
        <Field
          as={Input}
          id="helm-repo-url"
          data-cy="helm-repo-url-input"
          name={name}
          placeholder="https://kubernetes.github.io/ingress-nginx"
        />
      </FormControl>
    </FormSection>
  );
}

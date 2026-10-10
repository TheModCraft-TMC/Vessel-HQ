import { useCurrentUser } from '@/react/hooks/useUser';
import { Link } from '@/ui/components/links/Link';

import { InsightsBox } from '@@/InsightsBox';

export function StackNameLabelInsight() {
  const { isPureAdmin } = useCurrentUser();
  const insightsBoxContent = (
    <>
      The stack field below was previously labelled &apos;Name&apos; but, in
      fact, it&apos;s always been the stack name (hence the relabelling).
      {isPureAdmin && (
        <>
          <br />
          Kubernetes Stacks functionality can be turned off entirely via{' '}
          <Link
            to="/settings"
            target="_blank"
            data-cy="k8s-deploy-settings-link"
          >
            Kubernetes Settings
          </Link>
          .
        </>
      )}
    </>
  );

  return (
    <InsightsBox
      type="slim"
      header="Stack"
      content={insightsBoxContent}
      insightCloseId="k8s-stacks-name"
    />
  );
}

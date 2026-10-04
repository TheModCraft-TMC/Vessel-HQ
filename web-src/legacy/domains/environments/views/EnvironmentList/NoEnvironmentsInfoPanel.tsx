import { Link } from '@/ui/components/links/Link';
import { TextTip } from '@/ui/components/feedback/Tip/TextTip';

import { InformationPanel } from '@@/InformationPanel';

export function NoEnvironmentsInfoPanel({ isAdmin }: { isAdmin: boolean }) {
  return (
    <div className="row">
      <div className="col-sm-12">
        <InformationPanel title="Information">
          <TextTip>
            {isAdmin ? (
              <span>
                No environment available for management. Please head over the{' '}
                <Link
                  to="/environments/new"
                  data-cy="wizard-add-environments-link"
                >
                  environment wizard
                </Link>{' '}
                to add an environment.
              </span>
            ) : (
              <span>
                You do not have access to any environment. Please contact your
                administrator.
              </span>
            )}
          </TextTip>
        </InformationPanel>
      </div>
    </div>
  );
}

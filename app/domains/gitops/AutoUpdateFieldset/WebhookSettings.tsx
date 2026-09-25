import { truncateLeftRight } from '@/portainer/filters/filters';
import { CopyButton } from '@/ui/components/buttons';
import { FormControl } from '@/ui/components/forms/FormControl';

import { HelpLink } from '@@/HelpLink';

export function WebhookSettings({
  value,
  baseUrl,
  docsLink,
}: {
  docsLink?: string;
  value: string;
  baseUrl: string;
}) {
  const url = `${baseUrl}/${value}`;

  return (
    <FormControl
      label="Webhook URL"
      tooltip={
        !!docsLink && (
          <>
            See{' '}
            <HelpLink docLink={docsLink}>
              documentation on webhook usage
            </HelpLink>
            .
          </>
        )
      }
    >
      <div className="flex items-center gap-2">
        <span
          className="text-muted"
          aria-label="webhook url"
          role="textbox"
          aria-readonly
        >
          {truncateLeftRight(url)}
        </span>
        <CopyButton
          copyText={url}
          color="light"
          data-cy="copy-webhook-link-button"
        >
          Copy link
        </CopyButton>
      </div>
    </FormControl>
  );
}

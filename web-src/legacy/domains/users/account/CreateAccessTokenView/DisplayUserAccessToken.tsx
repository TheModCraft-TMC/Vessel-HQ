import { Button, CopyButton } from '@/ui/components/buttons';
import { FormSectionTitle } from '@/ui/components/forms/FormSectionTitle';
import { TextTip } from '@/ui/components/feedback/Tip/TextTip';
import { Link } from '@/ui/components/links/Link';

export function DisplayUserAccessToken({ apikey }: { apikey: string }) {
  return (
    <>
      <FormSectionTitle>New access token</FormSectionTitle>
      <TextTip>
        Please copy the new access token. You won&#39;t be able to view the
        token again.
      </TextTip>
      <div className="pt-5">
        <div className="inline-flex">
          <div className="">{apikey}</div>
          <div>
            <CopyButton
              copyText={apikey}
              color="link"
              data-cy="create-access-token-copy-button"
            />
          </div>
        </div>
        <hr />
      </div>
      <Button
        as={Link}
        props={{
          to: '/account',
        }}
        data-cy="create-access-token-done-button"
      >
        Done
      </Button>
    </>
  );
}

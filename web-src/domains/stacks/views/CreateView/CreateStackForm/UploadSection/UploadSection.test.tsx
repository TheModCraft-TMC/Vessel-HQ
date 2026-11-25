import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { Formik, useFormikContext } from 'formik';
import { HttpResponse } from 'msw';

import { withTestQueryProvider } from '@/core/query/test-support/withTestQuery';
import { http, server } from '@/core/test-support/setup/server';

import { FormValues } from '../types';

import { UploadSection } from './UploadSection';

const preview = {
  archiveDigest: `sha256:${'a'.repeat(64)}`,
  manifest: {
    composeFiles: ['compose.yaml', 'overrides/été.yaml'],
    environmentNames: ['APP_TAG'],
  },
  files: {
    'compose.yaml': `services: {app: {image: "app:\${APP_TAG}"}}`,
    'overrides/été.yaml': 'services: {app: {command: "echo été"}}',
  },
};

function Probe() {
  const { values } = useFormikContext<FormValues>();
  return (
    <output aria-label="Reviewed archive">{values.upload.projectDigest}</output>
  );
}

function renderUpload() {
  const Component = withTestQueryProvider(() => (
    <Formik
      initialValues={{ upload: { file: null } } as FormValues}
      onSubmit={() => undefined}
    >
      <>
        <UploadSection isSwarm={false} />
        <Probe />
      </>
    </Formik>
  ));
  return render(<Component />);
}

function chooseFile(name: string) {
  fireEvent.change(screen.getByLabelText('Upload'), {
    target: { files: [new File(['archive bytes'], name)] },
  });
}

it('previews override bytes and binds confirmation only to the selected archive', async () => {
  const inspect = vi.fn();
  server.use(
    http.post('/api/stacks/project/inspect', async ({ request }) => {
      inspect(await request.text());
      return HttpResponse.json(preview);
    })
  );
  renderUpload();
  chooseFile('project.zip');
  const confirmation = await screen.findByRole('checkbox');
  expect(screen.getByLabelText('Reviewed archive')).toBeEmptyDOMElement();
  expect(screen.getByText(preview.files['compose.yaml'])).toBeVisible();
  fireEvent.change(screen.getByLabelText('Review file content'), {
    target: { value: 'overrides/été.yaml' },
  });
  expect(screen.getByText(preview.files['overrides/été.yaml'])).toBeVisible();
  fireEvent.click(confirmation);
  await waitFor(() =>
    expect(screen.getByLabelText('Reviewed archive')).toHaveTextContent(
      preview.archiveDigest
    )
  );
  chooseFile('compose.yaml');
  await waitFor(() =>
    expect(screen.getByLabelText('Reviewed archive')).toBeEmptyDOMElement()
  );
  expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  expect(inspect).toHaveBeenCalledOnce();
});

it('ignores an archive preview that finishes after a different file was selected', async () => {
  let finish!: () => void;
  const requested = vi.fn();
  const pending = new Promise<void>((resolve) => {
    finish = resolve;
  });
  server.use(
    http.post('/api/stacks/project/inspect', async () => {
      requested();
      await pending;
      return HttpResponse.json(preview);
    })
  );
  renderUpload();
  chooseFile('previous.zip');
  await waitFor(() => expect(requested).toHaveBeenCalledOnce());
  chooseFile('compose.yaml');
  await act(async () => {
    finish();
    await pending;
  });
  await waitFor(() =>
    expect(
      screen.queryByText('Validating project archive…')
    ).not.toBeInTheDocument()
  );
  expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  expect(screen.getByLabelText('Reviewed archive')).toBeEmptyDOMElement();
});

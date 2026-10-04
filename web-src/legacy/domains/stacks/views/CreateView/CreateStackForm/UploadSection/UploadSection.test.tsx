import { act, render, screen } from '@testing-library/react';
import { Formik } from 'formik';

import { mockFormValues } from '../test-utils';

import { UploadSection } from './UploadSection';
import { UploadFormValues } from './types';

describe('UploadSection', () => {
  it('should render the upload section', async () => {
    await renderComponent();

    expect(screen.getByText('Upload')).toBeInTheDocument();
    expect(
      screen.getByText(/You can upload a Compose file from your computer/)
    ).toBeInTheDocument();
  });

  it('should render with uploaded file', async () => {
    const fileName = 'docker-compose.yml';
    const file = new File(['test content'], fileName, {
      type: 'text/yaml',
    });

    await renderComponent({ initialValues: { file } });

    expect(screen.getByText(fileName)).toBeInTheDocument();
  });
});

async function renderComponent({
  initialValues = {},
  isSwarm = false,
}: {
  initialValues?: Partial<UploadFormValues>;
  isSwarm?: boolean;
} = {}) {
  const values = mockFormValues({
    method: 'upload',
    upload: {
      file: null,
      ...initialValues,
    },
  });

  const result = render(
    <Formik initialValues={values} onSubmit={() => {}} validateOnMount>
      <UploadSection isSwarm={isSwarm} />
    </Formik>
  );
  await act(async () => {});
  return result;
}

'use client';

import { Laptop } from 'lucide-react';
import { Formik } from 'formik';
import {
  EdgeComputeIntroduction,
  EdgeSetupForm,
  useInitEdgeSetup,
  validationSchema,
} from '@console/console/pages/InitEdgePage';

import { Widget, WidgetBody, WidgetTitle } from '@@/Widget';

export default function Page() {
  const setup = useInitEdgeSetup();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="container">
        <div className="col-md-8 col-md-offset-2 col-sm-10 col-sm-offset-1">
          <Widget>
            <WidgetTitle icon={Laptop} title="Set up Edge Compute" />
            <WidgetBody loading={setup.isLoading}>
              <EdgeComputeIntroduction />
              <Formik
                initialValues={setup.initialValues}
                validationSchema={validationSchema}
                onSubmit={setup.handleSubmit}
                validateOnMount
                enableReinitialize
              >
                {(formik) => (
                  <EdgeSetupForm
                    formik={formik}
                    isSaving={setup.isSaving}
                    onSkip={setup.onSkip}
                  />
                )}
              </Formik>
            </WidgetBody>
          </Widget>
        </div>
      </div>
    </div>
  );
}

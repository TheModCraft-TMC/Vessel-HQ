'use client';

import { useState } from 'react';
import { Formik } from 'formik';

import { CreateUserAccessTokenInnerForm } from '@/domains/users/account/CreateAccessTokenView/CreateUserAccessTokenInnerForm';
import { getAPITokenValidationSchema } from '@/domains/users/account/CreateAccessTokenView/CreateUserAcccessToken.validation';
import { DisplayUserAccessToken } from '@/domains/users/account/CreateAccessTokenView/DisplayUserAccessToken';
import { ApiKeyFormValues } from '@/domains/users/account/CreateAccessTokenView/types';
import { useCreateUserAccessTokenMutation } from '@/domains/users/account/CreateAccessTokenView/useCreateUserAccessTokenMutation';
import { AuthenticationMethod, usePublicSettings } from '@/domains/settings';
import { useCurrentUser } from '@/react/hooks/useUser';

import { Widget } from '@@/Widget';

const INITIAL_VALUES: ApiKeyFormValues = { password: '', description: '' };

export function AccessTokenCreateContent() {
  const createToken = useCreateUserAccessTokenMutation();
  const { user } = useCurrentUser();
  const settings = usePublicSettings();
  const [token, setToken] = useState('');
  const requirePassword =
    settings.data?.AuthenticationMethod === AuthenticationMethod.Internal ||
    user.Id === 1;

  return (
    <div className="row">
        <div className="col-sm-12">
          <Widget>
            <Widget.Body>
              {token ? (
                <DisplayUserAccessToken apikey={token} />
              ) : (
                <Formik
                  initialValues={INITIAL_VALUES}
                  validationSchema={getAPITokenValidationSchema(
                    requirePassword
                  )}
                  onSubmit={(values) =>
                    createToken.mutate(
                      { values, userid: user.Id },
                      { onSuccess: setToken }
                    )
                  }
                >
                  <CreateUserAccessTokenInnerForm
                    showAuthentication={requirePassword}
                  />
                </Formik>
              )}
            </Widget.Body>
          </Widget>
        </div>
      </div>
  );
}

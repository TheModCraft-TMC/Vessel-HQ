'use client';

import { LoginHeading, LoginLogo } from '@console/console/auth/LoginBranding';
import { useLoginController } from '@console/console/auth/useLoginController';

import { LoginForm } from '@/domains/auth/components/LoginForm';

export default function LoginPage() {
  const {
    logo,
    formProps: {
      authenticationError,
      loginInProgress,
      oAuthLoginUri,
      oAuthProvider,
      password,
      showOAuthLogin,
      showPassword,
      showStandardLogin,
      username,
      onPasswordChange,
      onShowPasswordChange,
      onStandardLogin,
      onSubmit,
      onUsernameChange,
    },
  } = useLoginController();

  return (
    <div className="page-wrapper">
      <div className="simple-box container">
        <div className="col-sm-4 col-sm-offset-4">
          <div className="row">
            <LoginLogo logo={logo} />
          </div>
          <LoginHeading />
          <div className="panel panel-default">
            <div className="panel-body">
              <LoginForm
                authenticationError={authenticationError}
                loginInProgress={loginInProgress}
                oAuthLoginUri={oAuthLoginUri}
                oAuthProvider={oAuthProvider}
                password={password}
                showOAuthLogin={showOAuthLogin}
                showPassword={showPassword}
                showStandardLogin={showStandardLogin}
                username={username}
                onPasswordChange={onPasswordChange}
                onShowPasswordChange={onShowPasswordChange}
                onStandardLogin={onStandardLogin}
                onSubmit={onSubmit}
                onUsernameChange={onUsernameChange}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

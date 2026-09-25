import { Eye, EyeOff, LogIn } from 'lucide-react';
import type { FormEvent } from 'react';

import { Button, Input, LoadingButton } from '@/core/auth';

interface LoginFormProps {
  authenticationError: string;
  loginInProgress: boolean;
  oAuthLoginUri: string;
  oAuthProvider: string;
  password: string;
  showOAuthLogin: boolean;
  showPassword: boolean;
  showStandardLogin: boolean;
  username: string;
  onPasswordChange: (value: string) => void;
  onShowPasswordChange: () => void;
  onStandardLogin: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onUsernameChange: (value: string) => void;
}

export function LoginForm({
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
}: LoginFormProps) {
  return (
    <>
      <form className="simple-box-form form-horizontal" onSubmit={onSubmit}>
        {showOAuthLogin && (
          <div className="form-group">
            <div className="col-sm-12 flex justify-center">
              <a
                className="btn btn-primary btn-lg btn-block"
                href={oAuthLoginUri}
                data-cy="auth-oauth-login"
              >
                <LogIn className="mr-1 inline h-4 w-4" />
                Login with {oAuthProvider}
              </a>
            </div>
          </div>
        )}

        {showOAuthLogin && showStandardLogin && (
          <div className="form-group">
            <div className="col-sm-12 text-muted text-center">or</div>
          </div>
        )}

        {showOAuthLogin && !showStandardLogin && (
          <div className="form-group">
            <div className="col-sm-12">
              <Button
                className="btn-block"
                onClick={onStandardLogin}
                data-cy="auth-use-internal"
              >
                Use internal authentication
              </Button>
            </div>
          </div>
        )}

        {showStandardLogin && (
          <>
            <label className="block pb-2" htmlFor="username">
              Username
            </label>
            <Input
              id="username"
              value={username}
              onChange={(event) => onUsernameChange(event.target.value)}
              autoComplete="username"
              placeholder="Enter your username"
              data-cy="auth-usernameInput"
            />

            <label className="block pb-2 pt-4" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="pr-10"
                value={password}
                onChange={(event) => onPasswordChange(event.target.value)}
                autoComplete="current-password"
                placeholder="Enter your password"
                data-cy="auth-passwordInput"
              />
              <button
                type="button"
                onClick={onShowPasswordChange}
                className="absolute right-0 top-0 flex h-[34px] w-[50px] items-center justify-center border-none bg-transparent"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                data-cy="auth-passwordInputToggle"
              >
                {showPassword ? (
                  <Eye className="h-4 w-4" />
                ) : (
                  <EyeOff className="h-4 w-4" />
                )}
              </button>
            </div>

            <div className="form-group overflow-auto pt-4">
              <div className="col-sm-12 flex py-1">
                <LoadingButton
                  className="btn-block"
                  size="large"
                  isLoading={loginInProgress}
                  loadingText="Login in progress..."
                  data-cy="auth-loginButton"
                >
                  Login
                </LoadingButton>
              </div>
            </div>
          </>
        )}
      </form>

      {authenticationError && (
        <p className="text-danger text-right text-sm">{authenticationError}</p>
      )}
    </>
  );
}

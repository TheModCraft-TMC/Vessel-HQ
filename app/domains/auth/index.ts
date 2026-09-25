export { administratorExists } from './services/auth.service';
export {
  getAuthenticatedUser,
  getSessionUser,
  initializeAuthentication,
  isAdministrator,
  isAuthenticated,
  isEdgeAdministrator,
  login,
  loginWithOAuth,
  logout,
  restoreSession,
} from '@/core/session';
export { authStorage } from '@/core/session';
export { LoginRoute, LogoutRoute } from './routes';
export type {
  AuthenticatedPrincipal,
  Credentials,
  SessionResult,
} from './models';

import { lazyRoute } from '@/core/routing/lazyRoute';

export const LogoutRoute = lazyRoute(
  () => import('./views/LogoutView'),
  'LogoutView'
);
export const LoginRoute = lazyRoute(
  () => import('./views/LoginView'),
  'LoginView'
);

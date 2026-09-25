import { lazyRoute } from '@/core/routing';

export const LogoutRoute = lazyRoute(
  () => import('./views/LogoutView'),
  'LogoutView'
);
export const LoginRoute = lazyRoute(
  () => import('./views/LoginView'),
  'LoginView'
);

import { lazyRoute } from '@/core/routing/lazyRoute';

export const LogoutRoute = lazyRoute(
  () => import('./LogoutView'),
  'LogoutView'
);
export const LoginRoute = lazyRoute(() => import('./LoginView'), 'LoginView');

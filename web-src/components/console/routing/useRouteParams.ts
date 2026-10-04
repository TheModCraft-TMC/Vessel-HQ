'use client';

import {
  createContext,
  createElement,
  type PropsWithChildren,
  useContext,
} from 'react';
import { useParams, useSearchParams } from 'next/navigation';

export type RouteParams = Record<string, string>;
const RouteParamsContext = createContext<RouteParams>({});

export function RouteParamsProvider({
  children,
  params,
}: PropsWithChildren<{ params: RouteParams }>) {
  return createElement(
    RouteParamsContext.Provider,
    { value: params },
    children
  );
}

export function useRouteParams(): RouteParams {
  const pathParams = useParams<Record<string, string | string[]>>();
  const searchParams = useSearchParams();
  const matchedParams = useContext(RouteParamsContext);
  const params: RouteParams = {};

  searchParams.forEach((value, key) => {
    params[key] = value;
  });

  Object.entries(pathParams).forEach(([key, value]) => {
    params[key] = Array.isArray(value) ? value[0] : value;
  });

  Object.assign(params, matchedParams);

  return params;
}

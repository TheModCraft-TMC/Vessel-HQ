import { useState } from 'react';

// Verify on entry and fail closed on errors/revocation, while retaining the same
// verified snapshot during a background fetch. Refetching must not restart code.
export function useVerifiedExtensionData<T>(query: {
  data?: T;
  isFetching: boolean;
  isError: boolean;
}) {
  const current = query.isError ? undefined : query.data;
  const [verified, setVerified] = useState(() => ({
    data: query.isFetching ? undefined : current,
  }));
  // Adjust settled inputs before committing children, avoiding an extra effect
  // commit that could mount native code twice. Freshly cached data still waits.
  if ((!query.isFetching || query.isError) && verified.data !== current)
    setVerified({ data: current });
  return !query.isError && (!query.isFetching || query.data === verified.data)
    ? query.data
    : undefined;
}

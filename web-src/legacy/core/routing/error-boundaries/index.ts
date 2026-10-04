export function routeErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unable to load this route';
}

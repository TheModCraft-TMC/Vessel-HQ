export function normalizePodmanError(error: unknown, message: string) {
  return error instanceof Error ? error : new Error(message);
}

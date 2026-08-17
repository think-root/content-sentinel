/**
 * Surfaces what the API actually said instead of a blanket "failed to connect".
 * A rejected request and an unreachable service need different fixes, and the
 * generic wording hid a real 400 (an invalid language code) behind a connection
 * error for days.
 */
const apiErrorMessage = (error: unknown, service: string): string => {
  // A rejected fetch means the service could not be reached at all; its message
  // is a browser internal ("Failed to fetch") and says nothing a reader needs.
  if (error instanceof TypeError) {
    return `Failed to connect to ${service} API`;
  }

  const detail = error instanceof Error ? error.message.trim() : '';

  if (!detail) {
    return `Failed to connect to ${service} API`;
  }

  return `${service}: ${detail}`;
};

export const alchemistErrorMessage = (error: unknown): string =>
  apiErrorMessage(error, 'Content Alchemist');

export const maestroErrorMessage = (error: unknown): string =>
  apiErrorMessage(error, 'Content Maestro');

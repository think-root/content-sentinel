import type { ManualGenerateResponse } from '../api/alchemist';

/**
 * Maps each repository that was not added to the reason why: the per-repository
 * error details first, then the response-wide error message for any repository
 * still without one. `initial` carries reasons found before the request.
 */
export const buildGenerateErrorMessages = (
  response: ManualGenerateResponse,
  initial: Record<string, string> = {}
): Record<string, string> => {
  const map: Record<string, string> = { ...initial };

  if (response.error_details) {
    Object.entries(response.error_details).forEach(([repoUrl, detail]) => {
      map[repoUrl] = detail.message;
    });
  }

  if (response.error_message && response.error_message.trim() !== '') {
    (response.dont_added || []).forEach(repo => {
      if (!map[repo]) {
        map[repo] = response.error_message!;
      }
    });
  }

  return map;
};

// First path segments of github.com that can never be a repository owner
const RESERVED_GITHUB_PATHS = new Set([
  'orgs', 'settings', 'topics', 'sponsors', 'features', 'marketplace', 'apps',
  'collections', 'trending', 'explore', 'notifications', 'pulls', 'issues', 'search',
]);

// Converts any form of GitHub repository reference into the canonical
// https://github.com/<owner>/<repo> form, tolerating a missing scheme, "http://",
// a "www." host, tracking query parameters, a fragment, a ".git" suffix and deep
// paths such as "/tree/main/src". Returns null when the input is not a repository.
export const normalizeGithubRepoUrl = (input: string): string | null => {
  const trimmed = input.trim();
  if (!trimmed) return null;

  let parsed: URL;
  try {
    parsed = new URL(trimmed.includes('://') ? trimmed : `https://${trimmed}`);
  } catch {
    return null;
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null;

  const host = parsed.hostname.toLowerCase();
  if (host !== 'github.com' && host !== 'www.github.com') return null;

  const segments = parsed.pathname.split('/').filter(Boolean);
  if (segments.length < 2) return null;

  const owner = segments[0];
  const repo = segments[1].replace(/\.git$/, '');
  if (!owner || !repo || RESERVED_GITHUB_PATHS.has(owner.toLowerCase())) return null;

  return `https://github.com/${owner}/${repo}`;
};

/**
 * Splits whitespace-separated input into canonical repository URLs (deduplicated,
 * in input order) and the entries that are not repository references.
 */
export const parseRepositoryUrls = (input: string): { urls: string[]; invalid: string[] } => {
  const urls: string[] = [];
  const invalid: string[] = [];

  input.split(/\s+/).filter(u => u.trim()).forEach(entry => {
    const normalized = normalizeGithubRepoUrl(entry);
    if (!normalized) {
      invalid.push(entry);
    } else if (!urls.includes(normalized)) {
      urls.push(normalized);
    }
  });

  return { urls, invalid };
};

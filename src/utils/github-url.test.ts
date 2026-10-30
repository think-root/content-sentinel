import { describe, expect, it } from 'vitest';
import { normalizeGithubRepoUrl, parseRepositoryUrls } from './github-url';

describe('normalizeGithubRepoUrl', () => {
  it.each([
    ['https://github.com/owner/repo', 'https://github.com/owner/repo'],
    ['github.com/owner/repo', 'https://github.com/owner/repo'],
    ['http://www.github.com/owner/repo.git', 'https://github.com/owner/repo'],
    ['https://github.com/owner/repo/tree/main/src?tab=readme#top', 'https://github.com/owner/repo'],
    ['  https://GitHub.com/Owner/Repo  ', 'https://github.com/Owner/Repo'],
  ])('normalizes %s', (input, expected) => {
    expect(normalizeGithubRepoUrl(input)).toBe(expected);
  });

  it.each([
    '',
    'https://github.com/owner',
    'https://gitlab.com/owner/repo',
    'ftp://github.com/owner/repo',
    'https://github.com/orgs/acme',
    'https://github.com/trending/python',
    'not a url',
  ])('rejects %j', (input) => {
    expect(normalizeGithubRepoUrl(input)).toBeNull();
  });
});

describe('parseRepositoryUrls', () => {
  it('normalizes, deduplicates and keeps invalid entries apart', () => {
    expect(parseRepositoryUrls(' github.com/a/b\nhttps://github.com/a/b.git  nope https://github.com/c/d ')).toEqual({
      urls: ['https://github.com/a/b', 'https://github.com/c/d'],
      invalid: ['nope'],
    });
  });

  it('returns nothing for blank input', () => {
    expect(parseRepositoryUrls('   ')).toEqual({ urls: [], invalid: [] });
  });
});

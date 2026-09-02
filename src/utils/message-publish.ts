import type { ApiConfig } from '../api/api-configs';
import type { RetryMessageResult } from '../api/index';

export interface PublishIntegration {
  name: string;
  textLanguage?: string;
}

export type PublishRowState = 'pending' | 'success' | 'failure';

export interface PublishRow {
  name: string;
  state: PublishRowState;
  error?: string;
  textLanguage?: string;
}

export interface PublishSummary {
  tone: 'success' | 'partial' | 'error';
  text: string;
}

/**
 * The integrations a publish-now will reach, in the order Content Maestro reports
 * them (it sorts by name, because its own configuration is a map). Matching that
 * order keeps the list the dialog shows before the run identical to the list of
 * results it shows afterwards.
 */
export const enabledIntegrations = (configs: ApiConfig[]): PublishIntegration[] =>
  configs
    .filter(config => config.enabled)
    .map(config => ({ name: config.name, textLanguage: config.text_language }))
    .sort((a, b) => a.name.localeCompare(b.name));

/**
 * Merges what the dashboard expected with what the run reported.
 *
 * Content Maestro is authoritative: it resolves the enabled integrations at
 * request time, so a run can report an integration this dashboard's cached list
 * does not know about (enabled in another tab) and can omit one the cached list
 * still carries (disabled since). Rows are therefore built from both, and an
 * expected integration with no reported outcome is a failure rather than a
 * silent success.
 */
export const buildPublishRows = (
  expected: PublishIntegration[],
  result?: RetryMessageResult | null
): PublishRow[] => {
  const languages = new Map(expected.map(integration => [integration.name, integration.textLanguage]));

  if (!result) {
    return expected.map(integration => ({
      name: integration.name,
      state: 'pending',
      textLanguage: integration.textLanguage,
    }));
  }

  const rows = new Map<string, PublishRow>();

  const record = (name: string, state: PublishRowState, error?: string) => {
    rows.set(name, { name, state, error, textLanguage: languages.get(name) });
  };

  const outcomes = result.outcomes ?? [];
  if (outcomes.length > 0) {
    for (const outcome of outcomes) {
      if (outcome.success) {
        record(outcome.api_name, 'success');
      } else {
        record(outcome.api_name, 'failure', outcome.error?.trim() || 'unknown error');
      }
    }
  } else {
    // Go marshals empty slices as null, so a run can come back with the name
    // lists filled in and no outcomes at all.
    for (const name of result.succeeded ?? []) {
      record(name, 'success');
    }
    for (const name of result.failed ?? []) {
      record(name, 'failure', 'unknown error');
    }
  }

  for (const integration of expected) {
    if (!rows.has(integration.name)) {
      record(integration.name, 'failure', 'no result reported');
    }
  }

  // Expected integrations first, in their own order; anything the run added on
  // top of them goes after, so the list the user was looking at does not jump.
  const ordered = expected
    .map(integration => rows.get(integration.name))
    .filter((row): row is PublishRow => row !== undefined);
  const extras = [...rows.values()].filter(row => !languages.has(row.name));

  return [...ordered, ...extras];
};

/** Wording and tone of the banner above the result rows. */
export const summarizePublishResult = (result: RetryMessageResult): PublishSummary => {
  const succeeded = result.succeeded ?? [];
  const failed = result.failed ?? [];

  if (succeeded.length === 0) {
    return {
      tone: 'error',
      text: 'Not published: no integration accepted the post. The repository stays in the queue.',
    };
  }

  if (failed.length > 0) {
    return {
      tone: 'partial',
      text: `Published to ${succeeded.length} of ${succeeded.length + failed.length} integrations. `
        + 'The repository left the queue, so finish the rest with "Publish again" in Cron History.',
    };
  }

  return {
    tone: 'success',
    text: `Published to ${succeeded.length === 1 ? 'the integration' : `all ${succeeded.length} integrations`}.`,
  };
};

/** True when at least one integration accepted the post, so the parent must refresh. */
export const publishedSomething = (result?: RetryMessageResult | null): boolean =>
  (result?.succeeded ?? []).length > 0;

import { API_BASE, apiFetch } from "./client";
import { queueRequest, createRequestSignature } from "../lib/requestQueue";

export interface CronJob {
  name: string;
  schedule: string;
  is_active: boolean;
  updated_at: string;
}

export interface MessageRunDetails {
  url?: string;
  sent?: string[];
  failed?: string[];
  manual?: boolean;
}

export interface CronJobHistory {
  name: string;
  timestamp: string;
  status: number;
  output?: string;
  /** Only present on message runs recorded after the details column was added. */
  details?: MessageRunDetails;
}

export interface RetryMessageOutcome {
  api_name: string;
  success: boolean;
  error?: string;
}

export interface RetryMessageResult {
  url: string;
  status: number;
  message: string;
  succeeded?: string[] | null;
  failed?: string[] | null;
  outcomes?: RetryMessageOutcome[] | null;
  /** Whether the repository was marked as published and left the queue. */
  posted?: boolean;
  /**
   * Present only when that marking failed: the post went out but the repository
   * stayed in the queue, so the scheduled run will publish it again.
   */
  posted_error?: string;
}

export interface CronJobHistoryResponse {
  data: CronJobHistory[];
  pagination: {
    total_count: number;
    current_page: number;
    total_pages: number;
    has_next: boolean;
    has_previous: boolean;
  };
}

export const getCronJobs = async (): Promise<CronJob[]> => {
  const response = await apiFetch(`${API_BASE.maestro}/crons`);

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error("Rate limit exceeded. Please try again later.");
    }
    throw new Error(`Failed to fetch cron jobs: ${response.status}`);
  }

  return response.json();
};

export const getCronJobHistory = async (
  name?: string,
  page: number = 1,
  limit: number = 20,
  status?: number,
  sort: "asc" | "desc" = "desc",
  start_date?: string,
  end_date?: string
): Promise<CronJobHistoryResponse> => {
  const params = new URLSearchParams();
  if (name) params.append("name", name);
  params.append("page", page.toString());
  params.append("limit", limit.toString());
  params.append("sort", sort);
  if (status !== undefined) params.append("status", status.toString());
  if (start_date && start_date.trim() !== '') params.append("start_date", start_date);
  if (end_date && end_date.trim() !== '') params.append("end_date", end_date);

  const response = await apiFetch(
    `${API_BASE.maestro}/cron-history?${params.toString()}`
  );

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error("Rate limit exceeded. Please try again later.");
    }
    throw new Error(`Failed to fetch cron job history: ${response.status}`);
  }

  const data = await response.json();

  // Validate the response structure
  if (!data || !Array.isArray(data.data) || !data.pagination) {
    return {
      data: [],
      pagination: {
        total_count: 0,
        current_page: 1,
        total_pages: 0,
        has_next: false,
        has_previous: false,
      },
    };
  }

  return data;
};

export const updateCronSchedule = async (name: string, schedule: string): Promise<void> => {
  const response = await apiFetch(`${API_BASE.maestro}/crons/${name}/schedule`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ schedule }),
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error("Rate limit exceeded. Please try again later.");
    }
    throw new Error(`Failed to update cron schedule: ${response.status}`);
  }
};

/**
 * Re-sends a repository to the integrations that missed it. Omitting `url` lets
 * Content Maestro fall back to the most recently published repository, which is
 * what a partial run has just consumed.
 */
export const retryMessagePost = async (
  apis: string[],
  url?: string
): Promise<RetryMessageResult> => {
  const response = await apiFetch(`${API_BASE.maestro}/message/retry`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(url ? { apis, url } : { apis }),
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error("Rate limit exceeded. Please try again later.");
    }
    // Content Maestro answers errors as plain text.
    const detail = (await response.text()).trim();
    throw new Error(detail || `Failed to retry the publication: ${response.status}`);
  }

  return response.json();
};

/**
 * Publishes a repository immediately to every enabled integration, instead of
 * waiting for its turn in the publication queue. Content Maestro resolves the
 * integrations itself: the dashboard's cached list must not decide what is sent.
 *
 * The request is synchronous and can take minutes - the Threads connector alone
 * is configured with a 90 s timeout - so callers pass a signal and must treat an
 * abort as "may still be running", not as "did not publish".
 */
export const publishMessageNow = async (
  url: string,
  options?: { signal?: AbortSignal }
): Promise<RetryMessageResult> => {
  const response = await apiFetch(`${API_BASE.maestro}/message/publish`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url }),
    signal: options?.signal,
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error("Rate limit exceeded. Please try again later.");
    }
    // Content Maestro answers errors as plain text.
    const detail = (await response.text()).trim();
    throw new Error(detail || `Failed to publish the repository: ${response.status}`);
  }

  return response.json();
};

export const updateCronStatus = async (name: string, is_active: boolean): Promise<void> => {
  const response = await apiFetch(`${API_BASE.maestro}/crons/${name}/status`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ is_active }),
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error("Rate limit exceeded. Please try again later.");
    }
    throw new Error(`Failed to update cron status: ${response.status}`);
  }
};

export interface CollectSettings {
  max_repos: number;
  resource: string;
  since: string;
  spoken_language_code: string;
  period: string;
  language: string;
}

export async function getCollectSettings(): Promise<CollectSettings> {
  const response = await apiFetch(`${API_BASE.maestro}/collect-settings`, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch collect settings`);
  }

  const data = await response.json();
  return data;
}

export async function updateCollectSettings(
  settings: CollectSettings
): Promise<{ status: string; message: string }> {
  const response = await apiFetch(
    `${API_BASE.maestro}/collect-settings`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(settings),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to update collect settings`);
  }

  return response.json();
}

export interface PromptSettings {
  use_direct_url: boolean;
  llm_provider: string;
  model: string;
  temperature: number;
  content: string;
  llm_output_language?: string;
  updated_at?: string;
}

export async function getPromptSettings(): Promise<PromptSettings> {
  const url = `${API_BASE.maestro}/prompt-settings`;
  const headers = {
    "Content-Type": "application/json",
  };

  // Wrap the actual fetch logic in a function
  const fetchFunction = async () => {
    const response = await apiFetch(url, {
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch prompt settings`);
    }

    const data = await response.json();
    return data;
  };

  // Create a unique request signature and queue the request
  return createRequestSignature(url, "GET").then(signature => queueRequest(fetchFunction, signature));
}

export async function updatePromptSettings(
  settings: Partial<PromptSettings>
): Promise<{ status: string; message: string }> {
  const response = await apiFetch(
    `${API_BASE.maestro}/prompt-settings`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(settings),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to update prompt settings`);
  }

  return response.json();
}

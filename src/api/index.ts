import { getApiSettings, isApiConfigured } from "../utils/api-settings";

export interface CronJob {
  name: string;
  schedule: string;
  is_active: boolean;
  updated_at: string;
}

export interface CronJobHistory {
  name: string;
  timestamp: string;
  success: boolean;
  error: string;
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
  const settings = getApiSettings();
  const isConfigured = isApiConfigured();

  if (!isConfigured) {
    return [];
  }

  const response = await fetch(`${settings.contentMaestro.apiBaseUrl}/api/crons`, {
    headers: {
      Authorization: `Bearer ${settings.contentMaestro.apiBearerToken}`,
    },
  });

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
  success?: boolean,
  sort: "asc" | "desc" = "desc",
  start_date?: string,
  end_date?: string
): Promise<CronJobHistoryResponse> => {
  const settings = getApiSettings();
  const isConfigured = isApiConfigured();

  if (!isConfigured) {
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

  const params = new URLSearchParams();
  if (name) params.append("name", name);
  params.append("page", page.toString());
  params.append("limit", limit.toString());
  params.append("sort", sort);
  if (success !== undefined) params.append("success", success.toString());
  if (start_date) params.append("start_date", start_date);
  if (end_date) params.append("end_date", end_date);

  const response = await fetch(
    `${settings.contentMaestro.apiBaseUrl}/api/cron-history?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${settings.contentMaestro.apiBearerToken}`,
      },
    }
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
  const settings = getApiSettings();
  const isConfigured = isApiConfigured();

  if (!isConfigured) {
    return;
  }

  const response = await fetch(`${settings.contentMaestro.apiBaseUrl}/api/crons/${name}/schedule`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${settings.contentMaestro.apiBearerToken}`,
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

export const updateCronStatus = async (name: string, is_active: boolean): Promise<void> => {
  const settings = getApiSettings();
  const isConfigured = isApiConfigured();

  if (!isConfigured) {
    return;
  }

  const response = await fetch(`${settings.contentMaestro.apiBaseUrl}/api/crons/${name}/status`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${settings.contentMaestro.apiBearerToken}`,
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

import { Repository } from './types';
import { getApiSettings } from "./utils/api-settings";

function getApiConfig() {
  const settings = getApiSettings();
  return {
    baseUrl: `${settings.contentAlchemist.apiBaseUrl}/api`,
    headers: {
      Authorization: `Bearer ${settings.contentAlchemist.apiBearerToken}`,
      "Content-Type": "application/json",
    },
  };
}

interface GetRepositoryRequest {
  limit: number;
  posted?: boolean;
  sort_by?: "id" | "date_added" | "date_posted";
  sort_order?: "ASC" | "DESC";
  page?: number;
  page_size?: number;
}

interface RepositoryResponse {
  status: string;
  data: {
    all: number;
    posted: number;
    unposted: number;
    items: Repository[];
    page: number;
    page_size: number;
    total_pages: number;
    total_items: number;
  };
}

export async function getRepositories(
  limit: number = 0,
  posted?: boolean,
  fetchAll: boolean = false,
  sortBy?: "id" | "date_added" | "date_posted",
  sortOrder?: "ASC" | "DESC",
  page?: number,
  pageSize?: number
): Promise<RepositoryResponse> {
  const { baseUrl, headers } = getApiConfig();

  const requestBody: GetRepositoryRequest = {
    limit: fetchAll ? 0 : pageSize || limit,
    posted,
    sort_by: sortBy,
    sort_order: sortOrder,
    page,
    page_size: pageSize,
  };

  const response = await fetch(`${baseUrl}/get-repository/`, {
    method: "POST",
    headers,
    body: JSON.stringify(requestBody),
  });

  return response.json();
}

export interface ManualGenerateResponse {
  status: string;
  added?: string[];
  dont_added?: string[];
}

export async function manualGenerate(url: string): Promise<ManualGenerateResponse> {
  const { baseUrl, headers } = getApiConfig();
  const response = await fetch(`${baseUrl}/manual-generate/`, {
    method: "POST",
    headers,
    body: JSON.stringify({ url }),
  });

  return response.json();
}

export async function autoGenerate(maxRepos: number, since: string, spokenLanguageCode: string) {
  const { baseUrl, headers } = getApiConfig();
  const response = await fetch(`${baseUrl}/auto-generate/`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      max_repos: maxRepos,
      since,
      spoken_language_code: spokenLanguageCode,
    }),
  });

  return response.json();
}

export async function getLatestPostedRepository(): Promise<RepositoryResponse> {
  const { baseUrl, headers } = getApiConfig();
  const response = await fetch(`${baseUrl}/get-repository/`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      limit: 1,
      posted: true,
      sort_by: "date_posted",
      sort_order: "DESC",
    }),
  });

  return response.json();
}

export async function getNextRepository(): Promise<RepositoryResponse> {
  const { baseUrl, headers } = getApiConfig();
  const response = await fetch(`${baseUrl}/get-repository/`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      limit: 1,
      posted: false,
      sort_by: "date_added",
      sort_order: "ASC",
    }),
  });

  return response.json();
}

export interface CollectSettings {
  max_repos: number;
  since: string;
  spoken_language_code: string;
}

export async function getCollectSettings(): Promise<CollectSettings> {
  const settings = getApiSettings();
  const response = await fetch(`${settings.contentMaestro.apiBaseUrl}/api/collect-settings`, {
    headers: {
      Authorization: `Bearer ${settings.contentMaestro.apiBearerToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch collect settings: ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}

export async function updateCollectSettings(settings: CollectSettings): Promise<{ status: string; message: string }> {
  const apiSettings = getApiSettings();
  const response = await fetch(`${apiSettings.contentMaestro.apiBaseUrl}/api/collect-settings/update`, {
    method: 'PUT',
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiSettings.contentMaestro.apiBearerToken}`,
    },
    body: JSON.stringify(settings),
  });

  if (!response.ok) {
    throw new Error(`Failed to update collect settings: ${response.statusText}`);
  }

  return response.json();
}



import { Repository } from './types';
import { getApiSettings } from "./utils/api-settings";

function getApiConfig() {
  const settings = getApiSettings();
  return {
    baseUrl: `${settings.apiBaseUrl}/api`,
    headers: {
      Authorization: `Bearer ${settings.apiBearerToken}`,
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
    limit: fetchAll ? 0 : limit,
    posted,
    sort_by: sortBy,
    sort_order: sortOrder,
  };

  if (!fetchAll && (page !== undefined || pageSize !== undefined)) {
    requestBody.page = page;
    requestBody.page_size = pageSize;
  }

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



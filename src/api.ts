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

interface RepositoryResponse {
  status: string;
  data: {
    all: number;
    posted: number;
    unposted: number;
    items: Repository[];
  };
}

export async function getRepositories(
  limit: number,
  posted?: boolean,
  fetchAll: boolean = false,
  sortBy?: "id" | "date_added" | "date_posted",
  sortOrder?: "ASC" | "DESC"
): Promise<RepositoryResponse> {
  const { baseUrl, headers } = getApiConfig();

  if (posted === undefined) {
    const actualLimit = fetchAll ? 5000 : limit;
    const halfLimit = Math.ceil(actualLimit / 2);

    const [postedResponse, unpostedResponse] = await Promise.all([
      fetch(`${baseUrl}/get-repository/`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          limit: halfLimit,
          posted: true,
          sort_by: sortBy || "date_posted",
          sort_order: sortOrder || "DESC",
        }),
      }),
      fetch(`${baseUrl}/get-repository/`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          limit: halfLimit,
          posted: false,
          sort_by: sortBy || "date_added",
          sort_order: sortOrder || "DESC",
        }),
      }),
    ]);

    const [postedData, unpostedData] = await Promise.all([
      postedResponse.json(),
      unpostedResponse.json(),
    ]);

    return {
      status: "ok",
      data: {
        all: postedData.data.posted + unpostedData.data.unposted,
        posted: postedData.data.posted,
        unposted: unpostedData.data.unposted,
        items: [...postedData.data.items, ...unpostedData.data.items],
      },
    };
  }

  const response = await fetch(`${baseUrl}/get-repository/`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      limit,
      posted,
      sort_by: sortBy,
      sort_order: sortOrder,
    }),
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



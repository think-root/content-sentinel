import { Repository } from './types';

const API_BASE_URL = `${import.meta.env.API_BASE_URL}/api`;
const API_BEARER_TOKEN = import.meta.env.API_BEARER_TOKEN || '';

const headers = {
  'Authorization': `Bearer ${API_BEARER_TOKEN}`,
  'Content-Type': 'application/json',
};

interface RepositoryResponse {
  status: string;
  data: {
    all: number;
    posted: number;
    unposted: number;
    items: Repository[];
  }
}

export async function getRepositories(
  limit: number, 
  posted?: boolean, 
  fetchAll: boolean = false,
  sortBy?: 'id' | 'date_added' | 'date_posted',
  sortOrder?: 'ASC' | 'DESC'
): Promise<RepositoryResponse> {
  if (posted === undefined) {
    const actualLimit = fetchAll ? 5000 : limit;
    const halfLimit = Math.ceil(actualLimit / 2);
    
    const [postedResponse, unpostedResponse] = await Promise.all([
      fetch(`${API_BASE_URL}/get-repository/`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          limit: halfLimit, 
          posted: true,
          sort_by: sortBy || 'date_posted',
          sort_order: sortOrder || 'DESC'
        }),
      }),
      fetch(`${API_BASE_URL}/get-repository/`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          limit: halfLimit, 
          posted: false,
          sort_by: sortBy || 'date_added',
          sort_order: sortOrder || 'DESC'
        }),
      })
    ]);

    const postedData = await postedResponse.json();
    const unpostedData = await unpostedResponse.json();

    const totalCount = postedData.data.posted + unpostedData.data.unposted;
    
    return {
      status: 'ok',
      data: {
        all: totalCount,
        posted: postedData.data.posted,
        unposted: unpostedData.data.unposted,
        items: [...postedData.data.items, ...unpostedData.data.items]
      }
    };
  }

  const response = await fetch(`${API_BASE_URL}/get-repository/`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ 
      limit: fetchAll ? 5000 : limit, 
      posted,
      sort_by: sortBy || (posted ? 'date_posted' : 'date_added'),
      sort_order: sortOrder || 'DESC'
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
  const response = await fetch(`${API_BASE_URL}/manual-generate/`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ url }),
  });
  return response.json();
}

export async function autoGenerate(maxRepos: number, since: string, spokenLanguageCode: string) {
  const response = await fetch(`${API_BASE_URL}/auto-generate/`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ max_repos: maxRepos, since, spoken_language_code: spokenLanguageCode }),
  });
  return response.json();
}

export async function getLatestPostedRepository(): Promise<RepositoryResponse> {
  const response = await fetch(`${API_BASE_URL}/get-repository/`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      limit: 1,
      posted: true,
      sort_order: 'DESC',
      sort_by: 'date_posted'
    }),
  });
  return response.json();
}

export async function getNextRepository(): Promise<RepositoryResponse> {
  const response = await fetch(`${API_BASE_URL}/get-repository/`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      limit: 1,
      posted: false,
      sort_order: 'DESC',
      sort_by: 'date_added'
    }),
  });
  return response.json();
}



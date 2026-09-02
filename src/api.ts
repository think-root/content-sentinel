import type { Repository, RepositorySortBy, RepositorySortOrder } from './types';
import type {
  ArchiveOldRepositoriesResponse,
  ArchiveRepositoryResponse,
  GetArchivedRepositoriesRequest,
  GetArchivedRepositoriesResponse,
} from './types/archive';
import { ARCHIVE_MAX_IDENTIFIERS } from "./utils/archiveUtils";
import { getApiSettings, isApiConfigured } from "./utils/api-settings";
import { queueRequest, createRequestSignature } from "./lib/requestQueue";

// Cache for available languages to avoid repeated API calls
let availableLanguagesCache: string[] | null = null;
let languagesCacheExpiry: number = 0;
const LANGUAGES_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Helper function to get available languages from the backend
async function getAvailableLanguages(): Promise<string[]> {
  const now = Date.now();
  
  // Return cached data if still valid
  if (availableLanguagesCache && now < languagesCacheExpiry) {
    return availableLanguagesCache;
  }

  const { baseUrl, headers, isConfigured } = getApiConfig();
  
  if (!isConfigured) {
    return ['uk']; // Default fallback
  }

  try {
    const response = await fetch(`${baseUrl}/get-available-languages/`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      console.warn('Failed to fetch available languages, using default');
      return ['uk'];
    }

    const data = await response.json();
    const languages = data.languages || ['uk']; // Default to uk if no languages returned
    
    // Cache the result
    availableLanguagesCache = languages;
    languagesCacheExpiry = now + LANGUAGES_CACHE_DURATION;
    
    return languages;
  } catch (error) {
    console.warn('Error fetching available languages:', error);
    return ['uk']; // Default fallback
  }
}

// Helper function to handle language fallback
async function handleLanguageFallback<T>(
  originalRequest: () => Promise<T>,
  requestedLanguage: string,
  createFallbackRequest?: (language: string) => Promise<T>
): Promise<T> {
  try {
    return await originalRequest();
  } catch (error) {
    // Check if it's the specific "no text available for language" error
    if (error instanceof Error && error.message.includes('no text available for language')) {
      console.warn(`[Language Fallback] Language "${requestedLanguage}" not available, trying fallback...`);
      
      // Get available languages and try with the first one
      const availableLanguages = await getAvailableLanguages();
      const fallbackLanguage = availableLanguages[0] || 'uk';
      
      console.log(`[Language Fallback] Available languages: [${availableLanguages.join(', ')}]`);
      
      if (fallbackLanguage !== requestedLanguage) {
        console.log(`[Language Fallback] Using fallback language: "${fallbackLanguage}" instead of "${requestedLanguage}"`);
        
        if (createFallbackRequest) {
          try {
            const result = await createFallbackRequest(fallbackLanguage);
            console.log(`[Language Fallback] Successfully retrieved data using fallback language "${fallbackLanguage}"`);
            return result;
          } catch (fallbackError) {
            console.error(`[Language Fallback] Fallback also failed with language "${fallbackLanguage}":`, fallbackError);
            throw fallbackError;
          }
        } else {
          // Fallback to default behavior if no fallback request function provided
          console.warn(`[Language Fallback] No fallback request function provided, returning empty result`);
          return {
            status: "success",
            data: {
              all: 0,
              posted: 0,
              unposted: 0,
              items: [],
              page: 1,
              page_size: 10,
              total_pages: 0,
              total_items: 0,
            }
          } as T;
        }
      } else {
        console.warn(`[Language Fallback] No fallback available, same language "${requestedLanguage}" returned`);
      }
    }
    
    // If it's not the language error or fallback failed, re-throw the original error
    console.error(`[Language Fallback] Error not related to language availability:`, error);
    throw error;
  }
}

function getApiConfig() {
  const settings = getApiSettings();
  return {
    baseUrl: `${settings.contentAlchemist.apiBaseUrl}/api`,
    headers: {
      Authorization: `Bearer ${settings.contentAlchemist.apiBearerToken}`,
      "Content-Type": "application/json",
    },
    isConfigured: isApiConfigured()
  };
}

interface GetRepositoryRequest {
  limit: number;
  posted?: boolean;
  sort_by?: RepositorySortBy;
  sort_order?: RepositorySortOrder;
  page?: number;
  page_size?: number;
  text_language?: string;
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
  sortBy?: RepositorySortBy,
  sortOrder?: RepositorySortOrder,
  page?: number,
  pageSize?: number
): Promise<RepositoryResponse> {
  const { baseUrl, headers, isConfigured } = getApiConfig();
  const settings = getApiSettings();
  const textLanguage = settings.displayLanguage || 'uk';

  if (!isConfigured) {
    return {
      status: "error",
      data: {
        all: 0,
        posted: 0,
        unposted: 0,
        items: [],
        page: 1,
        page_size: 10,
        total_pages: 0,
        total_items: 0,
      },
    };
  }

  const createRequest = (language: string) => {
    const requestBody: GetRepositoryRequest = {
      limit: fetchAll || pageSize === 0 ? 0 : pageSize || limit,
      posted,
      sort_by: sortBy,
      sort_order: sortOrder,
      page,
      page_size: pageSize,
      text_language: language,
    };


    // Wrap the actual fetch logic in a function
    const fetchFunction = async () => {

      const response = await fetch(`${baseUrl}/get-repository/`, {
        method: "POST",
        headers,
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();
      
      // Check for language error in the response first
      if (result.status === "error" && result.message && result.message.includes('no text available for language')) {
        throw new Error(result.message);
      }

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error("Rate limit exceeded. Please try again later.");
        }
        throw new Error(`API request failed with status: ${response.status}`);
      }
      
      return result;
    };

    // Create a unique request signature and queue the request
    return createRequestSignature(
      `${baseUrl}/get-repository/`,
      "POST",
      requestBody
    ).then(signature => queueRequest(fetchFunction, signature));
  };

  // Use fallback logic with a function that can create requests with different languages
  return handleLanguageFallback(() => createRequest(textLanguage), textLanguage, createRequest);
}

/**
 * Fetches a single repository by url, bypassing both the request queue and the
 * display-language filter.
 *
 * It exists for reconciliation: after a publication whose answer was lost, the
 * posted flag is the only record that says whether the post went out, and it has
 * to be readable even for an item that has no text in the display language.
 */
export async function getRepositoryByUrl(url: string): Promise<Repository | null> {
  const { baseUrl, headers, isConfigured } = getApiConfig();

  if (!isConfigured) {
    throw new Error("API not configured. Check the Content Alchemist settings.");
  }

  const response = await fetch(`${baseUrl}/get-repository/`, {
    method: "POST",
    headers,
    body: JSON.stringify({ url, limit: 1 }),
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error("Rate limit exceeded. Please try again later.");
    }
    throw new Error(`Failed to fetch the repository: ${response.status}`);
  }

  const result = await response.json();
  const items: Repository[] = result?.data?.items ?? [];
  const item = items[0];

  if (!item) {
    return null;
  }

  // An older Content Alchemist ignores the url filter and answers with the head
  // of the queue instead; reporting that item's posted state as this one's would
  // be worse than reporting nothing.
  if (item.url !== url) {
    throw new Error("Content Alchemist ignored the url filter");
  }

  return item;
}

export interface ManualGenerateResponse {
  status: string;
  added?: string[];
  dont_added?: string[];
  error_message?: string;
  error_details?: Record<string, { type: string; message: string }>;
}

export async function manualGenerate(url: string): Promise<ManualGenerateResponse> {
  const { baseUrl, headers, isConfigured } = getApiConfig();

  if (!isConfigured) {
    return {
      status: "error",
      added: [],
      dont_added: [],
    };
  }

  const promptSettings = await getPromptSettings();

  const requestBody = {
    url,
    use_direct_url: promptSettings.use_direct_url,
    llm_provider: promptSettings.llm_provider,
    llm_output_language: promptSettings.llm_output_language,
    llm_config: {
      model: promptSettings.model,
      temperature: promptSettings.temperature,
      messages: [
        {
          role: "system",
          content: promptSettings.content,
        },
      ],
    },
  };

  // Wrap the actual fetch logic in a function
  const fetchFunction = async () => {
    const response = await fetch(`${baseUrl}/manual-generate/`, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error("Rate limit exceeded. Please try again later.");
      }
      throw new Error(`API request failed with status: ${response.status}`);
    }

    return response.json();
  };

  // Create a unique request signature and queue the request
  return createRequestSignature(
    `${baseUrl}/manual-generate/`,
    "POST",
    requestBody
  ).then(signature => queueRequest(fetchFunction, signature));
}

export async function autoGenerate(
  maxRepos: number,
  resource: string,
  since: string,
  spokenLanguageCode: string,
  period: string,
  language: string
): Promise<ManualGenerateResponse> {
  const { baseUrl, headers, isConfigured } = getApiConfig();

  if (!isConfigured) {
    return {
      status: "error",
      added: [],
      dont_added: [],
    };
  }

  const promptSettings = await getPromptSettings();

  const requestBody = {
    max_repos: maxRepos,
    resource,
    since,
    spoken_language_code: spokenLanguageCode,
    period,
    language,
    use_direct_url: promptSettings.use_direct_url,
    llm_provider: promptSettings.llm_provider,
    llm_output_language: promptSettings.llm_output_language,
    llm_config: {
      model: promptSettings.model,
      temperature: promptSettings.temperature,
      messages: [
        {
          role: "system",
          content: promptSettings.content,
        },
      ],
    },
  };

  // Wrap the actual fetch logic in a function
  const fetchFunction = async () => {
    const response = await fetch(`${baseUrl}/auto-generate/`, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error("Rate limit exceeded. Please try again later.");
      }
      throw new Error(`API request failed with status: ${response.status}`);
    }

    return response.json();
  };

  // Create a unique request signature and queue the request
  return createRequestSignature(
    `${baseUrl}/auto-generate/`,
    "POST",
    requestBody
  ).then(signature => queueRequest(fetchFunction, signature));
}

export async function getLatestPostedRepository(): Promise<RepositoryResponse> {
  const { baseUrl, headers, isConfigured } = getApiConfig();
  const settings = getApiSettings();
  const textLanguage = settings.displayLanguage || 'uk';

  if (!isConfigured) {
    return {
      status: "error",
      data: {
        all: 0,
        posted: 0,
        unposted: 0,
        items: [],
        page: 1,
        page_size: 10,
        total_pages: 0,
        total_items: 0,
      },
    };
  }

  const createRequest = (language: string) => {
    const requestBody = {
      limit: 1,
      posted: true,
      sort_by: "date_posted",
      sort_order: "DESC", // Show newest first
      text_language: language,
    };

    // Wrap the actual fetch logic in a function
    const fetchFunction = async () => {
      const response = await fetch(`${baseUrl}/get-repository/`, {
        method: "POST",
        headers,
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();
      
      // Check for language error in the response first
      if (result.status === "error" && result.message && result.message.includes('no text available for language')) {
        throw new Error(result.message);
      }

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error("Rate limit exceeded. Please try again later.");
        }
        throw new Error(`API request failed with status: ${response.status}`);
      }
      
      return result;
    };

    // Create a unique request signature and queue the request
    return createRequestSignature(
      `${baseUrl}/get-repository/`,
      "POST",
      requestBody
    ).then(signature => queueRequest(fetchFunction, signature));
  };

  // Use fallback logic
  return handleLanguageFallback(() => createRequest(textLanguage), textLanguage, createRequest);
}

export async function getNextRepository(): Promise<RepositoryResponse> {
  const { baseUrl, headers, isConfigured } = getApiConfig();
  const settings = getApiSettings();
  const textLanguage = settings.displayLanguage || 'uk';

  if (!isConfigured) {
    return {
      status: "error",
      data: {
        all: 0,
        posted: 0,
        unposted: 0,
        items: [],
        page: 1,
        page_size: 10,
        total_pages: 0,
        total_items: 0,
      },
    };
  }

  const createRequest = (language: string) => {
    const requestBody = {
      limit: 1,
      posted: false,
      sort_by: "publication_queue",
      sort_order: "ASC", // Show promoted items first, then oldest unposted
      text_language: language,
    };

    // Wrap the actual fetch logic in a function
    const fetchFunction = async () => {
      const response = await fetch(`${baseUrl}/get-repository/`, {
        method: "POST",
        headers,
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();
      
      // Check for language error in the response first
      if (result.status === "error" && result.message && result.message.includes('no text available for language')) {
        throw new Error(result.message);
      }

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error("Rate limit exceeded. Please try again later.");
        }
        throw new Error(`API request failed with status: ${response.status}`);
      }
      
      return result;
    };

    // Create a unique request signature and queue the request
    return createRequestSignature(
      `${baseUrl}/get-repository/`,
      "POST",
      requestBody
    ).then(signature => queueRequest(fetchFunction, signature));
  };

  // Use fallback logic
  return handleLanguageFallback(() => createRequest(textLanguage), textLanguage, createRequest);
}

export interface CollectSettings {
  max_repos: number;
  resource: string;
  since: string;
  spoken_language_code: string;
  period: string;
  language: string;
}

export async function getCollectSettings(): Promise<CollectSettings> {
  const settings = getApiSettings();
  const isConfigured = isApiConfigured();

  if (!isConfigured) {
    return {
      max_repos: 10,
      resource: "github",
      since: "daily",
      spoken_language_code: "en",
      period: "past_24_hours",
      language: "All",
    };
  }

  const response = await fetch(`${settings.contentMaestro.apiBaseUrl}/api/collect-settings`, {
    headers: {
      Authorization: `Bearer ${settings.contentMaestro.apiBearerToken}`,
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
  const apiSettings = getApiSettings();
  const isConfigured = isApiConfigured();

  if (!isConfigured) {
    return {
      status: "error",
      message: "API not configured",
    };
  }

  const response = await fetch(
    `${apiSettings.contentMaestro.apiBaseUrl}/api/collect-settings`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiSettings.contentMaestro.apiBearerToken}`,
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
  const settings = getApiSettings();
  const isConfigured = isApiConfigured();

  if (!isConfigured) {
    return {
      use_direct_url: true,
      llm_provider: "openai",
      model: "gpt-4.1",
      temperature: 0.5,
      content:
        "You are an AI assistant specializing in the creation of short descriptions of GitHub repositories. Your main task is to create descriptions based on the URL.",
      llm_output_language: "",
    };
  }

  const url = `${settings.contentMaestro.apiBaseUrl}/api/prompt-settings`;
  const headers = {
    Authorization: `Bearer ${settings.contentMaestro.apiBearerToken}`,
    "Content-Type": "application/json",
  };

  // Wrap the actual fetch logic in a function
  const fetchFunction = async () => {
    const response = await fetch(url, {
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
  const apiSettings = getApiSettings();
  const isConfigured = isApiConfigured();

  if (!isConfigured) {
    return {
      status: "error",
      message: "API not configured",
    };
  }

  const response = await fetch(
    `${apiSettings.contentMaestro.apiBaseUrl}/api/prompt-settings`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiSettings.contentMaestro.apiBearerToken}`,
      },
      body: JSON.stringify(settings),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to update prompt settings`);
  }

  return response.json();
}

export async function deleteRepository(identifier: { id?: number; url?: string }): Promise<{ status: string; message: string }> {
  const { baseUrl, headers, isConfigured } = getApiConfig();
  
  if (!isConfigured) {
    return { status: "error", message: "API not configured" };
  }

  const response = await fetch(`${baseUrl}/delete-repository/`, {
    method: "DELETE",
    headers,
    body: JSON.stringify(identifier),
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error("Rate limit exceeded. Please try again later.");
    }
    throw new Error(`Failed to delete repository: ${response.status}`);
  }

  return response.json();
}

export async function promoteRepositoryToNext(identifier: { id?: number; url?: string }): Promise<{ status: string; message: string; data?: Repository }> {
  const { baseUrl, headers, isConfigured } = getApiConfig();

  if (!isConfigured) {
    return { status: "error", message: "API not configured" };
  }

  const response = await fetch(`${baseUrl}/promote-repository/`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(identifier),
  });

  const result = await response.json();

  if (!response.ok) {
    if (response.status === 409) {
      throw new Error(result.message || "Repository is already posted");
    }
    if (response.status === 404) {
      throw new Error(result.message || "Repository not found");
    }
    if (response.status === 429) {
      throw new Error("Rate limit exceeded. Please try again later.");
    }
    throw new Error(result.message || `Failed to promote repository: ${response.status}`);
  }

  return result;
}

export async function updateRepositoryText(identifier: { id?: number; url?: string }, text: string): Promise<{ status: string; message: string; data?: { id: number; url: string; text: string; updated_at: string } }> {
  const { baseUrl, headers, isConfigured } = getApiConfig();
  const settings = getApiSettings();
  const textLanguage = settings.displayLanguage || 'uk';
  
  if (!isConfigured) {
    return { status: "error", message: "API not configured" };
  }

  const createRequest = (language: string) => {
    const fetchFunction = async () => {
      const response = await fetch(`${baseUrl}/update-repository-text/`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ ...identifier, text, text_language: language }),
      });

      const result = await response.json();
      
      // Check for language error in the response first
      if (result.status === "error" && result.message && result.message.includes('no text available for language')) {
        throw new Error(result.message);
      }

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error("Rate limit exceeded. Please try again later.");
        }
        throw new Error(`Failed to update repository text: ${response.status}`);
      }
      
      return result;
    };

    // Create a unique request signature for update operations and queue the request
    return createRequestSignature(
      `${baseUrl}/update-repository-text/`,
      "PATCH",
      { ...identifier, text, text_language: language }
    ).then(signature => queueRequest(fetchFunction, signature));
  };

  // Use fallback logic
  return handleLanguageFallback(() => createRequest(textLanguage), textLanguage, createRequest);
}

/**
 * Reads a Content Alchemist response body defensively.
 *
 * The middleware answers 401 and 429 with plain text, not the JSON envelope, so the body has to be
 * read as text and parsed optimistically - calling response.json() first throws a SyntaxError that
 * would mask the real status.
 */
async function parseAlchemistEnvelope<T>(response: Response, action: string): Promise<T> {
  const raw = await response.text();

  let parsed: unknown = null;
  try {
    parsed = raw ? JSON.parse(raw) : null;
  } catch {
    // Plain-text body (401 / 429 / 405) - handled below.
  }

  const envelopeMessage =
    parsed && typeof parsed === 'object' && 'message' in parsed
      ? String((parsed as { message?: unknown }).message ?? '')
      : '';

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error("Rate limit exceeded. Please try again later.");
    }
    if (response.status === 401) {
      throw new Error("Unauthorized. Check the Content Alchemist bearer token in settings.");
    }
    throw new Error(envelopeMessage || raw.trim() || `${action} failed with status: ${response.status}`);
  }

  if (!parsed) {
    throw new Error(`${action} returned an unexpected response`);
  }

  return parsed as T;
}

export async function archiveRepositories(
  identifiers: { ids: number[] } | { urls: string[] }
): Promise<ArchiveRepositoryResponse> {
  const { baseUrl, headers, isConfigured } = getApiConfig();

  if (!isConfigured) {
    return { status: "error", message: "API not configured", data: { archived: [], failed: [] } };
  }

  const entries = 'ids' in identifiers ? identifiers.ids : identifiers.urls;

  if (!entries.length) {
    throw new Error("No repositories selected for archiving");
  }

  if (entries.length > ARCHIVE_MAX_IDENTIFIERS) {
    throw new Error(`A maximum of ${ARCHIVE_MAX_IDENTIFIERS} repositories can be archived per request`);
  }

  const fetchFunction = async () => {
    const response = await fetch(`${baseUrl}/archive-repository/`, {
      method: "POST",
      headers,
      body: JSON.stringify(identifiers),
    });

    return parseAlchemistEnvelope<ArchiveRepositoryResponse>(response, "Archiving repositories");
  };

  return createRequestSignature(
    `${baseUrl}/archive-repository/`,
    "POST",
    identifiers
  ).then(signature => queueRequest(fetchFunction, signature));
}

export async function archiveOldRepositories(
  days: number,
  dryRun: boolean
): Promise<ArchiveOldRepositoriesResponse> {
  const { baseUrl, headers, isConfigured } = getApiConfig();

  if (!isConfigured) {
    return {
      status: "error",
      message: "API not configured",
      data: { archived_count: 0, dry_run: dryRun, archived: [] },
    };
  }

  if (!Number.isInteger(days) || days < 1) {
    throw new Error("Days must be a whole number greater than 0");
  }

  const requestBody = { days, dry_run: dryRun };

  const fetchFunction = async () => {
    const response = await fetch(`${baseUrl}/archive-old-repositories/`, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
    });

    return parseAlchemistEnvelope<ArchiveOldRepositoriesResponse>(response, "Archiving old repositories");
  };

  return createRequestSignature(
    `${baseUrl}/archive-old-repositories/`,
    "POST",
    requestBody
  ).then(signature => queueRequest(fetchFunction, signature));
}

export async function getArchivedRepositories(
  requestBody: GetArchivedRepositoriesRequest
): Promise<GetArchivedRepositoriesResponse> {
  const { baseUrl, headers, isConfigured } = getApiConfig();

  if (!isConfigured) {
    return {
      status: "error",
      message: "API not configured",
      data: { all: 0, items: [], page: 1, page_size: 0, total_pages: 0, total_items: 0 },
    };
  }

  const fetchFunction = async () => {
    const response = await fetch(`${baseUrl}/get-archived-repositories/`, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
    });

    return parseAlchemistEnvelope<GetArchivedRepositoriesResponse>(response, "Fetching archived repositories");
  };

  return createRequestSignature(
    `${baseUrl}/get-archived-repositories/`,
    "POST",
    requestBody
  ).then(signature => queueRequest(fetchFunction, signature));
}

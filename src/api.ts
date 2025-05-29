import { Repository } from './types';
import { getApiSettings, isApiConfigured } from "./utils/api-settings";

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

function getLlmConfig() {
  return {
    use_direct_url: true,
    llm_provider: "openrouter",
    llm_config: {
      model: "openai/gpt-4o-mini-search-preview",
      temperature: 0.1,
      messages: [
        {
          role: "system",
          content:
            "Ти — AI асистент, що спеціалізується на створенні коротких описів GitHub-репозиторіїв українською мовою. Твоя відповідь **ПОВИННА** суворо відповідати **КОЖНІЙ** з наведених нижче вимог. Будь-яке відхилення, особливо щодо довжини тексту, є неприпустимим. Твоя основна задача — створювати описи на основі наданих URL.\n\nПід час створення опису **НЕУХИЛЬНО** дотримуйся наступних правил:\n\n1.  Включай не більше однієї ключової функції репозиторію.\n2.  **ЗАБОРОНЕНО** додавати будь-які посилання.\n3.  Пиши простою, зрозумілою мовою, без переліків. Інформацію про функції вплітай у зв’язний текст.\n4.  **ЗАБОРОНЕНО** згадувати сумісність, платформи, авторів, компанії або колаборації.\n5.  **ЗАБОРОНЕНО** використовувати будь-яку розмітку: ні HTML, ні Markdown.\n6.  Опис має бути **НАДЗВИЧАЙНО** лаконічним. **АБСОЛЮТНИЙ МАКСИМУМ — 270 символів**, враховуючи пробіли. **Це найважливіша вимога! Перевищення ліміту є КРИТИЧНОЮ помилкою.**\n7.  Технічні терміни (назви мов програмування, бібліотек, інструментів, команд тощо) залишай англійською мовою.\n8.  **ПЕРЕД НАДАННЯМ ВІДПОВІДІ:** Переконайся, що текст відповідає **ВСІМ** вимогам. **ОБОВ'ЯЗКОВО ПЕРЕВІР** довжину. Якщо вона перевищує 270 символів, **ПЕРЕПИШИ І СКОРОТИ** його, доки він не буде відповідати ліміту.\n\nТобі буде надано URL GitHub-репозиторію. Ознайомся з ним і згенеруй опис, що **ТОЧНО** відповідає цим інструкціям.",
        },
      ],
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
  const { baseUrl, headers, isConfigured } = getApiConfig();

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
        total_items: 0
      }
    };
  }

  const requestBody: GetRepositoryRequest = {
    limit: fetchAll || pageSize === 0 ? 0 : pageSize || limit,
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

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }
    throw new Error(`API request failed with status: ${response.status}`);
  }

  return response.json();
}

export interface ManualGenerateResponse {
  status: string;
  added?: string[];
  dont_added?: string[];
}

export async function manualGenerate(url: string): Promise<ManualGenerateResponse> {
  const { baseUrl, headers, isConfigured } = getApiConfig();

  if (!isConfigured) {
    return {
      status: "error",
      added: [],
      dont_added: []
    };
  }

  const llmConfig = getLlmConfig();

  const response = await fetch(`${baseUrl}/manual-generate/`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      url,
      ...llmConfig
    }),
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }
    throw new Error(`API request failed with status: ${response.status}`);
  }

  return response.json();
}

export async function autoGenerate(maxRepos: number, since: string, spokenLanguageCode: string) {
  const { baseUrl, headers, isConfigured } = getApiConfig();

  if (!isConfigured) {
    return {
      status: "error"
    };
  }

  const llmConfig = getLlmConfig();

  const response = await fetch(`${baseUrl}/auto-generate/`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      max_repos: maxRepos,
      since,
      spoken_language_code: spokenLanguageCode,
      ...llmConfig
    }),
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }
    throw new Error(`API request failed with status: ${response.status}`);
  }

  return response.json();
}

export async function getLatestPostedRepository(): Promise<RepositoryResponse> {
  const { baseUrl, headers, isConfigured } = getApiConfig();

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
        total_items: 0
      }
    };
  }

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

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }
    throw new Error(`API request failed with status: ${response.status}`);
  }

  return response.json();
}

export async function getNextRepository(): Promise<RepositoryResponse> {
  const { baseUrl, headers, isConfigured } = getApiConfig();

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
        total_items: 0
      }
    };
  }

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

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }
    throw new Error(`API request failed with status: ${response.status}`);
  }

  return response.json();
}

export interface CollectSettings {
  max_repos: number;
  since: string;
  spoken_language_code: string;
}

export async function getCollectSettings(): Promise<CollectSettings> {
  const settings = getApiSettings();
  const isConfigured = isApiConfigured();

  if (!isConfigured) {
    return {
      max_repos: 10,
      since: "daily",
      spoken_language_code: "en"
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

export async function updateCollectSettings(settings: CollectSettings): Promise<{ status: string; message: string }> {
  const apiSettings = getApiSettings();
  const isConfigured = isApiConfigured();

  if (!isConfigured) {
    return {
      status: "error",
      message: "API not configured"
    };
  }

  const response = await fetch(`${apiSettings.contentMaestro.apiBaseUrl}/api/collect-settings/update`, {
    method: 'PUT',
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiSettings.contentMaestro.apiBearerToken}`,
    },
    body: JSON.stringify(settings),
  });

  if (!response.ok) {
    throw new Error(`Failed to update collect settings`);
  }

  return response.json();
}

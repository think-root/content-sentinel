import { getApiSettings, isApiConfigured } from "../utils/api-settings";

export interface ApiConfig {
  id: number;
  name: string;
  url: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  auth_type: "bearer" | "api_key" | "none" | "";
  token_env_var: string;
  token_header: string;
  content_type: "json" | "multipart";
  timeout: number;
  success_code: number;
  enabled: boolean;
  response_type: string;
  text_language: string;
  socialify_image: boolean;
  default_json_body: string;
  updated_at: string;
}

export interface CreateApiConfigRequest {
  name: string;
  url: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  auth_type?: "bearer" | "api_key" | "none" | "";
  token_env_var?: string;
  token_header?: string;
  content_type: "json" | "multipart";
  timeout: number;
  success_code: number;
  enabled: boolean;
  response_type?: string;
  text_language?: string;
  socialify_image: boolean;
  default_json_body?: string;
}

export interface UpdateApiConfigRequest {
  url?: string;
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  auth_type?: "bearer" | "api_key" | "none" | "";
  token_env_var?: string;
  token_header?: string;
  content_type?: "json" | "multipart";
  timeout?: number;
  success_code?: number;
  enabled?: boolean;
  response_type?: string;
  text_language?: string;
  socialify_image?: boolean;
  default_json_body?: string;
}

export const getApiConfigs = async (): Promise<ApiConfig[]> => {
  const settings = getApiSettings();
  const isConfigured = isApiConfigured();

  if (!isConfigured) {
    return [];
  }

  const response = await fetch(`${settings.contentMaestro.apiBaseUrl}/api/api-configs`, {
    headers: {
      Authorization: `Bearer ${settings.contentMaestro.apiBearerToken}`,
    },
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error("Rate limit exceeded. Please try again later.");
    }
    throw new Error(`Failed to fetch API configs: ${response.status}`);
  }

  return response.json();
};

export const getApiConfig = async (name: string): Promise<ApiConfig> => {
  const settings = getApiSettings();
  const isConfigured = isApiConfigured();

  if (!isConfigured) {
    throw new Error("API not configured");
  }

  const response = await fetch(`${settings.contentMaestro.apiBaseUrl}/api/api-configs/${name}`, {
    headers: {
      Authorization: `Bearer ${settings.contentMaestro.apiBearerToken}`,
    },
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error("Rate limit exceeded. Please try again later.");
    }
    if (response.status === 404) {
      throw new Error(`API config "${name}" not found`);
    }
    throw new Error(`Failed to fetch API config: ${response.status}`);
  }

  return response.json();
};

export const createApiConfig = async (config: CreateApiConfigRequest): Promise<ApiConfig> => {
  const settings = getApiSettings();
  const isConfigured = isApiConfigured();

  if (!isConfigured) {
    throw new Error("API not configured");
  }

  const response = await fetch(`${settings.contentMaestro.apiBaseUrl}/api/api-configs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${settings.contentMaestro.apiBearerToken}`,
    },
    body: JSON.stringify(config),
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error("Rate limit exceeded. Please try again later.");
    }
    if (response.status === 400) {
      const error = await response.json();
      throw new Error(error.message || "Invalid configuration");
    }
    throw new Error(`Failed to create API config: ${response.status}`);
  }

  return response.json();
};

export const updateApiConfig = async (
  name: string,
  updates: UpdateApiConfigRequest
): Promise<ApiConfig> => {
  const settings = getApiSettings();
  const isConfigured = isApiConfigured();

  if (!isConfigured) {
    throw new Error("API not configured");
  }

  const response = await fetch(`${settings.contentMaestro.apiBaseUrl}/api/api-configs/${name}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${settings.contentMaestro.apiBearerToken}`,
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error("Rate limit exceeded. Please try again later.");
    }
    if (response.status === 404) {
      throw new Error(`API config "${name}" not found`);
    }
    if (response.status === 400) {
      const error = await response.json();
      throw new Error(error.message || "Invalid configuration");
    }
    throw new Error(`Failed to update API config: ${response.status}`);
  }

  return response.json();
};

export const deleteApiConfig = async (name: string): Promise<void> => {
  const settings = getApiSettings();
  const isConfigured = isApiConfigured();

  if (!isConfigured) {
    throw new Error("API not configured");
  }

  const response = await fetch(`${settings.contentMaestro.apiBaseUrl}/api/api-configs/${name}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${settings.contentMaestro.apiBearerToken}`,
    },
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error("Rate limit exceeded. Please try again later.");
    }
    if (response.status === 404) {
      throw new Error(`API config "${name}" not found`);
    }
    throw new Error(`Failed to delete API config: ${response.status}`);
  }
};

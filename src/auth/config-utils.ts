export interface Config {
  API_BASE_URL: string;
  API_BEARER_TOKEN: string;
  DATE_FORMAT: string;
  TIMEZONE: string;
}

export interface ConfigContextType {
  config: Config | null;
  isLoading: boolean;
  error: string | null;
}

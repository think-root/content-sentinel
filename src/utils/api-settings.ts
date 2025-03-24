export interface ApiSettings {
  apiBaseUrl: string;
  apiBearerToken: string;
  dateFormat: string;
  timezone: string;
}

export const LOCAL_STORAGE_KEY = "api_settings";

export const getApiSettings = (): ApiSettings => {
  const settings = localStorage.getItem(LOCAL_STORAGE_KEY);
  return settings
    ? JSON.parse(settings)
    : {
        apiBaseUrl: "",
        apiBearerToken: "",
        dateFormat: "DD.MM.YYYY HH:mm",
        timezone: "Europe/Kyiv",
      };
};

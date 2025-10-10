export interface ApiSettings {
  apiBaseUrl: string;
  apiBearerToken: string;
  dateFormat: string;
  timezone: string;
  displayLanguage: string;
  contentAlchemist: {
    apiBaseUrl: string;
    apiBearerToken: string;
  };
  contentMaestro: {
    apiBaseUrl: string;
    apiBearerToken: string;
  };
}

export const LOCAL_STORAGE_KEY = "api_settings";

const defaultSettings: ApiSettings = {
  apiBaseUrl: "",
  apiBearerToken: "",
  dateFormat: "DD.MM.YYYY HH:mm",
  timezone: "Europe/Kyiv",
  displayLanguage: "uk",
  contentAlchemist: {
    apiBaseUrl: "",
    apiBearerToken: "",
  },
  contentMaestro: {
    apiBaseUrl: "",
    apiBearerToken: "",
  },
};

export const getApiSettings = (): ApiSettings => {
  const settings = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!settings) {
    return defaultSettings;
  }

  const parsedSettings = JSON.parse(settings);
  return {
    ...defaultSettings,
    ...parsedSettings,
    contentAlchemist: {
      ...defaultSettings.contentAlchemist,
      ...parsedSettings.contentAlchemist,
    },
    contentMaestro: {
      ...defaultSettings.contentMaestro,
      ...parsedSettings.contentMaestro,
    },
  };
};

export const isApiConfigured = (): boolean => {
  const settings = getApiSettings();
  return !!(
    settings.contentAlchemist?.apiBaseUrl && 
    settings.contentAlchemist?.apiBearerToken && 
    settings.contentMaestro?.apiBaseUrl && 
    settings.contentMaestro?.apiBearerToken
  );
};

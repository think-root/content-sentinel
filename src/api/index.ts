import { getApiSettings, isApiConfigured } from "../utils/api-settings";

export interface CronJob {
  name: string;
  schedule: string;
  is_active: boolean;
  updated_at: string;
}

export const getCronJobs = async (): Promise<CronJob[]> => {
  const settings = getApiSettings();
  const isConfigured = isApiConfigured();

  if (!isConfigured) {
    return [];
  }

  const response = await fetch(`${settings.contentMaestro.apiBaseUrl}/api/crons`, {
    headers: {
      Authorization: `Bearer ${settings.contentMaestro.apiBearerToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch cron jobs");
  }

  return response.json();
};

export const updateCronSchedule = async (name: string, schedule: string): Promise<void> => {
  const settings = getApiSettings();
  const isConfigured = isApiConfigured();

  if (!isConfigured) {
    return;
  }

  const response = await fetch(`${settings.contentMaestro.apiBaseUrl}/api/crons/${name}/schedule`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${settings.contentMaestro.apiBearerToken}`,
    },
    body: JSON.stringify({ schedule }),
  });

  if (!response.ok) {
    throw new Error("Failed to update cron schedule");
  }
};

export const updateCronStatus = async (name: string, is_active: boolean): Promise<void> => {
  const settings = getApiSettings();
  const isConfigured = isApiConfigured();

  if (!isConfigured) {
    return;
  }

  const response = await fetch(`${settings.contentMaestro.apiBaseUrl}/api/crons/${name}/status`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${settings.contentMaestro.apiBearerToken}`,
    },
    body: JSON.stringify({ is_active }),
  });

  if (!response.ok) {
    throw new Error("Failed to update cron status");
  }
};

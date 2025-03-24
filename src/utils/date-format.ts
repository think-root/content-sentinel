import { getApiSettings } from "./api-settings";

export function formatDate(dateString: string): string {
  const settings = getApiSettings();
  const dateFormat = settings.dateFormat || "DD.MM.YYYY HH:mm:ss";

  try {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");

    return dateFormat
      .replace("DD", day)
      .replace("MM", month)
      .replace("YYYY", String(year))
      .replace("HH", hours)
      .replace("mm", minutes)
      .replace("ss", seconds);
  } catch (error) {
    console.error("Error formatting date:", error);
    return dateString;
  }
}

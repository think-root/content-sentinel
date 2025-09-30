import { getApiSettings } from "./api-settings";

export function formatDate(dateString: string): string {
  const settings = getApiSettings();
  const dateFormat = settings.dateFormat || "DD.MM.YYYY HH:mm:ss";
  const is12HourFormat = dateFormat.includes('hh:');
  const timezone = settings.timezone || "Europe/Kyiv";

  const options: Intl.DateTimeFormatOptions = {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: is12HourFormat,
  };

  try {
    const date = new Date(dateString);
    const formatter = new Intl.DateTimeFormat("en-US", options);
    const parts = formatter.formatToParts(date);
    const values: { [key: string]: string } = {};

    parts.forEach((part) => {
      values[part.type] = part.value;
    });

    return dateFormat
      .replace("DD", values.day)
      .replace("MM", values.month)
      .replace("YYYY", values.year)
      .replace("HH", values.hour)
      .replace("hh", values.hour)
      .replace("mm", values.minute)
      .replace("ss", values.second)
      .replace("A", values.dayPeriod || "")
      .replace("a", (values.dayPeriod || "").toLowerCase());
  } catch (error) {
    console.error("Error formatting date:", error);
    return dateString;
  }
}

export function formatDateOnly(dateString: string): string {
  const settings = getApiSettings();
  const dateFormat = settings.dateFormat || "DD.MM.YYYY HH:mm:ss";
  const timezone = settings.timezone || "Europe/Kyiv";

  // Derive date-only pattern from the full date format
  const dateOnlyFormat = dateFormat
    .replace(/HH?(:mm(:ss)?)?/g, '')  // Remove hour patterns
    .replace(/mm(:ss)?/g, '')         // Remove minute patterns
    .replace(/ss/g, '')               // Remove second patterns
    .replace(/A/g, '')                // Remove AM/PM indicators
    .replace(/a/g, '')                // Remove am/pm indicators
    .replace(/\s+/g, ' ')             // Normalize whitespace
    .trim();                          // Remove leading/trailing whitespace

  // If no date components remain, use default date format
  const finalDateFormat = dateOnlyFormat || "DD.MM.YYYY";

  const options: Intl.DateTimeFormatOptions = {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  };

  try {
    const date = new Date(dateString);
    const formatter = new Intl.DateTimeFormat("en-US", options);
    const parts = formatter.formatToParts(date);
    const values: { [key: string]: string } = {};

    parts.forEach((part) => {
      values[part.type] = part.value;
    });

    return finalDateFormat
      .replace("DD", values.day)
      .replace("MM", values.month)
      .replace("YYYY", values.year)
      .replace("HH", values.hour)     // Keep these for safety, though they should be removed
      .replace("hh", values.hour)
      .replace("mm", values.minute)
      .replace("ss", values.second)
      .replace("A", values.dayPeriod || "")
      .replace("a", (values.dayPeriod || "").toLowerCase());
  } catch (error) {
    console.error("Error formatting date only:", error);
    return dateString;
  }
}

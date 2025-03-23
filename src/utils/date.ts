export const formatDate = (dateStr: string) => {
  if (!import.meta.env.DATE_FORMAT && !import.meta.env.TIMEZONE) {
    return dateStr;
  }

  const date = new Date(dateStr);
  const format = import.meta.env.DATE_FORMAT || dateStr;
  const timezone = import.meta.env.TIMEZONE;

  try {
    if (timezone) {
      date.toLocaleString('en-US', { timeZone: timezone });
    }

    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');

    return format
      .replace('DD', day)
      .replace('MM', month)
      .replace('YYYY', year.toString())
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds);
  } catch {
    return dateStr;
  }
};

export function formatDate(dateString: string): string;
export function formatDateOnly(dateString: string): string;
export const DATE_FORMAT_PRESETS: string[];
export function hasTime(format: string): boolean;
export function stripSeconds(format: string): string;
export function withSeconds(format: string, include: boolean): string;
export function sampleDate(format: string): string;

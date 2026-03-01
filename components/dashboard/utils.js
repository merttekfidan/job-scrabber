'use client';

/**
 * Dashboard utils — re-export from lib/utils for single source of truth (Phase 3.3).
 * Legacy parseJson/getStatusClass kept for existing .js components.
 */
import { safeParseJson, formatDate as formatDateLib, getStatusColor, formatSalary as formatSalaryLib } from '@/lib/utils';

export function parseJson(str) {
  return safeParseJson(str, []);
}

export { formatDateLib as formatDate };
export function getStatusClass(status) {
  return getStatusColor(status);
}
export function formatSalary(salary, location) {
  return formatSalaryLib(salary, location);
}

/** Generic API success wrapper from backend */
export type ApiResponse<T> = {
  success: true;
  [key: string]: T | boolean | unknown;
};

/** Error payload from backend */
export type ApiErrorResponse = {
  success: false;
  error: string;
};

/** Type guard for API error */
export function isApiError(
  res: ApiResponse<unknown> | ApiErrorResponse
): res is ApiErrorResponse {
  return res.success === false;
}

/** Generic paginated list response */
export type PaginatedResponse<T> = {
  items: T[];
  total?: number;
  limit?: number;
  offset?: number;
};

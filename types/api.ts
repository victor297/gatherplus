export interface ApiSuccessResponse<T = unknown> {
  body: T;
  code?: number;
  message?: string;
}

export interface PaginatedBody<T> {
  currentPage?: number;
  page?: number;
  result: T[];
  totalItems?: number;
  totalPages?: number;
}

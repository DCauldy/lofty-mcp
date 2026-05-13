export interface LoftyListResponse<T> {
  data?: T[];
  total?: number;
  offset?: number;
  limit?: number;
  [key: string]: T[] | number | undefined;
}

export interface LoftyErrorResponse {
  code?: number;
  message?: string;
  error?: string;
}

export interface ToolResponse {
  [key: string]: unknown;
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
}

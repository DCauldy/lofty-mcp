import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import type { ToolResponse } from "./types.js";

const BASE_URL = "https://api.lofty.com";

function getAuthHeader(opts?: { apiKey?: string; accessToken?: string }): string {
  if (opts?.accessToken) {
    return `Bearer ${opts.accessToken}`;
  }
  const key = opts?.apiKey || process.env.LOFTY_API_KEY;
  if (!key) {
    throw new Error("LOFTY_API_KEY environment variable is not set");
  }
  return `token ${key}`;
}

export interface RequestOptions {
  method?: string;
  path: string;
  params?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  apiKey?: string;
  accessToken?: string;
}

export function getLoftyAuthOptions(authInfo?: AuthInfo): { apiKey?: string; accessToken?: string } {
  if (!authInfo?.extra) return {};
  const authType = authInfo.extra.authType as string | undefined;
  if (authType === "oauth") {
    return { accessToken: authInfo.extra.loftyAccessToken as string };
  }
  return { apiKey: authInfo.extra.loftyApiKey as string | undefined };
}

export async function loftyRequest(options: RequestOptions): Promise<unknown> {
  const { method = "GET", path, params, body, apiKey, accessToken } = options;

  const url = new URL(`${BASE_URL}${path}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
  }

  const headers: Record<string, string> = {
    Authorization: getAuthHeader({ apiKey, accessToken }),
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  const response = await fetch(url.toString(), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    signal: controller.signal,
  }).finally(() => clearTimeout(timeout));

  if (response.status === 204) {
    return { success: true };
  }

  const text = await response.text();
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    data = { rawResponse: text };
  }

  if (!response.ok) {
    const err = data as Record<string, unknown>;
    throw new Error(
      JSON.stringify({
        status: response.status,
        message: err?.message ?? err?.error ?? response.statusText,
        code: err?.code,
      })
    );
  }

  return data;
}

export function success(data: unknown): ToolResponse {
  return {
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
  };
}

export function error(err: unknown): ToolResponse {
  const message = err instanceof Error ? err.message : String(err);
  return {
    content: [{ type: "text", text: message }],
    isError: true,
  };
}

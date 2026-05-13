import { kv } from "@vercel/kv";
import { createHash, randomBytes } from "node:crypto";
import type { OAuthClientInformationFull } from "@modelcontextprotocol/sdk/shared/auth.js";

// TTLs in seconds
const AUTH_CODE_TTL = 300; // 5 minutes
const ACCESS_TOKEN_TTL = 3600; // 1 hour
const REFRESH_TOKEN_TTL = 30 * 24 * 3600; // 30 days

// KV key prefixes
const PREFIX = {
  client: "lofty-client:",
  authCode: "lofty-authcode:",
  token: "lofty-token:",
  refresh: "lofty-refresh:",
};

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function generateToken(): string {
  return randomBytes(32).toString("hex");
}

export function generateAuthCode(): string {
  return randomBytes(24).toString("hex");
}

// ─── Client operations ───

export async function saveClient(client: OAuthClientInformationFull): Promise<void> {
  await kv.set(`${PREFIX.client}${client.client_id}`, JSON.stringify(client));
}

export async function getClient(clientId: string): Promise<OAuthClientInformationFull | undefined> {
  const raw = await kv.get<string>(`${PREFIX.client}${clientId}`);
  if (!raw) return undefined;
  return typeof raw === "string" ? JSON.parse(raw) : raw;
}

// ─── Auth code operations ───

export interface AuthCodeData {
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  encryptedApiKey: string;
  state?: string;
}

export async function saveAuthCode(code: string, data: AuthCodeData): Promise<void> {
  await kv.set(`${PREFIX.authCode}${code}`, JSON.stringify(data), { ex: AUTH_CODE_TTL });
}

export async function getAuthCode(code: string): Promise<AuthCodeData | undefined> {
  const raw = await kv.get<string>(`${PREFIX.authCode}${code}`);
  if (!raw) return undefined;
  return typeof raw === "string" ? JSON.parse(raw) : raw;
}

export async function deleteAuthCode(code: string): Promise<void> {
  await kv.del(`${PREFIX.authCode}${code}`);
}

// ─── Access token operations ───

export interface TokenData {
  clientId: string;
  encryptedApiKey: string;
  scopes: string[];
  expiresAt: number;
  refreshTokenHash?: string;
}

export async function saveAccessToken(token: string, data: TokenData): Promise<void> {
  const hash = sha256(token);
  await kv.set(`${PREFIX.token}${hash}`, JSON.stringify(data), { ex: ACCESS_TOKEN_TTL });
}

export async function getAccessToken(token: string): Promise<TokenData | undefined> {
  const hash = sha256(token);
  const raw = await kv.get<string>(`${PREFIX.token}${hash}`);
  if (!raw) return undefined;
  return typeof raw === "string" ? JSON.parse(raw) : raw;
}

export async function deleteAccessToken(token: string): Promise<void> {
  const hash = sha256(token);
  await kv.del(`${PREFIX.token}${hash}`);
}

// ─── Refresh token operations ───

export interface RefreshTokenData {
  clientId: string;
  encryptedApiKey: string;
  scopes: string[];
}

export async function saveRefreshToken(token: string, data: RefreshTokenData): Promise<void> {
  const hash = sha256(token);
  await kv.set(`${PREFIX.refresh}${hash}`, JSON.stringify(data), { ex: REFRESH_TOKEN_TTL });
}

export async function getRefreshToken(token: string): Promise<RefreshTokenData | undefined> {
  const hash = sha256(token);
  const raw = await kv.get<string>(`${PREFIX.refresh}${hash}`);
  if (!raw) return undefined;
  return typeof raw === "string" ? JSON.parse(raw) : raw;
}

export async function deleteRefreshToken(token: string): Promise<void> {
  const hash = sha256(token);
  await kv.del(`${PREFIX.refresh}${hash}`);
}

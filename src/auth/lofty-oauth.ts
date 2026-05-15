import { encrypt, decrypt } from "./crypto.js";

export interface LoftyOAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Unix timestamp (seconds)
}

/**
 * Exchange a Lofty refresh token for a new access/refresh token pair.
 */
export async function refreshLoftyAccessToken(refreshToken: string): Promise<LoftyOAuthTokens> {
  const clientId = process.env.LOFTY_OAUTH_CLIENT_ID;
  const clientSecret = process.env.LOFTY_OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("LOFTY_OAUTH_CLIENT_ID and LOFTY_OAUTH_CLIENT_SECRET must be set");
  }

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const formBody = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  const res = await fetch("https://crm.lofty.com/api/user-web/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basicAuth}`,
    },
    body: formBody.toString(),
    signal: controller.signal,
  }).finally(() => clearTimeout(timeout));

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Lofty token refresh failed (${res.status}): ${text}`);
  }

  const data = (await res.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Math.floor(Date.now() / 1000) + data.expires_in,
  };
}

/**
 * Decrypt Lofty OAuth tokens, refresh if expired (with 60s buffer), re-encrypt if refreshed.
 * Returns the current (possibly refreshed) tokens and updated encrypted blob.
 */
export async function maybeRefreshLoftyTokens(
  encryptedLoftyTokens: string
): Promise<{ tokens: LoftyOAuthTokens; encryptedLoftyTokens: string; refreshed: boolean }> {
  const tokens: LoftyOAuthTokens = JSON.parse(decrypt(encryptedLoftyTokens));
  const now = Math.floor(Date.now() / 1000);

  if (tokens.expiresAt - now > 60) {
    // Token still valid
    return { tokens, encryptedLoftyTokens, refreshed: false };
  }

  // Token expired or about to expire — refresh
  const refreshed = await refreshLoftyAccessToken(tokens.refreshToken);
  const newEncrypted = encrypt(JSON.stringify(refreshed));
  return { tokens: refreshed, encryptedLoftyTokens: newEncrypted, refreshed: true };
}

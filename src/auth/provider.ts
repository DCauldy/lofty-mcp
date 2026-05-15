import type { Response } from "express";
import type { OAuthServerProvider, AuthorizationParams } from "@modelcontextprotocol/sdk/server/auth/provider.js";
import type { OAuthRegisteredClientsStore } from "@modelcontextprotocol/sdk/server/auth/clients.js";
import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import type {
  OAuthClientInformationFull,
  OAuthTokens,
  OAuthTokenRevocationRequest,
} from "@modelcontextprotocol/sdk/shared/auth.js";
import { randomUUID } from "node:crypto";
import { decrypt } from "./crypto.js";
import { maybeRefreshLoftyTokens } from "./lofty-oauth.js";
import {
  saveClient,
  getClient,
  saveAuthCode,
  getAuthCode,
  deleteAuthCode,
  saveAccessToken,
  getAccessToken,
  deleteAccessToken,
  saveRefreshToken,
  getRefreshToken,
  deleteRefreshToken,
  generateToken,
  generateAuthCode,
} from "./store.js";
import { getAuthorizePage } from "./pages.js";

/**
 * Clients store backed by Vercel KV. Supports dynamic client registration.
 */
class KvClientsStore implements OAuthRegisteredClientsStore {
  async getClient(clientId: string): Promise<OAuthClientInformationFull | undefined> {
    return getClient(clientId);
  }

  async registerClient(
    client: Omit<OAuthClientInformationFull, "client_id" | "client_id_issued_at">
  ): Promise<OAuthClientInformationFull> {
    const full: OAuthClientInformationFull = {
      ...client,
      client_id: randomUUID(),
      client_id_issued_at: Math.floor(Date.now() / 1000),
    };
    await saveClient(full);
    return full;
  }
}

/**
 * OAuth server provider for the Lofty MCP server.
 * Supports two auth methods:
 * - API key: user enters their Lofty API key directly
 * - OAuth: user signs in via Lofty OAuth ("Sign in with Lofty")
 */
export class LoftyOAuthProvider implements OAuthServerProvider {
  readonly clientsStore = new KvClientsStore();

  async authorize(
    client: OAuthClientInformationFull,
    params: AuthorizationParams,
    res: Response
  ): Promise<void> {
    const serverUrl = (process.env.SERVER_URL || "http://localhost:3000").trim();
    const loftyOAuthClientId = process.env.LOFTY_OAUTH_CLIENT_ID;

    // Build the /oauth/start URL if Lofty OAuth is configured
    let oauthStartUrl: string | undefined;
    if (loftyOAuthClientId) {
      const startUrl = new URL(`${serverUrl}/oauth/start`);
      startUrl.searchParams.set("client_id", client.client_id);
      startUrl.searchParams.set("redirect_uri", params.redirectUri);
      startUrl.searchParams.set("code_challenge", params.codeChallenge);
      if (params.state) startUrl.searchParams.set("state", params.state);
      oauthStartUrl = startUrl.toString();
    }

    const html = getAuthorizePage(
      client.client_id,
      params.redirectUri,
      params.state,
      params.codeChallenge,
      undefined,
      oauthStartUrl
    );
    res.setHeader("Content-Type", "text/html");
    res.end(html);
  }

  async challengeForAuthorizationCode(
    _client: OAuthClientInformationFull,
    authorizationCode: string
  ): Promise<string> {
    const data = await getAuthCode(authorizationCode);
    if (!data) {
      throw new Error("Invalid or expired authorization code");
    }
    return data.codeChallenge;
  }

  async exchangeAuthorizationCode(
    _client: OAuthClientInformationFull,
    authorizationCode: string
  ): Promise<OAuthTokens> {
    const data = await getAuthCode(authorizationCode);
    if (!data) {
      throw new Error("Invalid or expired authorization code");
    }

    // Clean up the auth code (single use)
    await deleteAuthCode(authorizationCode);

    const authType = data.authType || "apikey";
    const accessToken = generateToken();
    const refreshToken = generateToken();
    const expiresIn = 3600; // 1 hour

    await saveAccessToken(accessToken, {
      clientId: data.clientId,
      encryptedApiKey: data.encryptedApiKey,
      encryptedLoftyTokens: data.encryptedLoftyTokens,
      authType,
      scopes: [],
      expiresAt: Math.floor(Date.now() / 1000) + expiresIn,
    });

    await saveRefreshToken(refreshToken, {
      clientId: data.clientId,
      encryptedApiKey: data.encryptedApiKey,
      encryptedLoftyTokens: data.encryptedLoftyTokens,
      authType,
      scopes: [],
    });

    return {
      access_token: accessToken,
      token_type: "Bearer",
      expires_in: expiresIn,
      refresh_token: refreshToken,
    };
  }

  async exchangeRefreshToken(
    _client: OAuthClientInformationFull,
    refreshToken: string
  ): Promise<OAuthTokens> {
    const data = await getRefreshToken(refreshToken);
    if (!data) {
      throw new Error("Invalid or expired refresh token");
    }

    // Rotate: delete old refresh token, issue new pair
    await deleteRefreshToken(refreshToken);

    const authType = data.authType || "apikey";
    let encryptedLoftyTokens = data.encryptedLoftyTokens;

    // For OAuth sessions, proactively refresh Lofty tokens if needed
    if (authType === "oauth" && encryptedLoftyTokens) {
      const result = await maybeRefreshLoftyTokens(encryptedLoftyTokens);
      encryptedLoftyTokens = result.encryptedLoftyTokens;
    }

    const newAccessToken = generateToken();
    const newRefreshToken = generateToken();
    const expiresIn = 3600;

    await saveAccessToken(newAccessToken, {
      clientId: data.clientId,
      encryptedApiKey: data.encryptedApiKey,
      encryptedLoftyTokens,
      authType,
      scopes: data.scopes,
      expiresAt: Math.floor(Date.now() / 1000) + expiresIn,
    });

    await saveRefreshToken(newRefreshToken, {
      clientId: data.clientId,
      encryptedApiKey: data.encryptedApiKey,
      encryptedLoftyTokens,
      authType,
      scopes: data.scopes,
    });

    return {
      access_token: newAccessToken,
      token_type: "Bearer",
      expires_in: expiresIn,
      refresh_token: newRefreshToken,
    };
  }

  async verifyAccessToken(token: string): Promise<AuthInfo> {
    const data = await getAccessToken(token);
    if (!data) {
      throw new Error("Invalid or expired access token");
    }

    if (data.expiresAt < Math.floor(Date.now() / 1000)) {
      await deleteAccessToken(token);
      throw new Error("Access token has expired");
    }

    const authType = data.authType || "apikey";

    if (authType === "oauth" && data.encryptedLoftyTokens) {
      // Lofty OAuth flow — decrypt tokens, refresh if needed
      const result = await maybeRefreshLoftyTokens(data.encryptedLoftyTokens);

      // If tokens were refreshed, update the stored access token data
      if (result.refreshed) {
        await saveAccessToken(token, {
          ...data,
          encryptedLoftyTokens: result.encryptedLoftyTokens,
        });
      }

      return {
        token,
        clientId: data.clientId,
        scopes: data.scopes,
        expiresAt: data.expiresAt,
        extra: { loftyAccessToken: result.tokens.accessToken, authType: "oauth" },
      };
    }

    // API key flow (default / backward compatible)
    const loftyApiKey = decrypt(data.encryptedApiKey);

    return {
      token,
      clientId: data.clientId,
      scopes: data.scopes,
      expiresAt: data.expiresAt,
      extra: { loftyApiKey, authType: "apikey" },
    };
  }

  async revokeToken(
    _client: OAuthClientInformationFull,
    request: OAuthTokenRevocationRequest
  ): Promise<void> {
    if (request.token_type_hint === "refresh_token") {
      await deleteRefreshToken(request.token);
    } else {
      await deleteAccessToken(request.token);
    }
  }
}

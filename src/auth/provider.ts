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
import { encrypt, decrypt } from "./crypto.js";
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
 * Implements a custom flow where users enter their Lofty API key
 * during the OAuth authorization step.
 */
export class LoftyOAuthProvider implements OAuthServerProvider {
  readonly clientsStore = new KvClientsStore();

  async authorize(
    client: OAuthClientInformationFull,
    params: AuthorizationParams,
    res: Response
  ): Promise<void> {
    const html = getAuthorizePage(
      client.client_id,
      params.redirectUri,
      params.state,
      params.codeChallenge
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

    const accessToken = generateToken();
    const refreshToken = generateToken();
    const expiresIn = 3600; // 1 hour

    await saveAccessToken(accessToken, {
      clientId: data.clientId,
      encryptedApiKey: data.encryptedApiKey,
      scopes: [],
      expiresAt: Math.floor(Date.now() / 1000) + expiresIn,
    });

    await saveRefreshToken(refreshToken, {
      clientId: data.clientId,
      encryptedApiKey: data.encryptedApiKey,
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

    const newAccessToken = generateToken();
    const newRefreshToken = generateToken();
    const expiresIn = 3600;

    await saveAccessToken(newAccessToken, {
      clientId: data.clientId,
      encryptedApiKey: data.encryptedApiKey,
      scopes: data.scopes,
      expiresAt: Math.floor(Date.now() / 1000) + expiresIn,
    });

    await saveRefreshToken(newRefreshToken, {
      clientId: data.clientId,
      encryptedApiKey: data.encryptedApiKey,
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

    const loftyApiKey = decrypt(data.encryptedApiKey);

    return {
      token,
      clientId: data.clientId,
      scopes: data.scopes,
      expiresAt: data.expiresAt,
      extra: { loftyApiKey },
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

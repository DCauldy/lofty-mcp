import express from "express";
import type { Request, Response, NextFunction } from "express";
import cors from "cors";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { mcpAuthRouter } from "@modelcontextprotocol/sdk/server/auth/router.js";
import { requireBearerAuth } from "@modelcontextprotocol/sdk/server/auth/middleware/bearerAuth.js";
import { randomUUID } from "node:crypto";
import { kv } from "@vercel/kv";
import { createLogger, requestInstrumentation } from "./logger.js";

import { LoftyOAuthProvider } from "./auth/provider.js";
import { encrypt } from "./auth/crypto.js";
import {
  saveAuthCode,
  generateAuthCode,
  getClient,
  saveOAuthSession,
  getOAuthSession,
  deleteOAuthSession,
} from "./auth/store.js";
import { getAuthorizePage } from "./auth/pages.js";

import { registerLeadsTools } from "./tools/leads.js";
import { registerCommunicationTools } from "./tools/communication.js";
import { registerNotesTools } from "./tools/notes.js";
import { registerCallsTools } from "./tools/calls.js";
import { registerTasksTools } from "./tools/tasks.js";
import { registerTasksV2Tools } from "./tools/tasks-v2.js";
import { registerCalendarTools } from "./tools/calendar.js";
import { registerTransactionsTools } from "./tools/transactions.js";
import { registerMembersTools } from "./tools/members.js";
import { registerListingsTools } from "./tools/listings.js";
import { registerWebhooksTools } from "./tools/webhooks.js";
import { registerTeamFeaturesTools } from "./tools/team-features.js";
import { registerRoutingTools } from "./tools/routing.js";
import { registerAgentsTools } from "./tools/agents.js";
import { registerOrganizationTools } from "./tools/organization.js";
import { registerManualLogsTools } from "./tools/manual-logs.js";
import { registerSystemLogsTools } from "./tools/system-logs.js";
import { registerAiFeaturesTools } from "./tools/ai-features.js";
import { registerSalesAgentsTools } from "./tools/sales-agents.js";
import { registerNotificationsTools } from "./tools/notifications.js";
import { registerIdentityTools } from "./tools/identity.js";
import { AIM_FAVICON_BUF, AIM_LOGO_SVG, LOFTY_LOGO_SVG } from "./branding.js";

/**
 * Creates a fresh McpServer instance with all tools registered.
 * Called per-request because Vercel serverless functions are ephemeral.
 */
export function createMcpServer(): McpServer {
  const server = new McpServer({
    name: "lofty",
    version: "1.0.0",
  });

  registerLeadsTools(server);
  registerCommunicationTools(server);
  registerNotesTools(server);
  registerCallsTools(server);
  registerTasksTools(server);
  registerTasksV2Tools(server);
  registerCalendarTools(server);
  registerTransactionsTools(server);
  registerMembersTools(server);
  registerListingsTools(server);
  registerWebhooksTools(server);
  registerTeamFeaturesTools(server);
  registerRoutingTools(server);
  registerAgentsTools(server);
  registerOrganizationTools(server);
  registerManualLogsTools(server);
  registerSystemLogsTools(server);
  registerAiFeaturesTools(server);
  registerSalesAgentsTools(server);
  registerNotificationsTools(server);
  registerIdentityTools(server);

  return server;
}

// ─── Express app setup ───

const serverUrl = (process.env.SERVER_URL || "http://localhost:3000").trim();
const provider = new LoftyOAuthProvider();

const app = express();

// CORS — restrict to known origins
const allowedOrigins = [
  serverUrl,
  "https://claude.ai",
  "https://console.anthropic.com",
  "http://localhost:3000",
  "http://localhost:5173",
];
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (server-to-server, curl, MCP clients)
    if (!origin) return callback(null, true);
    if (allowedOrigins.some((o) => origin.startsWith(o))) return callback(null, true);
    callback(null, false);
  },
  credentials: true,
}));

const logger = createLogger("lofty-mcp");
app.use(requestInstrumentation());

// Rate limiting backed by Vercel KV (no extra dependencies)
async function checkRateLimit(key: string, maxAttempts: number, windowSeconds: number): Promise<boolean> {
  const kvKey = `lofty-ratelimit:${key}`;
  const current = await kv.incr(kvKey);
  if (current === 1) {
    await kv.expire(kvKey, windowSeconds);
  }
  return current <= maxAttempts;
}

function rateLimiter(prefix: string, maxAttempts: number, windowSeconds: number) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const ip = req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() || req.ip || "unknown";
    const allowed = await checkRateLimit(`${prefix}:${ip}`, maxAttempts, windowSeconds);
    if (!allowed) {
      res.status(429).json({ error: "Too many requests. Please try again later." });
      return;
    }
    next();
  };
}

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", server: "lofty-mcp" });
});

// AiM branding assets (must be public, no auth)
app.get("/favicon.png", (_req, res) => {
  res.setHeader("Content-Type", "image/png");
  res.setHeader("Cache-Control", "public, max-age=86400");
  res.send(AIM_FAVICON_BUF);
});
app.get("/favicon.ico", (_req, res) => {
  res.setHeader("Content-Type", "image/png");
  res.setHeader("Cache-Control", "public, max-age=86400");
  res.send(AIM_FAVICON_BUF);
});
app.get("/logo.svg", (_req, res) => {
  res.setHeader("Content-Type", "image/svg+xml");
  res.setHeader("Cache-Control", "public, max-age=86400");
  res.send(AIM_LOGO_SVG);
});
app.get("/product-logo.svg", (_req, res) => {
  res.setHeader("Content-Type", "image/svg+xml");
  res.setHeader("Cache-Control", "public, max-age=86400");
  res.send(LOFTY_LOGO_SVG);
});

// OAuth metadata with logo_uri (registered before mcpAuthRouter so it takes priority)
app.get("/.well-known/oauth-authorization-server", (_req, res) => {
  res.json({
    issuer: serverUrl.endsWith("/") ? serverUrl : serverUrl + "/",
    authorization_endpoint: `${serverUrl}/authorize`,
    token_endpoint: `${serverUrl}/token`,
    registration_endpoint: `${serverUrl}/register`,
    revocation_endpoint: `${serverUrl}/revoke`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    token_endpoint_auth_methods_supported: ["client_secret_post", "none"],
    code_challenge_methods_supported: ["S256"],
    service_documentation: "https://developer.lofty.com",
  });
});

// OAuth routes (authorize, token, register, revoke)
app.use(
  mcpAuthRouter({
    provider,
    issuerUrl: new URL(serverUrl),
    baseUrl: new URL(serverUrl),
    serviceDocumentationUrl: new URL("https://developer.lofty.com"),
  })
);

// Custom callback endpoint: validates Lofty API key, stores auth code, redirects
app.post("/auth/callback", rateLimiter("auth-callback", 10, 300), express.urlencoded({ extended: false }), async (req, res) => {
  res.on("finish", () => {
    logger.info("Request completed", {
      ...logger.fromReq(req),
      statusCode: res.statusCode,
      durationMs: req.startTime ? Date.now() - req.startTime : undefined,
    });
  });
  try {
    const { apiKey, client_id, redirect_uri, code_challenge, state } = req.body;

    if (!apiKey || !client_id || !redirect_uri || !code_challenge) {
      res.status(400).send(
        getAuthorizePage(client_id || "", redirect_uri || "", state, code_challenge || "", "All fields are required.")
      );
      return;
    }

    // Validate redirect_uri against registered client
    const client = await getClient(client_id);
    if (!client) {
      res.status(400).send(
        getAuthorizePage(client_id, redirect_uri, state, code_challenge, "Unknown client. Please try connecting again.")
      );
      return;
    }
    if (!client.redirect_uris.includes(redirect_uri)) {
      res.status(400).send(
        getAuthorizePage(client_id, redirect_uri, state, code_challenge, "Invalid redirect URI.")
      );
      return;
    }

    // Validate the API key against Lofty /me endpoint
    const meRes = await fetch("https://api.lofty.com/v1.0/me", {
      headers: {
        Authorization: `token ${apiKey}`,
        Accept: "application/json",
      },
    });

    if (!meRes.ok) {
      res.status(400).send(
        getAuthorizePage(client_id, redirect_uri, state, code_challenge, "Invalid API key. Please check your key and try again.")
      );
      return;
    }

    // Encrypt the API key and generate an auth code
    const encryptedApiKey = encrypt(apiKey);
    const code = generateAuthCode();

    await saveAuthCode(code, {
      clientId: client_id,
      redirectUri: redirect_uri,
      codeChallenge: code_challenge,
      encryptedApiKey,
      authType: "apikey",
      state,
    });

    // Redirect back to Claude with the authorization code
    const redirectUrl = new URL(redirect_uri);
    redirectUrl.searchParams.set("code", code);
    if (state) redirectUrl.searchParams.set("state", state);

    res.redirect(302, redirectUrl.toString());
  } catch (err) {
    logger.error("Auth callback error", { ...logger.fromReq(req), error: String(err) });
    res.status(500).send("Internal server error during authentication. Please try again.");
  }
});

// ─── Lofty OAuth routes ───

// Step 1: Start Lofty OAuth flow — persist MCP state, redirect to Lofty
app.get("/oauth/start", rateLimiter("oauth-start", 10, 300), async (req, res) => {
  res.on("finish", () => {
    logger.info("Request completed", {
      ...logger.fromReq(req),
      statusCode: res.statusCode,
      durationMs: req.startTime ? Date.now() - req.startTime : undefined,
    });
  });
  try {
    const { client_id, redirect_uri, code_challenge, state } = req.query as Record<string, string>;
    const loftyOAuthClientId = process.env.LOFTY_OAUTH_CLIENT_ID;

    if (!loftyOAuthClientId) {
      res.status(500).send("Lofty OAuth is not configured on this server.");
      return;
    }

    if (!client_id || !redirect_uri || !code_challenge) {
      res.status(400).send("Missing required OAuth parameters.");
      return;
    }

    // Save MCP OAuth state so we can recover it after Lofty redirects back
    const sessionId = randomUUID();
    await saveOAuthSession(sessionId, {
      clientId: client_id,
      redirectUri: redirect_uri,
      codeChallenge: code_challenge,
      state,
    });

    // Redirect to Lofty OAuth authorization
    const loftyAuthUrl = new URL("https://crm.lofty.com/page/vendor-auth.html");
    loftyAuthUrl.searchParams.set("clientId", loftyOAuthClientId);
    loftyAuthUrl.searchParams.set("response_type", "code");
    loftyAuthUrl.searchParams.set("redirect_uri", `${serverUrl}/oauth/callback`);
    loftyAuthUrl.searchParams.set("state", sessionId);

    res.redirect(302, loftyAuthUrl.toString());
  } catch (err) {
    logger.error("OAuth start error", { ...logger.fromReq(req), error: String(err) });
    res.status(500).send("Internal server error. Please try again.");
  }
});

// Step 2: Lofty redirects back here with auth code — exchange for tokens, complete MCP flow
app.get("/oauth/callback", rateLimiter("oauth-callback", 10, 300), async (req, res) => {
  res.on("finish", () => {
    logger.info("Request completed", {
      ...logger.fromReq(req),
      statusCode: res.statusCode,
      durationMs: req.startTime ? Date.now() - req.startTime : undefined,
    });
  });
  try {
    const { code: loftyCode, state: sessionId } = req.query as Record<string, string>;

    // Handle missing code (denial or error)
    if (!loftyCode) {
      res.status(400).send(`<!DOCTYPE html>
<html><head><title>Authorization Denied</title>
<style>body{font-family:-apple-system,sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#f5f5f5;}
.card{background:white;border-radius:12px;box-shadow:0 2px 10px rgba(0,0,0,0.1);padding:40px;max-width:440px;text-align:center;}
h1{color:#c00;margin-bottom:12px;} p{color:#666;}</style></head>
<body><div class="card"><h1>Authorization Denied</h1>
<p>You declined to authorize this application in Lofty. You can close this window and try again.</p></div></body></html>`);
      return;
    }

    if (!sessionId) {
      res.status(400).send("Missing session state parameter.");
      return;
    }

    // Recover MCP OAuth state from Redis
    const mcpSession = await getOAuthSession(sessionId);
    if (!mcpSession) {
      res.status(400).send("OAuth session expired or invalid. Please try connecting again.");
      return;
    }
    await deleteOAuthSession(sessionId);

    const loftyOAuthClientId = process.env.LOFTY_OAUTH_CLIENT_ID;
    const loftyOAuthClientSecret = process.env.LOFTY_OAUTH_CLIENT_SECRET;
    if (!loftyOAuthClientId || !loftyOAuthClientSecret) {
      res.status(500).send("Lofty OAuth is not configured on this server.");
      return;
    }

    // Exchange Lofty auth code for Lofty tokens
    const basicAuth = Buffer.from(`${loftyOAuthClientId}:${loftyOAuthClientSecret}`).toString("base64");
    const tokenBody = new URLSearchParams({
      grant_type: "authorization_code",
      code: loftyCode,
      redirect_uri: `${serverUrl}/oauth/callback`,
      client_id: loftyOAuthClientId,
    });
    const tokenRes = await fetch("https://crm.lofty.com/api/user-web/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${basicAuth}`,
      },
      body: tokenBody.toString(),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      logger.error("Upstream token exchange failed", { ...logger.fromReq(req), statusCode: tokenRes.status, error: errText });
      res.status(500).send("Failed to exchange authorization code with Lofty. Please try again.");
      return;
    }

    const loftyTokens = (await tokenRes.json()) as {
      access_token: string;
      refresh_token: string;
      expires_in: number;
    };

    // Verify the token works by calling /v1.0/me
    const meRes = await fetch("https://api.lofty.com/v1.0/me", {
      headers: {
        Authorization: `Bearer ${loftyTokens.access_token}`,
        Accept: "application/json",
      },
    });

    if (!meRes.ok) {
      logger.error("Lofty /me check failed", { ...logger.fromReq(req), statusCode: meRes.status });
      res.status(500).send("Failed to verify Lofty authorization. Please try again.");
      return;
    }

    // Encrypt Lofty tokens and generate MCP auth code
    const loftyTokenData = {
      accessToken: loftyTokens.access_token,
      refreshToken: loftyTokens.refresh_token,
      expiresAt: Math.floor(Date.now() / 1000) + loftyTokens.expires_in,
    };
    const encryptedLoftyTokens = encrypt(JSON.stringify(loftyTokenData));
    const mcpCode = generateAuthCode();

    await saveAuthCode(mcpCode, {
      clientId: mcpSession.clientId,
      redirectUri: mcpSession.redirectUri,
      codeChallenge: mcpSession.codeChallenge,
      encryptedApiKey: "", // Not used for OAuth flow
      encryptedLoftyTokens,
      authType: "oauth",
      state: mcpSession.state,
    });

    // Redirect back to Claude's redirect_uri with MCP auth code
    const redirectUrl = new URL(mcpSession.redirectUri);
    redirectUrl.searchParams.set("code", mcpCode);
    if (mcpSession.state) redirectUrl.searchParams.set("state", mcpSession.state);

    res.redirect(302, redirectUrl.toString());
  } catch (err) {
    logger.error("OAuth callback error", { ...logger.fromReq(req), error: String(err) });
    res.status(500).send("Internal server error during OAuth callback. Please try again.");
  }
});

// Bearer auth middleware for MCP endpoint
const bearerAuth = requireBearerAuth({ verifier: provider });

// MCP endpoint — stateless: new transport + server per request
app.all("/mcp", bearerAuth, async (req, res) => {
  res.on("finish", () => {
    logger.info("Request completed", {
      ...logger.fromReq(req),
      statusCode: res.statusCode,
      durationMs: req.startTime ? Date.now() - req.startTime : undefined,
    });
  });
  try {
    const server = createMcpServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined, // stateless
    });

    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);

    res.on("close", () => {
      transport.close().catch(() => {});
      server.close().catch(() => {});
    });
  } catch (err) {
    logger.error("MCP request error", { ...logger.fromReq(req), error: String(err) });
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

// Landing page
app.get("/", (_req, res) => {
  res.setHeader("Content-Type", "text/html");
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Lofty CRM MCP Server</title>
  <link rel="icon" type="image/png" href="/favicon.png" />
  <link rel="apple-touch-icon" href="/favicon.png" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f5f5f5;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 20px;
    }
    .card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      padding: 40px;
      max-width: 540px;
      width: 100%;
    }
    h1 { font-size: 24px; margin-bottom: 8px; color: #1a1a1a; }
    .subtitle { color: #666; margin-bottom: 24px; font-size: 15px; line-height: 1.6; }
    .status { display: inline-block; background: #e6f4ea; color: #1e7e34; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 600; margin-bottom: 20px; }
    h2 { font-size: 16px; margin-bottom: 12px; color: #333; }
    ol { padding-left: 20px; margin-bottom: 24px; }
    li { margin-bottom: 10px; font-size: 14px; color: #555; line-height: 1.5; }
    code { background: #f0f0f0; padding: 2px 6px; border-radius: 4px; font-size: 13px; }
    .footer { font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 16px; }
    a { color: #4a90d9; }
  </style>
</head>
<body>
  <div class="card">
    <div style="display: flex; align-items: center; justify-content: center; gap: 16px; margin-bottom: 24px;">
      <img src="/logo.svg" alt="AiM Marketing Academy" style="height: 44px;" />
      <span style="font-size: 22px; color: #bbb; font-weight: 300;">&times;</span>
      <img src="/product-logo.svg" alt="Lofty CRM" style="height: 32px;" />
    </div>
    <span class="status">Online</span>
    <h1>Lofty CRM MCP Server</h1>
    <p class="subtitle">This is a Model Context Protocol (MCP) server that connects Claude to your Lofty CRM account. It provides 90+ tools for managing leads, tasks, transactions, communications, and more.</p>
    <h2>Connect with Claude Desktop</h2>
    <ol>
      <li>Open <strong>Claude Desktop</strong> &rarr; Settings &rarr; MCP Servers</li>
      <li>Click <strong>Add Custom Connector</strong></li>
      <li>Enter the server URL: <code>${serverUrl}/mcp</code></li>
      <li>Complete the OAuth flow by <strong>signing in with Lofty</strong> or entering your <strong>Lofty API key</strong></li>
    </ol>
    <div class="footer">
      <a href="https://developer.lofty.com" target="_blank">Lofty API Documentation</a>
    </div>
  </div>
</body>
</html>`);
});

// Default export for Vercel serverless runtime
export default app;

// Named export for local usage
export { app };

// Start server when run directly (not imported by Vercel)
const port = process.env.PORT || 3000;
if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
  app.listen(port, () => {
    logger.info("Server started", { port: Number(port) });
  });
}

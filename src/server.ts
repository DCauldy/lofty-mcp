import express from "express";
import cors from "cors";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { mcpAuthRouter } from "@modelcontextprotocol/sdk/server/auth/router.js";
import { requireBearerAuth } from "@modelcontextprotocol/sdk/server/auth/middleware/bearerAuth.js";

import { LoftyOAuthProvider } from "./auth/provider.js";
import { encrypt } from "./auth/crypto.js";
import { saveAuthCode, generateAuthCode } from "./auth/store.js";
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

/**
 * Creates a fresh McpServer instance with all tools registered.
 * Called per-request because Vercel serverless functions are ephemeral.
 */
function createMcpServer(): McpServer {
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
app.use(cors());

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", server: "lofty-mcp" });
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
app.post("/auth/callback", express.urlencoded({ extended: false }), async (req, res) => {
  try {
    const { apiKey, client_id, redirect_uri, code_challenge, state } = req.body;

    if (!apiKey || !client_id || !redirect_uri || !code_challenge) {
      res.status(400).send(
        getAuthorizePage(client_id || "", redirect_uri || "", state, code_challenge || "", "All fields are required.")
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
      state,
    });

    // Redirect back to Claude with the authorization code
    const redirectUrl = new URL(redirect_uri);
    redirectUrl.searchParams.set("code", code);
    if (state) redirectUrl.searchParams.set("state", state);

    res.redirect(302, redirectUrl.toString());
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Auth callback error:", message, err);
    res.status(500).send(`Internal server error during authentication: ${message}`);
  }
});

// Bearer auth middleware for MCP endpoint
const bearerAuth = requireBearerAuth({ verifier: provider });

// MCP endpoint — stateless: new transport + server per request
app.all("/mcp", bearerAuth, async (req, res) => {
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
    console.error("MCP error:", err);
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
    <span class="status">Online</span>
    <h1>Lofty CRM MCP Server</h1>
    <p class="subtitle">This is a Model Context Protocol (MCP) server that connects Claude to your Lofty CRM account. It provides 90+ tools for managing leads, tasks, transactions, communications, and more.</p>
    <h2>Connect with Claude Desktop</h2>
    <ol>
      <li>Open <strong>Claude Desktop</strong> &rarr; Settings &rarr; MCP Servers</li>
      <li>Click <strong>Add Custom Connector</strong></li>
      <li>Enter the server URL: <code>${serverUrl}/mcp</code></li>
      <li>Complete the OAuth flow by entering your <strong>Lofty API key</strong></li>
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
    console.error(`Lofty MCP Server listening on port ${port}`);
  });
}

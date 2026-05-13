#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

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

const server = new McpServer({
  name: "lofty",
  version: "1.0.0",
});

// Register all tool modules
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

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Lofty MCP Server running on stdio");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { loftyRequest, success, error, getApiKeyFromAuth } from "../client.js";

export function registerWebhooksTools(server: McpServer) {
  server.tool(
    "lofty_list_webhooks",
    "List configured webhooks in Lofty CRM.",
    {},
    async (_params, extra) => {
      try {
        const apiKey = getApiKeyFromAuth(extra.authInfo);
        const data = await loftyRequest({
          path: "/v1.0/webhooks",
          apiKey,
        });
        return success(data);
      } catch (e) {
        return error(e);
      }
    }
  );

  server.tool(
    "lofty_create_webhook",
    "Create a webhook subscription in Lofty CRM.",
    {
      listId: z.number().describe("Event type: 1=AgentInfo, 2=LeadInfo, 3=Activity, 4=Alerts, 5=Transactions, 6=Communication, 7=Notes, 8=Tasks, 9=Appointments, 10=PipelineChanges, 11=LeadAssignment, 12=LeadCreation"),
      callbackUrl: z.string().describe("HTTPS callback URL to receive event payloads"),
      limit: z.number().optional().describe("Max events per callback batch (default 100, max 5000)"),
    },
    async (params, extra) => {
      try {
        const apiKey = getApiKeyFromAuth(extra.authInfo);
        const data = await loftyRequest({
          method: "POST",
          path: "/v1.0/webhook",
          body: params,
          apiKey,
        });
        return success(data);
      } catch (e) {
        return error(e);
      }
    }
  );

  server.tool(
    "lofty_delete_webhook",
    "Delete a webhook subscription in Lofty CRM.",
    {
      subscribeId: z.number().describe("The webhook subscription ID to delete"),
    },
    async (_params, _extra) => {
      return error(new Error(
        "Delete operations are disabled on this MCP server for safety. Please delete this webhook directly in Lofty CRM."
      ));
    }
  );
}

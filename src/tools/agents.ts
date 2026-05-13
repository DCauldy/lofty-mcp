import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { loftyRequest, success, error, getApiKeyFromAuth } from "../client.js";

export function registerAgentsTools(server: McpServer) {
  server.tool(
    "lofty_add_agent",
    "Create a new agent in Lofty CRM.",
    {
      accountType: z.number().describe("Account type of the agent"),
      accountInfo: z.object({
        email: z.string().optional().describe("Agent email"),
        firstName: z.string().optional().describe("First name"),
        lastName: z.string().optional().describe("Last name"),
        phone: z.string().optional().describe("Phone number"),
      }).describe("Account information"),
      hasBackOffice: z.boolean().optional().describe("Whether agent has back office access"),
    },
    async (params, extra) => {
      try {
        const apiKey = getApiKeyFromAuth(extra.authInfo);
        const data = await loftyRequest({
          method: "POST",
          path: "/v1.0/agent/profile/add",
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
    "lofty_add_agent_tag",
    "Add tags to an agent in Lofty CRM.",
    {
      agentId: z.number().describe("User ID of the agent to tag"),
      tagNames: z.array(z.string()).optional().describe("Tag names to add (up to 20 per call)"),
      autoCreate: z.boolean().optional().describe("When true, unknown tag names are created automatically"),
    },
    async ({ agentId, ...body }, extra) => {
      try {
        const apiKey = getApiKeyFromAuth(extra.authInfo);
        const data = await loftyRequest({
          method: "POST",
          path: `/v1.0/agent/${agentId}/tag/add`,
          body,
          apiKey,
        });
        return success(data);
      } catch (e) {
        return error(e);
      }
    }
  );
}

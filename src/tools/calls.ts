import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { loftyRequest, success, error, getApiKeyFromAuth } from "../client.js";

export function registerCallsTools(server: McpServer) {
  server.tool(
    "lofty_list_calls",
    "List calls for a lead in Lofty CRM.",
    {
      leadId: z.number().describe("ID of the lead whose calls to return"),
      offset: z.number().optional().describe("Pagination offset"),
      limit: z.number().optional().describe("Number of results (default 10)"),
    },
    async (params, extra) => {
      try {
        const apiKey = getApiKeyFromAuth(extra.authInfo);
        const data = await loftyRequest({
          path: "/v1.0/calls",
          params: params as Record<string, string | number | boolean | undefined>,
          apiKey,
        });
        return success(data);
      } catch (e) {
        return error(e);
      }
    }
  );

  server.tool(
    "lofty_get_call",
    "Get a single call by ID from Lofty CRM.",
    {
      callId: z.number().describe("The call ID"),
    },
    async ({ callId }, extra) => {
      try {
        const apiKey = getApiKeyFromAuth(extra.authInfo);
        const data = await loftyRequest({
          path: `/v1.0/calls/${callId}`,
          apiKey,
        });
        return success(data);
      } catch (e) {
        return error(e);
      }
    }
  );

  server.tool(
    "lofty_get_call_recording_url",
    "Get the recording URL for a call in Lofty CRM.",
    {
      callId: z.number().describe("The call ID"),
    },
    async ({ callId }, extra) => {
      try {
        const apiKey = getApiKeyFromAuth(extra.authInfo);
        const data = await loftyRequest({
          path: `/v1.0/call/url/${callId}`,
          apiKey,
        });
        return success(data);
      } catch (e) {
        return error(e);
      }
    }
  );
}

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { loftyRequest, success, error, getApiKeyFromAuth } from "../client.js";

export function registerSystemLogsTools(server: McpServer) {
  server.tool(
    "lofty_list_system_logs",
    "List system logs for a lead in Lofty CRM.",
    {
      leadId: z.number().describe("ID of the lead"),
      startTime: z.number().optional().describe("Inclusive lower bound (ms since epoch, UTC)"),
      endTime: z.number().optional().describe("Inclusive upper bound (ms since epoch, UTC)"),
      pageNumber: z.number().optional().describe("Page index (0-based)"),
      pageSize: z.number().optional().describe("Entries per page (default 100)"),
    },
    async (params, extra) => {
      try {
        const apiKey = getApiKeyFromAuth(extra.authInfo);
        const data = await loftyRequest({
          path: "/v1.0/systemLogs",
          params: params as Record<string, string | number | boolean | undefined>,
          apiKey,
        });
        return success(data);
      } catch (e) {
        return error(e);
      }
    }
  );
}

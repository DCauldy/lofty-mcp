import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { loftyRequest, success, error, getApiKeyFromAuth } from "../client.js";

export function registerIdentityTools(server: McpServer) {
  server.tool(
    "lofty_get_vendor_info",
    "Get vendor/API identity information from Lofty CRM.",
    {},
    async (_params, extra) => {
      try {
        const apiKey = getApiKeyFromAuth(extra.authInfo);
        const data = await loftyRequest({
          path: "/v1.0/vendor/list",
          apiKey,
        });
        return success(data);
      } catch (e) {
        return error(e);
      }
    }
  );
}

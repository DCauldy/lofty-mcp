import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { loftyRequest, success, error, getLoftyAuthOptions } from "../client.js";

export function registerMembersTools(server: McpServer) {
  server.tool(
    "lofty_list_members",
    "List team members in Lofty CRM.",
    {
      groupIds: z.string().optional().describe("Office/group IDs to filter by (comma-separated)"),
      offset: z.number().optional().describe("Pagination offset"),
      limit: z.number().optional().describe("Results per page (default 25)"),
    },
    async (params, extra) => {
      try {
        const authOpts = getLoftyAuthOptions(extra.authInfo);
        const data = await loftyRequest({
          path: "/v1.0/members",
          params: params as Record<string, string | number | boolean | undefined>,
          ...authOpts,
        });
        return success(data);
      } catch (e) {
        return error(e);
      }
    }
  );

  server.tool(
    "lofty_get_member_by_id",
    "Get a team member by user ID from Lofty CRM.",
    {
      userId: z.number().describe("User ID of the team member"),
    },
    async ({ userId }, extra) => {
      try {
        const authOpts = getLoftyAuthOptions(extra.authInfo);
        const data = await loftyRequest({
          path: `/v1.0/users/${userId}`,
          ...authOpts,
        });
        return success(data);
      } catch (e) {
        return error(e);
      }
    }
  );

  server.tool(
    "lofty_get_member_by_account",
    "Get a team member by their login email from Lofty CRM.",
    {
      account: z.string().describe("Login email of the team member"),
    },
    async ({ account }, extra) => {
      try {
        const authOpts = getLoftyAuthOptions(extra.authInfo);
        const data = await loftyRequest({
          path: `/v1.0/members/${account}`,
          ...authOpts,
        });
        return success(data);
      } catch (e) {
        return error(e);
      }
    }
  );

  server.tool(
    "lofty_get_me",
    "Get the current user's profile from Lofty CRM.",
    {},
    async (_params, extra) => {
      try {
        const authOpts = getLoftyAuthOptions(extra.authInfo);
        const data = await loftyRequest({
          path: "/v1.0/me",
          ...authOpts,
        });
        return success(data);
      } catch (e) {
        return error(e);
      }
    }
  );
}

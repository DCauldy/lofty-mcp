import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { loftyRequest, success, error, getLoftyAuthOptions } from "../client.js";
import { readOnly, updateOp } from "../annotations.js";

export function registerRoutingTools(server: McpServer) {
  server.tool(
    "lofty_list_routing_members",
    "List members available for lead assignment in Lofty CRM.",
    {
      type: z.number().describe("Routing business type: 1=AGENT_LEAD, 2=LENDING_LEAD, 4=ASSISTANT_LEAD"),
      roleId: z.number().optional().describe("Role ID (required when type=4)"),
    },
    readOnly,
    async ({ type, roleId }, extra) => {
      try {
        const authOpts = getLoftyAuthOptions(extra.authInfo);
        const data = await loftyRequest({
          path: `/v1.0/routing/member/list/${type}`,
          params: roleId !== undefined ? { roleId } : undefined,
          ...authOpts,
        });
        return success(data);
      } catch (e) {
        return error(e);
      }
    }
  );

  server.tool(
    "lofty_list_routing_roles",
    "List assign roles for lead routing in Lofty CRM.",
    {},
    readOnly,
    async (_params, extra) => {
      try {
        const authOpts = getLoftyAuthOptions(extra.authInfo);
        const data = await loftyRequest({
          path: "/v1.0/routing/role/list",
          ...authOpts,
        });
        return success(data);
      } catch (e) {
        return error(e);
      }
    }
  );

  server.tool(
    "lofty_list_routing_rules",
    "List lead routing rules in Lofty CRM.",
    {
      type: z.number().describe("Routing business type: 1=AGENT_LEAD, 2=LENDING_LEAD, 4=ASSISTANT_LEAD"),
      roleId: z.number().optional().describe("Role ID (required when type=4)"),
    },
    readOnly,
    async ({ type, roleId }, extra) => {
      try {
        const authOpts = getLoftyAuthOptions(extra.authInfo);
        const data = await loftyRequest({
          path: `/v1.0/routing/rule/list/${type}`,
          params: roleId !== undefined ? { roleId } : undefined,
          ...authOpts,
        });
        return success(data);
      } catch (e) {
        return error(e);
      }
    }
  );

  server.tool(
    "lofty_get_supplement_rule",
    "Get the default (supplement) routing rule in Lofty CRM.",
    {
      type: z.number().describe("Routing business type: 1, 2, or 4"),
      roleId: z.number().optional().describe("Role ID (required when type=4)"),
    },
    readOnly,
    async ({ type, roleId }, extra) => {
      try {
        const authOpts = getLoftyAuthOptions(extra.authInfo);
        const data = await loftyRequest({
          path: `/v1.0/routing/rule/supplement/${type}`,
          params: roleId !== undefined ? { roleId } : undefined,
          ...authOpts,
        });
        return success(data);
      } catch (e) {
        return error(e);
      }
    }
  );

  server.tool(
    "lofty_update_supplement_rule",
    "Update the default (supplement) routing rule in Lofty CRM.",
    {
      type: z.number().describe("Routing business type: 1, 2, or 4"),
      roleId: z.number().optional().describe("Role ID (required when type=4)"),
      strategyType: z.number().optional().describe("Strategy type"),
      touchMinutes: z.number().optional().describe("Touch minutes (for next-up and blast alert)"),
      assigneeAgentId: z.number().optional().describe("Default assignee agent ID"),
      assigneeGroupId: z.number().optional().describe("Default assignee group ID"),
    },
    updateOp,
    async ({ type, ...body }, extra) => {
      try {
        const authOpts = getLoftyAuthOptions(extra.authInfo);
        const data = await loftyRequest({
          method: "PUT",
          path: `/v1.0/routing/rule/supplement/${type}`,
          body,
          ...authOpts,
        });
        return success(data);
      } catch (e) {
        return error(e);
      }
    }
  );
}

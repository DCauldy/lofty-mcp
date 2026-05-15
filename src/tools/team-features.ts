import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { loftyRequest, success, error, getLoftyAuthOptions } from "../client.js";

export function registerTeamFeaturesTools(server: McpServer) {
  server.tool(
    "lofty_list_tags",
    "List all tags configured for the team in Lofty CRM.",
    {},
    async (_params, extra) => {
      try {
        const authOpts = getLoftyAuthOptions(extra.authInfo);
        const data = await loftyRequest({
          path: "/v1.0/teamFeatures/listTag",
          ...authOpts,
        });
        return success(data);
      } catch (e) {
        return error(e);
      }
    }
  );

  server.tool(
    "lofty_list_custom_fields",
    "List all custom fields configured for the team in Lofty CRM.",
    {},
    async (_params, extra) => {
      try {
        const authOpts = getLoftyAuthOptions(extra.authInfo);
        const data = await loftyRequest({
          path: "/v1.0/teamFeatures/listCustomField",
          ...authOpts,
        });
        return success(data);
      } catch (e) {
        return error(e);
      }
    }
  );

  server.tool(
    "lofty_add_custom_field",
    "Add a custom field to the team in Lofty CRM.",
    {
      attributeName: z.string().describe("Name of the custom field"),
      attributeType: z.string().describe("Type of the field"),
      value: z.string().describe("Content/value for the field. For multi-select use JSON array format."),
      params: z.string().optional().describe("Options for select fields (JSON format: {\"option\":[\"item1\",\"item2\"]})"),
    },
    async (params, extra) => {
      try {
        const authOpts = getLoftyAuthOptions(extra.authInfo);
        const data = await loftyRequest({
          method: "POST",
          path: "/v1.0/teamFeatures/custom-field",
          body: params,
          ...authOpts,
        });
        return success(data);
      } catch (e) {
        return error(e);
      }
    }
  );

  server.tool(
    "lofty_list_lead_ponds",
    "List all lead ponds configured for the team in Lofty CRM.",
    {},
    async (_params, extra) => {
      try {
        const authOpts = getLoftyAuthOptions(extra.authInfo);
        const data = await loftyRequest({
          path: "/v1.0/team-features/lead-ponds",
          ...authOpts,
        });
        return success(data);
      } catch (e) {
        return error(e);
      }
    }
  );

  server.tool(
    "lofty_get_lead_pond",
    "Get a specific lead pond by ID from Lofty CRM.",
    {
      id: z.number().describe("Lead pond ID"),
    },
    async ({ id }, extra) => {
      try {
        const authOpts = getLoftyAuthOptions(extra.authInfo);
        const data = await loftyRequest({
          path: `/v1.0/team-features/lead-pond/${id}`,
          ...authOpts,
        });
        return success(data);
      } catch (e) {
        return error(e);
      }
    }
  );
}

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { loftyRequest, success, error, getApiKeyFromAuth } from "../client.js";

export function registerOrganizationTools(server: McpServer) {
  server.tool(
    "lofty_get_organization",
    "Get organization information from Lofty CRM.",
    {},
    async (_params, extra) => {
      try {
        const apiKey = getApiKeyFromAuth(extra.authInfo);
        const data = await loftyRequest({
          path: "/v1.0/org",
          apiKey,
        });
        return success(data);
      } catch (e) {
        return error(e);
      }
    }
  );

  server.tool(
    "lofty_update_company",
    "Update company information in Lofty CRM.",
    {
      name: z.string().optional().describe("Company name"),
      phone: z.string().optional().describe("Primary phone (digits only)"),
      email: z.string().optional().describe("Primary contact email"),
      city: z.string().optional().describe("City"),
      state: z.string().optional().describe("State"),
      zipcode: z.string().optional().describe("ZIP code"),
      streetAddress: z.string().optional().describe("Street address"),
    },
    async (params, extra) => {
      try {
        const apiKey = getApiKeyFromAuth(extra.authInfo);
        const data = await loftyRequest({
          method: "POST",
          path: "/v1.0/org/company",
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
    "lofty_add_office",
    "Add a new office to the organization in Lofty CRM.",
    {
      name: z.string().optional().describe("Office name"),
      parentId: z.number().optional().describe("Parent office ID (0 for top-level)"),
      phone: z.string().optional().describe("Office phone (digits only)"),
      email: z.string().optional().describe("Office contact email"),
      city: z.string().optional().describe("City"),
      state: z.string().optional().describe("State"),
      zipcode: z.string().optional().describe("ZIP code"),
      streetAddress: z.string().optional().describe("Street address"),
      allowManageSub: z.boolean().optional().describe("Whether members can manage sub-offices"),
    },
    async (params, extra) => {
      try {
        const apiKey = getApiKeyFromAuth(extra.authInfo);
        const data = await loftyRequest({
          method: "PUT",
          path: "/v1.0/org/office",
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
    "lofty_update_office",
    "Update an existing office in Lofty CRM.",
    {
      id: z.number().describe("Office ID to update"),
      name: z.string().optional().describe("Office name"),
      parentId: z.number().optional().describe("Parent office ID"),
      phone: z.string().optional().describe("Office phone"),
      email: z.string().optional().describe("Office email"),
      city: z.string().optional().describe("City"),
      state: z.string().optional().describe("State"),
      zipcode: z.string().optional().describe("ZIP code"),
      streetAddress: z.string().optional().describe("Street address"),
      allowManageSub: z.boolean().optional().describe("Allow sub-office management"),
    },
    async (params, extra) => {
      try {
        const apiKey = getApiKeyFromAuth(extra.authInfo);
        const data = await loftyRequest({
          method: "POST",
          path: "/v1.0/org/office",
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
    "lofty_list_permission_profiles",
    "List permission profiles for the organization in Lofty CRM.",
    {},
    async (_params, extra) => {
      try {
        const apiKey = getApiKeyFromAuth(extra.authInfo);
        const data = await loftyRequest({
          path: "/v1.0/org/permission/profiles",
          apiKey,
        });
        return success(data);
      } catch (e) {
        return error(e);
      }
    }
  );
}

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { loftyRequest, success, error, getApiKeyFromAuth } from "../client.js";

export function registerTransactionsTools(server: McpServer) {
  server.tool(
    "lofty_list_transactions",
    "List transactions for a lead in Lofty CRM.",
    {
      leadId: z.number().describe("Lead ID whose transactions to return"),
    },
    async ({ leadId }, extra) => {
      try {
        const apiKey = getApiKeyFromAuth(extra.authInfo);
        const data = await loftyRequest({
          path: `/v1.0/leads/${leadId}/transactions`,
          apiKey,
        });
        return success(data);
      } catch (e) {
        return error(e);
      }
    }
  );

  server.tool(
    "lofty_get_transaction",
    "Get a single transaction by ID from Lofty CRM.",
    {
      leadId: z.number().describe("Lead ID"),
      transactionId: z.number().describe("Transaction ID"),
    },
    async ({ leadId, transactionId }, extra) => {
      try {
        const apiKey = getApiKeyFromAuth(extra.authInfo);
        const data = await loftyRequest({
          path: `/v1.0/leads/${leadId}/transaction/${transactionId}`,
          apiKey,
        });
        return success(data);
      } catch (e) {
        return error(e);
      }
    }
  );

  server.tool(
    "lofty_create_transaction",
    "Create a new transaction for a lead in Lofty CRM.",
    {
      leadId: z.number().describe("Lead ID"),
      transactionName: z.string().describe("Property address or deal name"),
      transactionType: z.enum(["Purchase", "Listing", "Lease", "Other"]).optional().describe("Transaction type"),
      homePrice: z.number().optional().describe("Home price"),
      transactionStatus: z.string().optional().describe("Status name (must match team's pipeline config)"),
      expectedCloseDate: z.number().optional().describe("Expected close date (ms since epoch)"),
      closeDate: z.number().optional().describe("Actual close date (ms since epoch)"),
      commissionRate: z.number().optional().describe("Commission rate as percentage (e.g. 3 for 3%)"),
      gci: z.number().optional().describe("Gross Commission Income"),
      teamRevenue: z.number().optional().describe("Team's portion of GCI"),
      agentRevenue: z.number().optional().describe("Agent's portion of GCI"),
    },
    async ({ leadId, ...body }, extra) => {
      try {
        const apiKey = getApiKeyFromAuth(extra.authInfo);
        const data = await loftyRequest({
          method: "POST",
          path: `/v1.0/leads/${leadId}/transaction`,
          body,
          apiKey,
        });
        return success(data);
      } catch (e) {
        return error(e);
      }
    }
  );

  server.tool(
    "lofty_update_transaction",
    "Update an existing transaction in Lofty CRM.",
    {
      leadId: z.number().describe("Lead ID"),
      transactionId: z.number().describe("Transaction ID"),
      transactionName: z.string().describe("Property address or deal name"),
      transactionType: z.enum(["Purchase", "Listing", "Lease", "Other"]).optional().describe("Transaction type"),
      homePrice: z.number().optional().describe("Home price"),
      transactionStatus: z.string().optional().describe("Status name"),
      expectedCloseDate: z.number().optional().describe("Expected close date (ms since epoch)"),
      closeDate: z.number().optional().describe("Actual close date (ms since epoch)"),
      commissionRate: z.number().optional().describe("Commission rate"),
      gci: z.number().optional().describe("GCI"),
    },
    async ({ leadId, transactionId, ...body }, extra) => {
      try {
        const apiKey = getApiKeyFromAuth(extra.authInfo);
        const data = await loftyRequest({
          method: "PUT",
          path: `/v1.0/leads/${leadId}/transaction/${transactionId}`,
          body,
          apiKey,
        });
        return success(data);
      } catch (e) {
        return error(e);
      }
    }
  );

  server.tool(
    "lofty_get_transaction_property_address",
    "Get the property address for a transaction in Lofty CRM.",
    {
      leadId: z.number().describe("Lead ID"),
      transactionId: z.number().describe("Transaction ID"),
    },
    async ({ leadId, transactionId }, extra) => {
      try {
        const apiKey = getApiKeyFromAuth(extra.authInfo);
        const data = await loftyRequest({
          path: `/v1.0/leads/${leadId}/transaction/${transactionId}/property/address`,
          apiKey,
        });
        return success(data);
      } catch (e) {
        return error(e);
      }
    }
  );

  server.tool(
    "lofty_update_transaction_property_address",
    "Update the property address for a transaction in Lofty CRM.",
    {
      leadId: z.number().describe("Lead ID"),
      transactionId: z.number().describe("Transaction ID"),
      streetAddress: z.string().optional().describe("Street address"),
      city: z.string().optional().describe("City"),
      state: z.string().optional().describe("State"),
      zipCode: z.string().optional().describe("ZIP code"),
      county: z.string().optional().describe("County"),
      unit: z.string().optional().describe("Unit/apartment number"),
      label: z.string().optional().describe("Address label"),
    },
    async ({ leadId, transactionId, ...body }, extra) => {
      try {
        const apiKey = getApiKeyFromAuth(extra.authInfo);
        const data = await loftyRequest({
          method: "POST",
          path: `/v1.0/leads/${leadId}/transaction/property/address`,
          body: { transactionId, ...body },
          apiKey,
        });
        return success(data);
      } catch (e) {
        return error(e);
      }
    }
  );

  server.tool(
    "lofty_search_transactions",
    "Search transactions in Lofty CRM (V2 API).",
    {
      queryKey: z.string().optional().describe("Search keyword (fuzzy match on name, first 15 chars)"),
      leadId: z.number().optional().describe("Filter by lead ID"),
      pageSize: z.number().optional().describe("Page size (1-100, default 20)"),
      pageNum: z.number().optional().describe("Page number (0-based)"),
    },
    async (params, extra) => {
      try {
        const apiKey = getApiKeyFromAuth(extra.authInfo);
        const data = await loftyRequest({
          path: "/v2.0/transactions",
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
    "lofty_list_transaction_custom_fields",
    "List transaction custom fields configured for the team in Lofty CRM.",
    {},
    async (_params, extra) => {
      try {
        const apiKey = getApiKeyFromAuth(extra.authInfo);
        const data = await loftyRequest({
          path: "/v1.0/transaction/customfields",
          apiKey,
        });
        return success(data);
      } catch (e) {
        return error(e);
      }
    }
  );
}

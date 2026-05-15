import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { loftyRequest, success, error, getLoftyAuthOptions } from "../client.js";

export function registerListingsTools(server: McpServer) {
  server.tool(
    "lofty_get_published_listings",
    "Get published listings from Lofty CRM.",
    {
      type: z.enum(["LuxVT", "AptCom", "AllOnMarket"]).describe("Feed variant to emit"),
    },
    async (params, extra) => {
      try {
        const authOpts = getLoftyAuthOptions(extra.authInfo);
        const data = await loftyRequest({
          path: "/v1.0/getPublishedListings",
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
    "lofty_get_listings_by_user",
    "Search listings by agent or office in Lofty CRM.",
    {
      userId: z.number().optional().describe("Agent user ID"),
      listingId: z.string().optional().describe("Specific listing ID"),
      street: z.string().optional().describe("Street address filter"),
      limit: z.number().optional().describe("Results per page (default 25)"),
      officeListings: z.boolean().optional().describe("Include office listings"),
      agentListings: z.boolean().optional().describe("Include agent listings"),
      nextPageKey: z.string().optional().describe("Pagination key for next page"),
    },
    async (params, extra) => {
      try {
        const authOpts = getLoftyAuthOptions(extra.authInfo);
        const data = await loftyRequest({
          path: "/v1.0/listing",
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
    "lofty_search_listings",
    "Search listings with advanced filters in Lofty CRM (V2 API).",
    {
      searchScope: z.enum(["my", "office", "all"]).optional().describe("Search scope: my, office, or all listings"),
      soldFlag: z.boolean().optional().describe("Search sold listings (default false)"),
      filterConditions: z.record(z.unknown()).optional().describe("Advanced filter conditions (location, price range, beds, baths, sqft, etc.)"),
      sortFields: z.array(z.string()).optional().describe("Sort fields: MLS_LIST_DATE_L_DESC, PRICE_DESC, PRICE_ASC, BEDROOMS_DESC, etc."),
      pageNum: z.number().optional().describe("Page number (starting from 1)"),
      pageSize: z.number().optional().describe("Page size (1-100, default 25)"),
    },
    async (params, extra) => {
      try {
        const authOpts = getLoftyAuthOptions(extra.authInfo);
        const data = await loftyRequest({
          method: "POST",
          path: "/v2.0/listings/search",
          body: params,
          ...authOpts,
        });
        return success(data);
      } catch (e) {
        return error(e);
      }
    }
  );
}

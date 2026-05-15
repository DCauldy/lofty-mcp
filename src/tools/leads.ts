import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { loftyRequest, success, error, getLoftyAuthOptions } from "../client.js";

export function registerLeadsTools(server: McpServer) {
  server.tool(
    "lofty_list_leads",
    "List leads in Lofty CRM with optional filters. Returns paginated results.",
    {
      stage: z.string().optional().describe("Filter by pipeline stage name"),
      source: z.string().optional().describe("Filter by lead source name"),
      phone: z.string().optional().describe("Precise search by phone number"),
      email: z.string().optional().describe("Precise search by email address"),
      assignedUserId: z.number().optional().describe("Filter by assigned agent user ID"),
      contacted: z.boolean().optional().describe("Filter by contacted status"),
      segments: z.string().optional().describe("Filter by segment names"),
      allTags: z.string().optional().describe("Filter leads that have ALL of these tags"),
      anyTags: z.string().optional().describe("Filter leads that have ANY of these tags"),
      key: z.string().optional().describe("Search by name, phone, or email"),
      offset: z.number().optional().describe("Start index of results"),
      limit: z.number().optional().describe("Number of results to return (1-100)"),
      sort: z.string().optional().describe("Sort order: Default, LastContact, LastCall, LastEmail, LastActivity"),
      desc: z.boolean().optional().describe("Descending sort (true) or ascending (false)"),
      languages: z.string().optional().describe("Filter by languages (abbreviation)"),
      scrollId: z.string().optional().describe("Scroll ID for paginating large result sets"),
    },
    async (params, extra) => {
      try {
        const authOpts = getLoftyAuthOptions(extra.authInfo);
        const data = await loftyRequest({
          path: "/v1.0/leads",
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
    "lofty_get_lead",
    "Get a single lead by ID from Lofty CRM.",
    {
      leadId: z.number().describe("The lead ID to retrieve"),
      withTrash: z.boolean().optional().describe("When true, include trashed leads"),
    },
    async ({ leadId, withTrash }, extra) => {
      try {
        const authOpts = getLoftyAuthOptions(extra.authInfo);
        const data = await loftyRequest({
          path: `/v1.0/leads/${leadId}`,
          params: withTrash !== undefined ? { withTrash } : undefined,
          ...authOpts,
        });
        return success(data);
      } catch (e) {
        return error(e);
      }
    }
  );

  server.tool(
    "lofty_create_lead",
    "Create a new lead in Lofty CRM.",
    {
      firstName: z.string().describe("First name of the lead (max 30 chars)"),
      lastName: z.string().optional().describe("Last name of the lead (max 30 chars)"),
      emails: z.array(z.string()).optional().describe("List of email addresses"),
      phones: z.array(z.string()).optional().describe("List of phone numbers (max 20 chars each)"),
      leadTypes: z.array(z.number()).optional().describe("Lead type IDs: Other(-1), Seller(1), Buyer(2), Renter(5), Investor(6), Agent(7), Homeowner(8)"),
      assignedUserId: z.number().optional().describe("Agent user ID to assign to (skips auto-routing when provided)"),
      source: z.string().optional().describe("Lead source"),
      stage: z.string().optional().describe("Pipeline stage name (max 20 chars)"),
      tags: z.array(z.string()).optional().describe("Tags to set (replaces existing, max 64 chars each)"),
      tagsAdd: z.array(z.string()).optional().describe("Tags to add (keeps existing tags)"),
      segments: z.array(z.string()).optional().describe("Segments the lead belongs to"),
      referredBy: z.string().optional().describe("Referral source"),
      birthday: z.string().optional().describe("Birthday in 'MMM d, yyyy' format"),
      buyingTimeFrame: z.string().optional().describe("Buying time frame: 1-3, 3-6, 6-12, 12+, Just Looking, Refinancing"),
      preQual: z.string().optional().describe("Pre-qualified: Yes or No"),
      language: z.string().optional().describe("Lead language abbreviation: en, fr, de, es, zh-CN, zh-TW, ja"),
      content: z.string().optional().describe("Note content to attach"),
      welcomeEmail: z.boolean().optional().describe("Send welcome email"),
      leadAlert: z.boolean().optional().describe("Send new lead alert email"),
    },
    async (params, extra) => {
      try {
        const authOpts = getLoftyAuthOptions(extra.authInfo);
        const data = await loftyRequest({
          method: "POST",
          path: "/v1.0/leads",
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
    "lofty_update_lead",
    "Update an existing lead in Lofty CRM.",
    {
      leadId: z.number().describe("The lead ID to update"),
      firstName: z.string().optional().describe("First name (max 30 chars)"),
      lastName: z.string().optional().describe("Last name (max 30 chars)"),
      emails: z.array(z.string()).optional().describe("List of email addresses"),
      phones: z.array(z.string()).optional().describe("List of phone numbers"),
      leadTypes: z.array(z.number()).optional().describe("Lead type IDs"),
      assignedUserId: z.number().optional().describe("Agent user ID to assign to"),
      source: z.string().optional().describe("Lead source"),
      stage: z.string().optional().describe("Pipeline stage name"),
      tags: z.array(z.string()).optional().describe("Tags to set (replaces all existing)"),
      tagsAdd: z.array(z.string()).optional().describe("Tags to add (keeps existing)"),
      segments: z.array(z.string()).optional().describe("Segments"),
      isHidden: z.boolean().optional().describe("Hide/unhide the lead"),
      birthday: z.string().optional().describe("Birthday in 'MMM d, yyyy' format"),
      buyingTimeFrame: z.string().optional().describe("Buying time frame"),
      language: z.string().optional().describe("Language abbreviation"),
      unsubscription: z.boolean().optional().describe("Unsubscribe from email"),
    },
    async (params, extra) => {
      try {
        if (params.tags && params.tags.length === 0) {
          return error(new Error(
            "Sending an empty tags array would remove all tags from this lead. This operation is blocked for safety. To remove all tags, please do so directly in Lofty CRM."
          ));
        }
        const authOpts = getLoftyAuthOptions(extra.authInfo);
        const { leadId, ...body } = params;
        const data = await loftyRequest({
          method: "PUT",
          path: `/v1.0/leads/${leadId}`,
          body,
          ...authOpts,
        });
        return success(data);
      } catch (e) {
        return error(e);
      }
    }
  );

  server.tool(
    "lofty_delete_lead",
    "Delete (trash) a lead in Lofty CRM.",
    {
      leadId: z.number().describe("The lead ID to delete"),
    },
    async (_params, _extra) => {
      return error(new Error(
        "Delete operations are disabled on this MCP server for safety. Please delete this lead directly in Lofty CRM."
      ));
    }
  );

  server.tool(
    "lofty_assign_lead",
    "Assign a lead to an agent in Lofty CRM.",
    {
      leadId: z.number().describe("The lead ID to assign"),
      assignedUserId: z.number().optional().describe("User ID of the agent to assign to"),
      assignedRole: z.string().optional().describe("Role to assign: Agent or Assistant"),
    },
    async ({ leadId, ...body }, extra) => {
      try {
        const authOpts = getLoftyAuthOptions(extra.authInfo);
        const data = await loftyRequest({
          method: "POST",
          path: `/v1.0/leads/${leadId}/assignment`,
          body,
          ...authOpts,
        });
        return success(data);
      } catch (e) {
        return error(e);
      }
    }
  );

  server.tool(
    "lofty_list_lead_activities",
    "List activities for a lead in Lofty CRM (V2 API with pagination).",
    {
      leadId: z.number().describe("The lead ID"),
      currentId: z.number().optional().describe("Cursor-based pagination anchor (pass last item's ID for next page)"),
      offset: z.number().optional().describe("Offset for pagination (ignored when currentId > 0)"),
      limit: z.number().optional().describe("Page size (1-1000, default 10)"),
      timeZoneCode: z.string().optional().describe("IANA timezone (e.g. America/Los_Angeles)"),
    },
    async ({ leadId, ...params }, extra) => {
      try {
        const authOpts = getLoftyAuthOptions(extra.authInfo);
        const data = await loftyRequest({
          path: `/v2.0/leads/${leadId}/activities`,
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
    "lofty_add_lead_activity",
    "Add an activity to a lead in Lofty CRM (search, view, inquiry, etc.).",
    {
      leadId: z.number().describe("The lead ID"),
      type: z.string().describe("Activity type: Search, View, Inquiry, Favorited, ShowingRequest, RegistrationPage, SavedSearch, ReInquiry"),
      text: z.string().describe("Search/activity text"),
      link: z.string().describe("URL for the activity page"),
      picture: z.string().describe("Preview picture URL"),
      created: z.number().describe("Created time in milliseconds since epoch"),
      scheduledDate: z.string().optional().describe("Scheduled date for showing requests"),
      pageName: z.string().optional().describe("Page name of the submission page"),
    },
    async ({ leadId, ...body }, extra) => {
      try {
        const authOpts = getLoftyAuthOptions(extra.authInfo);
        const data = await loftyRequest({
          method: "POST",
          path: `/v1.0/leads/${leadId}/activity`,
          body,
          ...authOpts,
        });
        return success(data);
      } catch (e) {
        return error(e);
      }
    }
  );

  server.tool(
    "lofty_add_inquiry",
    "Add or update inquiry preferences for a lead in Lofty CRM.",
    {
      leadId: z.number().describe("The lead ID"),
      priceMin: z.number().optional().describe("Minimum price"),
      priceMax: z.number().optional().describe("Maximum price"),
      propertyType: z.array(z.string()).optional().describe("Property types: Single Family Home, Multi-Family, Condo, Townhouse, etc."),
      bedroomsMin: z.number().optional().describe("Minimum bedrooms"),
      bathroomsMin: z.string().optional().describe("Minimum bathrooms"),
    },
    async ({ leadId, ...body }, extra) => {
      try {
        const authOpts = getLoftyAuthOptions(extra.authInfo);
        const data = await loftyRequest({
          method: "POST",
          path: `/v1.0/leads/${leadId}/inquiry`,
          body,
          ...authOpts,
        });
        return success(data);
      } catch (e) {
        return error(e);
      }
    }
  );

  server.tool(
    "lofty_update_property",
    "Update property information for a lead in Lofty CRM.",
    {
      leadId: z.number().describe("The lead ID"),
      price: z.number().optional().describe("Property price"),
      streetAddress: z.string().optional().describe("Street address"),
      city: z.string().optional().describe("City"),
      state: z.string().optional().describe("State"),
      zipCode: z.string().optional().describe("ZIP code"),
      county: z.string().optional().describe("County"),
      propertyType: z.string().optional().describe("Property type"),
      bedrooms: z.number().optional().describe("Number of bedrooms"),
      bathrooms: z.number().optional().describe("Number of bathrooms"),
      squareFeet: z.number().optional().describe("Square footage"),
    },
    async ({ leadId, ...body }, extra) => {
      try {
        const authOpts = getLoftyAuthOptions(extra.authInfo);
        const data = await loftyRequest({
          method: "POST",
          path: `/v1.0/leads/${leadId}/property`,
          body,
          ...authOpts,
        });
        return success(data);
      } catch (e) {
        return error(e);
      }
    }
  );

  server.tool(
    "lofty_preview_routing",
    "Preview which agent a lead would be routed to based on lead info.",
    {
      firstName: z.string().describe("Lead first name"),
      lastName: z.string().optional().describe("Lead last name"),
      email: z.string().describe("Lead email address"),
      phone: z.string().optional().describe("Lead phone number"),
    },
    async (params, extra) => {
      try {
        const authOpts = getLoftyAuthOptions(extra.authInfo);
        const data = await loftyRequest({
          method: "POST",
          path: "/v1.0/leads/assignee",
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

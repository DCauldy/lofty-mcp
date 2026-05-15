import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { loftyRequest, success, error, getLoftyAuthOptions } from "../client.js";

export function registerCommunicationTools(server: McpServer) {
  server.tool(
    "lofty_send_email",
    "WARNING: This sends a REAL email to the lead. Confirm content with the user before calling. Sends an email to a lead in Lofty CRM.",
    {
      subject: z.string().describe("Email subject"),
      content: z.string().describe("Email body content"),
      leadId: z.number().describe("Lead ID (uses lead's primary email if toEmail not provided)"),
      toEmail: z.string().optional().describe("Specific recipient email address"),
    },
    async (params, extra) => {
      try {
        const authOpts = getLoftyAuthOptions(extra.authInfo);
        const data = await loftyRequest({
          method: "POST",
          path: "/v1.0/message/email/send",
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
    "lofty_send_sms",
    "WARNING: This sends a REAL SMS to the lead. Confirm content with the user before calling. Sends an SMS to a lead in Lofty CRM.",
    {
      content: z.string().describe("SMS message content"),
      leadId: z.number().describe("Lead ID (uses lead's primary phone if phoneNumber not provided)"),
      phoneNumber: z.string().optional().describe("Specific recipient phone number"),
      phoneCode: z.string().optional().describe("Phone country code"),
    },
    async (params, extra) => {
      try {
        const authOpts = getLoftyAuthOptions(extra.authInfo);
        const data = await loftyRequest({
          method: "POST",
          path: "/v1.0/message/sms/send",
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
    "lofty_call_history",
    "Get call history for a lead in Lofty CRM.",
    {
      leadId: z.number().describe("Lead ID"),
      offset: z.number().optional().describe("Pagination offset"),
      limit: z.number().optional().describe("Number of results (default 10)"),
      currentId: z.number().optional().describe("Cursor-based pagination anchor"),
    },
    async (params, extra) => {
      try {
        const authOpts = getLoftyAuthOptions(extra.authInfo);
        const data = await loftyRequest({
          path: "/v1.0/communication/call/v2",
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
    "lofty_email_history",
    "Get email history for a lead in Lofty CRM.",
    {
      leadId: z.number().describe("Lead ID"),
      offset: z.number().optional().describe("Pagination offset"),
      limit: z.number().optional().describe("Number of results (default 10)"),
      currentId: z.number().optional().describe("Cursor-based pagination anchor"),
    },
    async (params, extra) => {
      try {
        const authOpts = getLoftyAuthOptions(extra.authInfo);
        const data = await loftyRequest({
          path: "/v1.0/communication/email",
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
    "lofty_text_history",
    "Get SMS/text history for a lead in Lofty CRM.",
    {
      leadId: z.number().describe("Lead ID"),
      offset: z.number().optional().describe("Pagination offset"),
      limit: z.number().optional().describe("Number of results (default 10)"),
      currentId: z.number().optional().describe("Cursor-based pagination anchor"),
    },
    async (params, extra) => {
      try {
        const authOpts = getLoftyAuthOptions(extra.authInfo);
        const data = await loftyRequest({
          path: "/v1.0/communication/text",
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
    "lofty_agent_communication",
    "Search communication history by agent in Lofty CRM. Max 24-hour time interval per query.",
    {
      type: z.enum(["CALL", "TEXT", "EMAIL"]).describe("Communication type"),
      startTime: z.number().describe("Start timestamp (milliseconds since epoch)"),
      endTime: z.number().describe("End timestamp (milliseconds since epoch, max 24h interval)"),
      offset: z.number().optional().describe("Pagination offset (default 0)"),
      limit: z.number().optional().describe("Results per page (default 10, max 1000)"),
      teamView: z.boolean().optional().describe("Search team leads' communication (default false)"),
    },
    async (params, extra) => {
      try {
        const authOpts = getLoftyAuthOptions(extra.authInfo);
        const data = await loftyRequest({
          method: "POST",
          path: "/v1.0/agent/communication",
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
    "lofty_send_opportunity_notification",
    "Send an opportunity alert notification for a lead in Lofty CRM.",
    {
      leadId: z.number().describe("Lead ID (must belong to caller's team)"),
      notificationType: z.number().describe("Opportunity trigger type code (9=Saved listing, 10=Viewed listing, 11=Searched, etc.)"),
      description: z.string().optional().describe("Free-text description shown in notification body"),
      link: z.string().optional().describe("Companion URL (listing/search/CMA URL)"),
      message: z.string().optional().describe("Optional free-text message"),
    },
    async (params, extra) => {
      try {
        const authOpts = getLoftyAuthOptions(extra.authInfo);
        const data = await loftyRequest({
          method: "POST",
          path: "/v1.0/agent/send-notification",
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

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { loftyRequest, success, error, getLoftyAuthOptions } from "../client.js";
import { readOnly, createOp, deleteOp } from "../annotations.js";

export function registerManualLogsTools(server: McpServer) {
  server.tool(
    "lofty_list_manual_logs",
    "List manual log entries (logged calls, emails, texts) for a lead in Lofty CRM.",
    {
      leadId: z.number().describe("ID of the lead"),
      logType: z.enum(["logCall", "logEmail", "logText"]).describe("Channel filter"),
      offset: z.number().optional().describe("Pagination offset"),
      limit: z.number().optional().describe("Results per page (default 10, max 1000)"),
      currentId: z.number().optional().describe("Cursor-based pagination anchor"),
      sort: z.enum(["createTime", "id"]).optional().describe("Sort field (default: createTime)"),
      order: z.enum(["asc", "desc"]).optional().describe("Sort direction (default: asc)"),
    },
    readOnly,
    async (params, extra) => {
      try {
        const authOpts = getLoftyAuthOptions(extra.authInfo);
        const data = await loftyRequest({
          path: "/v1.0/logType",
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
    "lofty_get_manual_log",
    "Get a single manual log entry by ID from Lofty CRM.",
    {
      logTypeId: z.number().describe("The manual log entry ID"),
    },
    readOnly,
    async ({ logTypeId }, extra) => {
      try {
        const authOpts = getLoftyAuthOptions(extra.authInfo);
        const data = await loftyRequest({
          path: `/v1.0/logType/${logTypeId}`,
          ...authOpts,
        });
        return success(data);
      } catch (e) {
        return error(e);
      }
    }
  );

  server.tool(
    "lofty_create_manual_log",
    "Create a manual log entry (log a call, email, or text) for a lead in Lofty CRM. This LOGS the communication, it does NOT send an actual message.",
    {
      leadId: z.number().describe("Lead ID"),
      logType: z.enum(["logCall", "logEmail", "logText"]).describe("Channel type"),
      content: z.string().describe("Log content (max 5000 chars)"),
      outboundOrInbound: z.enum(["outbound", "inbound"]).optional().describe("Direction: outbound (agent->lead) or inbound (lead->agent)"),
      isPin: z.boolean().optional().describe("Pin this entry to the timeline"),
      leadPhoneNumber: z.string().optional().describe("Phone number called (required for logCall)"),
      callingOutcome: z.enum(["Talked", "VoiceMessage", "NoAnswer", "BadNumber", "DNCNumber", "DNCContact"]).optional().describe("Call outcome (for logCall)"),
      emailSubject: z.string().optional().describe("Email subject (for logEmail)"),
      toEmail: z.string().optional().describe("Recipient email (for logEmail)"),
      fromEmail: z.string().optional().describe("Sender email (for logEmail)"),
    },
    createOp,
    async (params, extra) => {
      try {
        const authOpts = getLoftyAuthOptions(extra.authInfo);
        const data = await loftyRequest({
          method: "POST",
          path: "/v1.0/logType",
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
    "lofty_delete_manual_log",
    "Delete a manual log entry in Lofty CRM.",
    {
      logTypeId: z.number().describe("The manual log entry ID to delete"),
    },
    deleteOp,
    async (_params, _extra) => {
      return error(new Error(
        "Delete operations are disabled on this MCP server for safety. Please delete this log entry directly in Lofty CRM."
      ));
    }
  );
}

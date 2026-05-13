import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { loftyRequest, success, error, getApiKeyFromAuth } from "../client.js";

export function registerCalendarTools(server: McpServer) {
  server.tool(
    "lofty_query_calendar",
    "Query calendar events (tasks and appointments) in Lofty CRM (V2 Calendar API).",
    {
      leadId: z.string().optional().describe("Filter by lead ID"),
      startTime: z.string().optional().describe("Start time in ISO 8601 format with offset"),
      endTime: z.string().optional().describe("End time in ISO 8601 format with offset"),
      startTimeMs: z.string().optional().describe("Start time as Unix timestamp in milliseconds"),
      endTimeMs: z.string().optional().describe("End time as Unix timestamp in milliseconds"),
      timeZoneCode: z.string().optional().describe("IANA timezone (e.g. America/Los_Angeles)"),
      includeFinished: z.string().optional().describe("Include finished events (default false)"),
      page: z.string().optional().describe("Page number (starts from 0)"),
      pageSize: z.string().optional().describe("Page size (max 500)"),
      sort: z.string().optional().describe("Sort field (default: startTime)"),
      desc: z.string().optional().describe("Descending sort (default: true)"),
      sourceType: z.string().optional().describe("Filter by source type codes"),
    },
    async (params, extra) => {
      try {
        const apiKey = getApiKeyFromAuth(extra.authInfo);
        const data = await loftyRequest({
          path: "/v2.0/calendar",
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
    "lofty_create_calendar",
    "Create a calendar event (task or appointment) in Lofty CRM (V2 Calendar API).",
    {
      type: z.string().describe("Calendar type: TASK or APPOINTMENT"),
      content: z.string().describe("Content/description of the event"),
      leadId: z.number().describe("Lead ID associated with this event"),
      timeZoneCode: z.string().describe("Timezone code (e.g. America/Los_Angeles)"),
      startAt: z.string().optional().describe("Start time in ISO8601 format"),
      endAt: z.string().optional().describe("End time in ISO8601 format"),
      startAtMs: z.number().optional().describe("Start time as Unix timestamp in milliseconds"),
      endAtMs: z.number().optional().describe("End time as Unix timestamp in milliseconds"),
      taskWay: z.string().optional().describe("Task way: Call, Email, Text, Other (only for TASK type)"),
      assignedRole: z.string().optional().describe("Assigned role: Agent or Assistant (only for TASK type)"),
      address: z.string().optional().describe("Location/address (only for APPOINTMENT type)"),
    },
    async (params, extra) => {
      try {
        const apiKey = getApiKeyFromAuth(extra.authInfo);
        const data = await loftyRequest({
          method: "POST",
          path: "/v2.0/calendar",
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
    "lofty_update_calendar",
    "Update a calendar event in Lofty CRM (V2 Calendar API).",
    {
      calendarId: z.string().describe("Composite calendar ID (format: '<numericId>-task' or '<numericId>-appointment')"),
      content: z.string().optional().describe("Updated content/description"),
      startAt: z.string().optional().describe("Updated start time in ISO8601 format"),
      endAt: z.string().optional().describe("Updated end time in ISO8601 format"),
      startAtMs: z.number().optional().describe("Updated start time as Unix timestamp in ms"),
      endAtMs: z.number().optional().describe("Updated end time as Unix timestamp in ms"),
      timeZoneCode: z.string().optional().describe("Updated timezone code"),
      leadId: z.number().optional().describe("Updated lead ID"),
      address: z.string().optional().describe("Updated address (for APPOINTMENT)"),
    },
    async ({ calendarId, ...body }, extra) => {
      try {
        const apiKey = getApiKeyFromAuth(extra.authInfo);
        const data = await loftyRequest({
          method: "PUT",
          path: `/v2.0/calendar/${calendarId}`,
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
    "lofty_delete_calendar",
    "Delete a calendar event in Lofty CRM (V2 Calendar API).",
    {
      calendarId: z.string().describe("Composite calendar ID"),
    },
    async (_params, _extra) => {
      return error(new Error(
        "Delete operations are disabled on this MCP server for safety. Please delete this calendar event directly in Lofty CRM."
      ));
    }
  );

  server.tool(
    "lofty_finish_calendar",
    "Mark a calendar event as finished in Lofty CRM (V2 Calendar API).",
    {
      calendarId: z.string().describe("Composite calendar ID (e.g. '12345-task' or '12345-appointment')"),
    },
    async ({ calendarId }, extra) => {
      try {
        const apiKey = getApiKeyFromAuth(extra.authInfo);
        const data = await loftyRequest({
          method: "POST",
          path: `/v2.0/calendar/${calendarId}/finish`,
          apiKey,
        });
        return success(data);
      } catch (e) {
        return error(e);
      }
    }
  );

  server.tool(
    "lofty_unfinish_calendar",
    "Revert a finished calendar event back to not-completed in Lofty CRM (V2 Calendar API).",
    {
      calendarId: z.string().describe("Composite calendar ID"),
    },
    async ({ calendarId }, extra) => {
      try {
        const apiKey = getApiKeyFromAuth(extra.authInfo);
        const data = await loftyRequest({
          method: "POST",
          path: `/v2.0/calendar/${calendarId}/unfinish`,
          apiKey,
        });
        return success(data);
      } catch (e) {
        return error(e);
      }
    }
  );

  server.tool(
    "lofty_available_meetings",
    "Get available meeting slots in Lofty CRM (V2 Calendar API).",
    {
      startTime: z.string().optional().describe("Start time in ISO 8601 format"),
      endTime: z.string().optional().describe("End time in ISO 8601 format"),
      startTimeMs: z.number().optional().describe("Start time as Unix timestamp in ms"),
      endTimeMs: z.number().optional().describe("End time as Unix timestamp in ms"),
      timeZoneCode: z.string().optional().describe("IANA timezone"),
      limit: z.number().optional().describe("Max number of slots to return (default 10)"),
    },
    async (params, extra) => {
      try {
        const apiKey = getApiKeyFromAuth(extra.authInfo);
        const data = await loftyRequest({
          path: "/v2.0/calendar/meetings/available",
          params: params as Record<string, string | number | boolean | undefined>,
          apiKey,
        });
        return success(data);
      } catch (e) {
        return error(e);
      }
    }
  );
}

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { loftyRequest, success, error, getLoftyAuthOptions } from "../client.js";

export function registerTasksV2Tools(server: McpServer) {
  server.tool(
    "lofty_list_tasks",
    "List tasks and appointments for a lead in Lofty CRM (V2 API).",
    {
      leadId: z.number().describe("ID of the lead whose tasks to return"),
    },
    async (params, extra) => {
      try {
        const authOpts = getLoftyAuthOptions(extra.authInfo);
        const data = await loftyRequest({
          path: "/v2.0/tasks",
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
    "lofty_get_task",
    "Get a single task or appointment by ID from Lofty CRM (V2 API).",
    {
      taskId: z.number().describe("The task or appointment ID"),
    },
    async ({ taskId }, extra) => {
      try {
        const authOpts = getLoftyAuthOptions(extra.authInfo);
        const data = await loftyRequest({
          path: `/v2.0/tasks/${taskId}`,
          ...authOpts,
        });
        return success(data);
      } catch (e) {
        return error(e);
      }
    }
  );

  server.tool(
    "lofty_create_task",
    "Create a new task or appointment in Lofty CRM (V2 API).",
    {
      type: z.string().describe("Type: Other, Call, Email, Text, or Appointment"),
      content: z.string().optional().describe("Description of the task"),
      leadId: z.number().optional().describe("Lead ID this task is related to"),
      assignedRole: z.string().optional().describe("Role: Agent or Assistant"),
      startAt: z.string().optional().describe("Start time in ISO8601 format (e.g. 2026-03-01T15:00:00-08:00)"),
      endAt: z.string().optional().describe("End time in ISO8601 format"),
      timeZoneCode: z.string().optional().describe("Timezone code (e.g. America/Los_Angeles)"),
      address: z.string().optional().describe("Location/address (for Appointment type)"),
    },
    async (params, extra) => {
      try {
        const authOpts = getLoftyAuthOptions(extra.authInfo);
        const data = await loftyRequest({
          method: "POST",
          path: "/v2.0/tasks",
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
    "lofty_update_task",
    "Update an existing task or appointment in Lofty CRM (V2 API).",
    {
      taskId: z.number().describe("The task or appointment ID to update"),
      content: z.string().optional().describe("Updated description"),
      startAt: z.string().optional().describe("Updated start time in ISO8601 format"),
      endAt: z.string().optional().describe("Updated end time in ISO8601 format"),
      timeZoneCode: z.string().optional().describe("Updated timezone code"),
      address: z.string().optional().describe("Updated address (for Appointment)"),
    },
    async ({ taskId, ...body }, extra) => {
      try {
        const authOpts = getLoftyAuthOptions(extra.authInfo);
        const data = await loftyRequest({
          method: "PUT",
          path: `/v2.0/tasks/${taskId}`,
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
    "lofty_delete_task",
    "Delete a task or appointment in Lofty CRM (V2 API).",
    {
      taskId: z.number().describe("The task or appointment ID to delete"),
    },
    async (_params, _extra) => {
      return error(new Error(
        "Delete operations are disabled on this MCP server for safety. Please delete this task directly in Lofty CRM."
      ));
    }
  );

  server.tool(
    "lofty_finish_task",
    "Mark a task or appointment as finished in Lofty CRM (V2 API).",
    {
      taskId: z.number().describe("The task or appointment ID to finish"),
    },
    async ({ taskId }, extra) => {
      try {
        const authOpts = getLoftyAuthOptions(extra.authInfo);
        const data = await loftyRequest({
          method: "POST",
          path: `/v2.0/tasks/${taskId}/finish`,
          ...authOpts,
        });
        return success(data);
      } catch (e) {
        return error(e);
      }
    }
  );

  server.tool(
    "lofty_unfinish_task",
    "Revert a finished task or appointment back to not-completed in Lofty CRM (V2 API).",
    {
      taskId: z.number().describe("The task or appointment ID to unfinish"),
    },
    async ({ taskId }, extra) => {
      try {
        const authOpts = getLoftyAuthOptions(extra.authInfo);
        const data = await loftyRequest({
          method: "POST",
          path: `/v2.0/tasks/${taskId}/unfinish`,
          ...authOpts,
        });
        return success(data);
      } catch (e) {
        return error(e);
      }
    }
  );

  server.tool(
    "lofty_my_tasks",
    "List tasks assigned to the current user (or a specified user) in Lofty CRM (V2 API).",
    {
      userId: z.number().optional().describe("User ID to query tasks for (defaults to current user)"),
      currentId: z.number().optional().describe("Cursor-based pagination anchor"),
      limit: z.number().optional().describe("Page size (1-100, default 10)"),
      timeZoneCode: z.string().optional().describe("IANA timezone code"),
    },
    async (params, extra) => {
      try {
        const authOpts = getLoftyAuthOptions(extra.authInfo);
        const data = await loftyRequest({
          path: "/v2.0/tasks/my-tasks",
          params: params as Record<string, string | number | boolean | undefined>,
          ...authOpts,
        });
        return success(data);
      } catch (e) {
        return error(e);
      }
    }
  );
}

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { loftyRequest, success, error, getApiKeyFromAuth } from "../client.js";

export function registerTasksTools(server: McpServer) {
  server.tool(
    "lofty_list_tasks_v1",
    "List tasks for a lead in Lofty CRM (V1 API).",
    {
      leadId: z.number().describe("ID of the lead whose tasks to return"),
    },
    async (params, extra) => {
      try {
        const apiKey = getApiKeyFromAuth(extra.authInfo);
        const data = await loftyRequest({
          path: "/v1.0/tasks",
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
    "lofty_get_task_v1",
    "Get a single task by ID from Lofty CRM (V1 API).",
    {
      taskId: z.number().describe("The task ID"),
    },
    async ({ taskId }, extra) => {
      try {
        const apiKey = getApiKeyFromAuth(extra.authInfo);
        const data = await loftyRequest({
          path: `/v1.0/tasks/${taskId}`,
          apiKey,
        });
        return success(data);
      } catch (e) {
        return error(e);
      }
    }
  );

  server.tool(
    "lofty_create_task_v1",
    "Create a new task in Lofty CRM (V1 API).",
    {
      content: z.string().describe("Description of the task"),
      leadId: z.number().describe("ID of the lead this task belongs to"),
      deadline: z.number().describe("Deadline in milliseconds since Unix epoch (UTC)"),
      type: z.enum(["Other", "Call", "Email", "Text"]).describe("Task type"),
      assignedRole: z.enum(["Agent", "Assistant"]).describe("Role the task is assigned to"),
    },
    async (params, extra) => {
      try {
        const apiKey = getApiKeyFromAuth(extra.authInfo);
        const data = await loftyRequest({
          method: "POST",
          path: "/v1.0/tasks",
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
    "lofty_update_task_v1",
    "Update an existing task in Lofty CRM (V1 API).",
    {
      taskId: z.number().describe("The task ID to update"),
      content: z.string().optional().describe("Updated description"),
      leadId: z.number().optional().describe("Lead ID"),
      deadline: z.number().optional().describe("Deadline in milliseconds since epoch"),
      type: z.enum(["Other", "Call", "Email", "Text"]).optional().describe("Task type"),
      assignedRole: z.enum(["Agent", "Assistant"]).optional().describe("Assigned role"),
      finishFlag: z.boolean().optional().describe("When true, marks the task as completed"),
    },
    async ({ taskId, ...body }, extra) => {
      try {
        const apiKey = getApiKeyFromAuth(extra.authInfo);
        const data = await loftyRequest({
          method: "PUT",
          path: `/v1.0/tasks/${taskId}`,
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
    "lofty_delete_task_v1",
    "Delete a task in Lofty CRM (V1 API).",
    {
      taskId: z.number().describe("The task ID to delete"),
    },
    async (_params, _extra) => {
      return error(new Error(
        "Delete operations are disabled on this MCP server for safety. Please delete this task directly in Lofty CRM."
      ));
    }
  );

  server.tool(
    "lofty_list_appointments",
    "List appointments for a lead in Lofty CRM (V1 API).",
    {
      leadId: z.number().describe("ID of the lead whose appointments to return"),
    },
    async (params, extra) => {
      try {
        const apiKey = getApiKeyFromAuth(extra.authInfo);
        const data = await loftyRequest({
          path: "/v1.0/appts",
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

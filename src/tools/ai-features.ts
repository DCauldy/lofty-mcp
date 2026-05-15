import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { loftyRequest, success, error, getLoftyAuthOptions } from "../client.js";

export function registerAiFeaturesTools(server: McpServer) {
  server.tool(
    "lofty_list_lead_analysis_tasks",
    "List lead analysis tasks in Lofty CRM.",
    {
      pageNum: z.number().optional().describe("Page number (default 1)"),
      pageSize: z.number().optional().describe("Page size (default 10)"),
    },
    async (params, extra) => {
      try {
        const authOpts = getLoftyAuthOptions(extra.authInfo);
        const data = await loftyRequest({
          path: "/v2.0/ai/lead-analysis",
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
    "lofty_create_lead_analysis_task",
    "Create a lead analysis task in Lofty CRM. Analyzes specified leads using AI.",
    {
      leadIds: z.array(z.number()).describe("Lead IDs to analyze (cannot be empty)"),
    },
    async (params, extra) => {
      try {
        const authOpts = getLoftyAuthOptions(extra.authInfo);
        const data = await loftyRequest({
          method: "POST",
          path: "/v2.0/ai/lead-analysis",
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
    "lofty_generate_call_script",
    "Generate an AI call script for a lead and task in Lofty CRM.",
    {
      leadId: z.number().describe("Lead ID"),
      taskId: z.number().describe("Task ID"),
    },
    async (params, extra) => {
      try {
        const authOpts = getLoftyAuthOptions(extra.authInfo);
        const data = await loftyRequest({
          method: "POST",
          path: "/v2.0/ai/call-script",
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
    "lofty_get_call_summary",
    "Get an AI-generated call summary in Lofty CRM.",
    {
      callRecordId: z.number().describe("Call record ID"),
    },
    async (params, extra) => {
      try {
        const authOpts = getLoftyAuthOptions(extra.authInfo);
        const data = await loftyRequest({
          path: "/v2.0/ai/call-summary",
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
    "lofty_generate_call_summary",
    "Generate an AI call summary for a call record in Lofty CRM.",
    {
      callRecordId: z.number().describe("Call record ID"),
      leadId: z.number().describe("Lead ID"),
    },
    async (params, extra) => {
      try {
        const authOpts = getLoftyAuthOptions(extra.authInfo);
        const data = await loftyRequest({
          method: "POST",
          path: "/v2.0/ai/call-summary/generate",
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
    "lofty_prepare_insight",
    "Generate AI-powered preparation insights for a lead appointment in Lofty CRM.",
    {
      leadId: z.number().describe("Lead ID"),
      appointmentId: z.number().describe("Appointment ID"),
    },
    async (params, extra) => {
      try {
        const authOpts = getLoftyAuthOptions(extra.authInfo);
        const data = await loftyRequest({
          method: "POST",
          path: "/v2.0/ai/prepare-insight",
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

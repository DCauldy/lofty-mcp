import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { loftyRequest, success, error, getLoftyAuthOptions } from "../client.js";
import { readOnly, createOp, updateOp, sendMessage } from "../annotations.js";

export function registerSalesAgentsTools(server: McpServer) {
  server.tool(
    "lofty_get_current_sales_agent",
    "Get the current user's Sales Agent profile in Lofty CRM.",
    {},
    readOnly,
    async (_params, extra) => {
      try {
        const authOpts = getLoftyAuthOptions(extra.authInfo);
        const data = await loftyRequest({
          path: "/v2.0/sales-agents/current",
          ...authOpts,
        });
        return success(data);
      } catch (e) {
        return error(e);
      }
    }
  );

  server.tool(
    "lofty_get_sales_agent_by_lead",
    "Get the Sales Agent assigned to a specific lead in Lofty CRM.",
    {
      leadId: z.number().describe("Lead ID"),
    },
    readOnly,
    async (params, extra) => {
      try {
        const authOpts = getLoftyAuthOptions(extra.authInfo);
        const data = await loftyRequest({
          path: "/v2.0/sales-agents/by-lead",
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
    "lofty_get_sales_agent_quota",
    "Get the current user's Sales Agent quota in Lofty CRM.",
    {},
    readOnly,
    async (_params, extra) => {
      try {
        const authOpts = getLoftyAuthOptions(extra.authInfo);
        const data = await loftyRequest({
          path: "/v2.0/sales-agents/quota",
          ...authOpts,
        });
        return success(data);
      } catch (e) {
        return error(e);
      }
    }
  );

  server.tool(
    "lofty_get_working_leads",
    "Query working leads (paginated) for the Sales Agent in Lofty CRM.",
    {
      aiStage: z.string().optional().describe("AI follow-up stage: HIGH_PRIORITY, AI_PROSPECTING, AI_MONITORING"),
      limit: z.string().optional().describe("Page size (max 100, default 20)"),
      offset: z.string().optional().describe("Start index (default 0)"),
      sort: z.string().optional().describe("Sort field: Default, CreateTime, UpdateTime"),
      desc: z.string().optional().describe("Descending sort (default true)"),
    },
    readOnly,
    async (params, extra) => {
      try {
        const authOpts = getLoftyAuthOptions(extra.authInfo);
        const data = await loftyRequest({
          path: "/v2.0/working-leads",
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
    "lofty_check_working_lead",
    "Check if a lead is a working lead for the Sales Agent in Lofty CRM.",
    {
      leadId: z.number().describe("Lead ID"),
    },
    readOnly,
    async ({ leadId }, extra) => {
      try {
        const authOpts = getLoftyAuthOptions(extra.authInfo);
        const data = await loftyRequest({
          path: `/v2.0/sales-agents/working-lead/${leadId}`,
          ...authOpts,
        });
        return success(data);
      } catch (e) {
        return error(e);
      }
    }
  );

  server.tool(
    "lofty_batch_add_working_leads",
    "Batch add leads to the Sales Agent working pool in Lofty CRM.",
    {
      leadIds: z.array(z.number()).describe("Lead IDs to add (max 100)"),
      createPlanTask: z.boolean().optional().describe("Whether to create plan tasks for each lead"),
    },
    createOp,
    async (params, extra) => {
      try {
        const authOpts = getLoftyAuthOptions(extra.authInfo);
        const data = await loftyRequest({
          method: "POST",
          path: "/v2.0/working-leads/add",
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
    "lofty_mute_working_lead",
    "Mute a working lead for the Sales Agent in Lofty CRM.",
    {
      leadId: z.number().describe("Lead ID to mute"),
    },
    updateOp,
    async ({ leadId }, extra) => {
      try {
        const authOpts = getLoftyAuthOptions(extra.authInfo);
        const data = await loftyRequest({
          method: "PUT",
          path: `/v2.0/sales-agents/working-lead/${leadId}/mute`,
          ...authOpts,
        });
        return success(data);
      } catch (e) {
        return error(e);
      }
    }
  );

  server.tool(
    "lofty_get_sales_agent_settings",
    "Get Sales Agent settings in Lofty CRM.",
    {},
    readOnly,
    async (_params, extra) => {
      try {
        const authOpts = getLoftyAuthOptions(extra.authInfo);
        const data = await loftyRequest({
          path: "/v2.0/sales-agent/settings",
          ...authOpts,
        });
        return success(data);
      } catch (e) {
        return error(e);
      }
    }
  );

  server.tool(
    "lofty_update_sales_agent_settings",
    "Update Sales Agent settings in Lofty CRM.",
    {
      id: z.number().optional().describe("Sales Agent ID"),
      assistantName: z.string().optional().describe("Assistant name"),
      callTransferType: z.string().optional().describe("Call transfer: Disabled or ToAssignedAgent"),
      agentExperience: z.string().optional().describe("Agent experience description"),
      rentalBusiness: z.boolean().optional().describe("Handles rental business"),
      websiteChannel: z.boolean().optional().describe("Website channel enabled"),
      textChannel: z.boolean().optional().describe("Text channel enabled"),
      emailChannel: z.boolean().optional().describe("Email channel enabled"),
      startActiveHour: z.number().optional().describe("Active start hour (0-23)"),
      endActiveHour: z.number().optional().describe("Active end hour (0-23)"),
      newLeadEnable: z.boolean().optional().describe("New lead follow-up enabled"),
      visitorsEnable: z.boolean().optional().describe("Visitor follow-up enabled"),
      followUpRole: z.string().optional().describe("Follow up role: AI or Agent"),
    },
    updateOp,
    async (params, extra) => {
      try {
        const authOpts = getLoftyAuthOptions(extra.authInfo);
        const data = await loftyRequest({
          method: "PUT",
          path: "/v2.0/sales-agent/settings",
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
    "lofty_get_lead_mute_status",
    "Get the mute status of a lead for the Sales Agent in Lofty CRM.",
    {
      leadId: z.number().describe("Lead ID"),
    },
    readOnly,
    async (params, extra) => {
      try {
        const authOpts = getLoftyAuthOptions(extra.authInfo);
        const data = await loftyRequest({
          path: "/v2.0/sales-agent/lead/mute-status",
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
    "lofty_get_plan_tasks_by_lead",
    "Get plan tasks for a lead in Lofty CRM.",
    {
      leadId: z.number().describe("Lead ID"),
    },
    readOnly,
    async ({ leadId }, extra) => {
      try {
        const authOpts = getLoftyAuthOptions(extra.authInfo);
        const data = await loftyRequest({
          path: `/v2.0/plan-tasks/lead/${leadId}`,
          ...authOpts,
        });
        return success(data);
      } catch (e) {
        return error(e);
      }
    }
  );

  server.tool(
    "lofty_batch_create_plan_tasks",
    "Batch create plan tasks for leads in Lofty CRM.",
    {
      leadIds: z.array(z.number()).describe("Lead IDs to create plan tasks for (max 100)"),
    },
    createOp,
    async (params, extra) => {
      try {
        const authOpts = getLoftyAuthOptions(extra.authInfo);
        const data = await loftyRequest({
          method: "POST",
          path: "/v2.0/plan-tasks/create",
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
    "lofty_send_sms_via_ai_number",
    "WARNING: This sends a REAL SMS to the agent via the AI number. Sends an SMS to the agent's phone number via the Sales Agent AI number in Lofty CRM.",
    {
      content: z.string().describe("SMS content to send"),
    },
    sendMessage,
    async (params, extra) => {
      try {
        const authOpts = getLoftyAuthOptions(extra.authInfo);
        const data = await loftyRequest({
          method: "POST",
          path: "/v2.0/sales-agent/ai-number/send-sms-to-agent",
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

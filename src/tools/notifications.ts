import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { loftyRequest, success, error, getLoftyAuthOptions } from "../client.js";
import { sendMessage } from "../annotations.js";

export function registerNotificationsTools(server: McpServer) {
  server.tool(
    "lofty_send_email_to_agent",
    "WARNING: This sends a REAL email to the agent. Send a system email notification to the agent in Lofty CRM.",
    {
      subject: z.string().describe("Email subject"),
      content: z.string().describe("Email body content (HTML supported)"),
    },
    sendMessage,
    async (params, extra) => {
      try {
        const authOpts = getLoftyAuthOptions(extra.authInfo);
        const data = await loftyRequest({
          method: "POST",
          path: "/v2.0/sales-agent/message/email/send-to-agent",
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
    "lofty_send_sms_to_agent",
    "WARNING: This sends a REAL SMS to the agent. Send a system SMS notification to the agent in Lofty CRM.",
    {
      content: z.string().describe("SMS content"),
    },
    sendMessage,
    async (params, extra) => {
      try {
        const authOpts = getLoftyAuthOptions(extra.authInfo);
        const data = await loftyRequest({
          method: "POST",
          path: "/v2.0/sales-agent/message/sms/send-to-agent",
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
    "lofty_send_task_reminder_push",
    "Send a task reminder push notification in Lofty CRM.",
    {
      taskId: z.number().describe("Task ID or Appointment ID"),
      type: z.enum(["TASK", "APPOINTMENT"]).describe("Type: TASK or APPOINTMENT"),
    },
    sendMessage,
    async (params, extra) => {
      try {
        const authOpts = getLoftyAuthOptions(extra.authInfo);
        const data = await loftyRequest({
          method: "POST",
          path: "/v2.0/sales-agent/notification/app-push/send-task-reminder",
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

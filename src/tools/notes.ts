import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { loftyRequest, success, error, getApiKeyFromAuth } from "../client.js";

export function registerNotesTools(server: McpServer) {
  server.tool(
    "lofty_list_notes",
    "List notes for a lead in Lofty CRM.",
    {
      leadId: z.number().describe("ID of the lead whose notes to return"),
      includeSystemNote: z.boolean().optional().describe("When true, include system-generated notes"),
    },
    async (params, extra) => {
      try {
        const apiKey = getApiKeyFromAuth(extra.authInfo);
        const data = await loftyRequest({
          path: "/v1.0/notes",
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
    "lofty_get_note",
    "Get a single note by ID from Lofty CRM.",
    {
      noteId: z.number().describe("The note ID"),
    },
    async ({ noteId }, extra) => {
      try {
        const apiKey = getApiKeyFromAuth(extra.authInfo);
        const data = await loftyRequest({
          path: `/v1.0/notes/${noteId}`,
          apiKey,
        });
        return success(data);
      } catch (e) {
        return error(e);
      }
    }
  );

  server.tool(
    "lofty_create_note",
    "Create a new note on a lead in Lofty CRM.",
    {
      content: z.string().describe("Note content (max 2000 characters)"),
      leadId: z.number().describe("ID of the lead this note belongs to"),
      isPin: z.boolean().describe("Whether to pin this note to the top of the timeline"),
    },
    async (params, extra) => {
      try {
        const apiKey = getApiKeyFromAuth(extra.authInfo);
        const data = await loftyRequest({
          method: "POST",
          path: "/v1.0/notes",
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
    "lofty_update_note",
    "Update an existing note in Lofty CRM.",
    {
      noteId: z.number().describe("The note ID to update"),
      content: z.string().describe("Updated note content (max 2000 characters)"),
      leadId: z.number().describe("ID of the lead this note belongs to"),
      isPin: z.boolean().describe("Whether to pin this note"),
    },
    async ({ noteId, ...body }, extra) => {
      try {
        const apiKey = getApiKeyFromAuth(extra.authInfo);
        const data = await loftyRequest({
          method: "PUT",
          path: `/v1.0/notes/${noteId}`,
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
    "lofty_delete_note",
    "Delete a note in Lofty CRM.",
    {
      noteId: z.number().describe("The note ID to delete"),
    },
    async (_params, _extra) => {
      return error(new Error(
        "Delete operations are disabled on this MCP server for safety. Please delete this note directly in Lofty CRM."
      ));
    }
  );
}

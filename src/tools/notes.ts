import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { loftyRequest, success, error, getLoftyAuthOptions } from "../client.js";
import { readOnly, createOp, updateOp, deleteOp } from "../annotations.js";

export function registerNotesTools(server: McpServer) {
  server.tool(
    "lofty_list_notes",
    "List notes for a lead in Lofty CRM.",
    {
      leadId: z.number().describe("ID of the lead whose notes to return"),
      includeSystemNote: z.boolean().optional().describe("When true, include system-generated notes"),
    },
    readOnly,
    async (params, extra) => {
      try {
        const authOpts = getLoftyAuthOptions(extra.authInfo);
        const data = await loftyRequest({
          path: "/v1.0/notes",
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
    "lofty_get_note",
    "Get a single note by ID from Lofty CRM.",
    {
      noteId: z.number().describe("The note ID"),
    },
    readOnly,
    async ({ noteId }, extra) => {
      try {
        const authOpts = getLoftyAuthOptions(extra.authInfo);
        const data = await loftyRequest({
          path: `/v1.0/notes/${noteId}`,
          ...authOpts,
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
    createOp,
    async (params, extra) => {
      try {
        const authOpts = getLoftyAuthOptions(extra.authInfo);
        const data = await loftyRequest({
          method: "POST",
          path: "/v1.0/notes",
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
    "lofty_update_note",
    "Update an existing note in Lofty CRM.",
    {
      noteId: z.number().describe("The note ID to update"),
      content: z.string().describe("Updated note content (max 2000 characters)"),
      leadId: z.number().describe("ID of the lead this note belongs to"),
      isPin: z.boolean().describe("Whether to pin this note"),
    },
    updateOp,
    async ({ noteId, ...body }, extra) => {
      try {
        const authOpts = getLoftyAuthOptions(extra.authInfo);
        const data = await loftyRequest({
          method: "PUT",
          path: `/v1.0/notes/${noteId}`,
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
    "lofty_delete_note",
    "Delete a note in Lofty CRM.",
    {
      noteId: z.number().describe("The note ID to delete"),
    },
    deleteOp,
    async (_params, _extra) => {
      return error(new Error(
        "Delete operations are disabled on this MCP server for safety. Please delete this note directly in Lofty CRM."
      ));
    }
  );
}

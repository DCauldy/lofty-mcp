import type { ToolAnnotations } from "@modelcontextprotocol/sdk/types.js";

/** GET / list / search — no side effects */
export const readOnly: ToolAnnotations = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
};

/** POST to create a new record */
export const createOp: ToolAnnotations = {
  readOnlyHint: false,
  destructiveHint: false,
  idempotentHint: false,
  openWorldHint: false,
};

/** PUT / PATCH to modify an existing record */
export const updateOp: ToolAnnotations = {
  readOnlyHint: false,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
};

/** DELETE — destructive (all currently disabled, but annotated correctly) */
export const deleteOp: ToolAnnotations = {
  readOnlyHint: false,
  destructiveHint: true,
  idempotentHint: true,
  openWorldHint: false,
};

/** Send email/SMS/notification to a real person */
export const sendMessage: ToolAnnotations = {
  readOnlyHint: false,
  destructiveHint: true,
  idempotentHint: false,
  openWorldHint: true,
};

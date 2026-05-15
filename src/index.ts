#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createMcpServer } from "./server.js";

const server = createMcpServer();

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Lofty MCP Server running on stdio");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

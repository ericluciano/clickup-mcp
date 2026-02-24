#!/usr/bin/env node

/**
 * ClickUp MCP Server — Local, API Key based.
 *
 * Provides full ClickUp task management via Claude Code.
 * Supports personal/private lists, onboarding, and default task creation rules.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { registerOnboardingTools } from "./src/tools/onboarding.js";
import { registerWorkspaceTools } from "./src/tools/workspace.js";
import { registerTaskTools } from "./src/tools/tasks.js";
import { registerCommentTools } from "./src/tools/comments.js";
import { registerTimeTrackingTools } from "./src/tools/timetracking.js";
import { registerDocumentTools } from "./src/tools/documents.js";
import { registerChatTools } from "./src/tools/chat.js";
import { loadConfig } from "./src/config.js";

async function main() {
  // Validate API key exists
  if (!process.env.CLICKUP_API_KEY) {
    console.error(
      "ERROR: CLICKUP_API_KEY environment variable is required.\n" +
        "Get your personal API token at: ClickUp > Settings > Apps > API Token"
    );
    process.exit(1);
  }

  const config = loadConfig();

  // Build dynamic instructions
  let instructions = "ClickUp MCP — personal API key integration for task management.";
  if (config) {
    instructions += `\nWorkspace: ${config.workspace_name || config.workspace_id}`;
    instructions += `\nDefault list: ${config.default_list_name || config.default_list_id}`;
    instructions += `\nUser: ${config.user_name} (${config.user_email})`;
  } else {
    instructions +=
      "\n\nIMPORTANT: No configuration found. Run clickup_onboarding first to set up the MCP.";
  }

  const server = new McpServer(
    {
      name: "clickup-local",
      version: "1.0.0",
    },
    {
      instructions,
    }
  );

  // Register all tools
  registerOnboardingTools(server);
  registerWorkspaceTools(server);
  registerTaskTools(server);
  registerCommentTools(server);
  registerTimeTrackingTools(server);
  registerDocumentTools(server);
  registerChatTools(server);

  // Connect via stdio
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

/**
 * Onboarding tool — interactive setup for the MCP.
 * Runs automatically on first use or when explicitly called.
 */
import { z } from "zod";
import * as api from "../api.js";
import { loadConfig, saveConfig, DEFAULT_CONFIG, getConfigPath } from "../config.js";

export function registerOnboardingTools(server) {
  server.tool(
    "clickup_onboarding",
    `Interactive onboarding / reconfiguration for the ClickUp MCP.
Run this to:
- Validate the API key
- Identify the authenticated user
- Choose default workspace
- Choose default list (including personal/private lists)
- Set default task creation rules (assignee, priority, tags, due date)

Parameters:
- step: which onboarding step to execute (run them in order: validate_key → choose_workspace → choose_list → set_defaults → save)
- workspace_id: required for choose_list step
- list_id / list_name: required for save step
- priority: 1=Urgent, 2=High, 3=Normal(default), 4=Low
- tags: comma-separated default tags
- due_date_offset_days: days from today for default due date (default: 1)
- assignee_self: whether to auto-assign tasks to yourself (default: true)

Typical flow:
1. Call with step="validate_key" → confirms API key works, returns user info
2. Call with step="choose_workspace" → lists workspaces, user picks one
3. Call with step="choose_list" workspace_id="..." → shows all lists (including personal), user picks one
4. Call with step="set_defaults" → optional, set priority/tags/due_date defaults
5. Call with step="save" workspace_id="..." list_id="..." → saves config`,
    {
      step: z
        .enum([
          "validate_key",
          "choose_workspace",
          "choose_list",
          "set_defaults",
          "save",
        ])
        .describe("Which onboarding step to run"),
      workspace_id: z
        .string()
        .optional()
        .describe("Workspace/team ID (required for choose_list and save)"),
      workspace_name: z.string().optional().describe("Workspace name"),
      list_id: z.string().optional().describe("Default list ID (for save)"),
      list_name: z.string().optional().describe("Default list name (for save)"),
      priority: z
        .number()
        .min(1)
        .max(4)
        .optional()
        .describe("Default priority: 1=Urgent, 2=High, 3=Normal, 4=Low"),
      tags: z
        .string()
        .optional()
        .describe("Comma-separated default tags (e.g. 'via-claude,important')"),
      due_date_offset_days: z
        .number()
        .optional()
        .describe("Days from today for default due date"),
      assignee_self: z
        .boolean()
        .optional()
        .describe("Auto-assign tasks to yourself"),
    },
    async (params) => {
      try {
        switch (params.step) {
          case "validate_key":
            return await stepValidateKey();
          case "choose_workspace":
            return await stepChooseWorkspace();
          case "choose_list":
            return await stepChooseList(params.workspace_id);
          case "set_defaults":
            return await stepSetDefaults();
          case "save":
            return await stepSave(params);
          default:
            return text(`Unknown step: ${params.step}`);
        }
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${err.message}` }], isError: true };
      }
    }
  );
}

function text(msg) {
  return { content: [{ type: "text", text: msg }] };
}

async function stepValidateKey() {
  const { user } = await api.getAuthorizedUser();
  return text(
    `API Key validated successfully!\n\n` +
      `**User:** ${user.username}\n` +
      `**Email:** ${user.email}\n` +
      `**User ID:** ${user.id}\n\n` +
      `Next step: call clickup_onboarding with step="choose_workspace"`
  );
}

async function stepChooseWorkspace() {
  const { teams } = await api.getTeams();

  if (!teams || teams.length === 0) {
    return text("No workspaces found for this API key.");
  }

  let msg = `**Available Workspaces:**\n\n`;
  for (const team of teams) {
    msg += `- **${team.name}** (ID: \`${team.id}\`) — ${team.members?.length || 0} members\n`;
  }
  msg += `\nNext step: call clickup_onboarding with step="choose_list" and workspace_id="<chosen_id>"`;
  return text(msg);
}

async function stepChooseList(workspaceId) {
  if (!workspaceId) {
    return text(
      "Error: workspace_id is required. Run step='choose_workspace' first."
    );
  }

  const { spaces } = await api.getSpaces(workspaceId);
  let msg = `**All lists in workspace (including personal/private):**\n\n`;
  let listCount = 0;

  for (const space of spaces || []) {
    msg += `**Space: ${space.name}** ${space.private ? "(Private)" : ""}\n`;

    // Folderless lists
    try {
      const { lists } = await api.getFolderlessLists(space.id);
      for (const list of lists || []) {
        msg += `  - ${list.name} (ID: \`${list.id}\`)\n`;
        listCount++;
      }
    } catch {}

    // Lists inside folders
    try {
      const { folders } = await api.getFolders(space.id);
      for (const folder of folders || []) {
        msg += `  **Folder: ${folder.name}**\n`;
        try {
          const { lists } = await api.getListsInFolder(folder.id);
          for (const list of lists || []) {
            msg += `    - ${list.name} (ID: \`${list.id}\`)\n`;
            listCount++;
          }
        } catch {}
      }
    } catch {}

    msg += `\n`;
  }

  msg += `\n**Total lists found: ${listCount}**\n`;
  msg += `\nNext step: call clickup_onboarding with step="save" workspace_id="${workspaceId}" list_id="<chosen_id>" list_name="<chosen_name>"`;
  return text(msg);
}

async function stepSetDefaults() {
  const existing = loadConfig();
  const defaults = existing?.defaults || DEFAULT_CONFIG.defaults;

  return text(
    `**Current defaults:**\n` +
      `- Assignee self: ${defaults.assignee_self}\n` +
      `- Priority: ${defaults.priority} (1=Urgent, 2=High, 3=Normal, 4=Low)\n` +
      `- Tags: ${defaults.tags?.join(", ") || "none"}\n` +
      `- Due date offset: +${defaults.due_date_offset_days} day(s)\n\n` +
      `To change, call step="save" with any of: priority, tags, due_date_offset_days, assignee_self`
  );
}

async function stepSave(params) {
  const { user } = await api.getAuthorizedUser();
  const existing = loadConfig() || { ...DEFAULT_CONFIG };

  const config = {
    ...existing,
    workspace_id: params.workspace_id || existing.workspace_id,
    workspace_name: params.workspace_name || existing.workspace_name,
    default_list_id: params.list_id || existing.default_list_id,
    default_list_name: params.list_name || existing.default_list_name,
    user_id: String(user.id),
    user_name: user.username,
    user_email: user.email,
    defaults: {
      assignee_self:
        params.assignee_self ?? existing.defaults?.assignee_self ?? true,
      priority: params.priority || existing.defaults?.priority || 3,
      tags: params.tags
        ? params.tags.split(",").map((t) => t.trim())
        : existing.defaults?.tags || ["via-claude"],
      due_date_offset_days:
        params.due_date_offset_days ??
        existing.defaults?.due_date_offset_days ??
        1,
    },
  };

  saveConfig(config);

  return text(
    `Configuration saved to \`${getConfigPath()}\`!\n\n` +
      `**Workspace:** ${config.workspace_name || config.workspace_id}\n` +
      `**Default list:** ${config.default_list_name || config.default_list_id}\n` +
      `**User:** ${config.user_name} (${config.user_email})\n` +
      `**Defaults:**\n` +
      `  - Assignee self: ${config.defaults.assignee_self}\n` +
      `  - Priority: ${config.defaults.priority}\n` +
      `  - Tags: ${config.defaults.tags.join(", ")}\n` +
      `  - Due date offset: +${config.defaults.due_date_offset_days} day(s)\n\n` +
      `The MCP is ready to use!`
  );
}

# ClickUp MCP Server

Local MCP (Model Context Protocol) server for ClickUp, using **personal API Key** authentication. Designed for Claude Code but compatible with any MCP client.

Unlike OAuth-based integrations, this MCP uses your personal API token — giving you access to **all your lists, including personal and private ones**.

> **Credentials are personal.** Each person uses their own ClickUp API key. No credentials are included in this repository.

## Features

- **28 tools** covering tasks, comments, time tracking, documents, chat, and workspace management
- **One-step onboarding** — just provide your API key and everything configures automatically
- **Personal/private list access** — full visibility via API Key
- **Default task rules** — auto-assign, default priority, tags, and due dates
- **No env var required** — API key is stored locally in config.json after onboarding

## Quick Start

### 1. Install

```bash
git clone https://github.com/ericluciano/clickup-mcp.git
cd clickup-mcp
npm install
```

### 2. Add to Claude Code

Add this to your `~/.claude.json`:

```json
{
  "mcpServers": {
    "clickup-local": {
      "type": "stdio",
      "command": "node",
      "args": ["C:\\path\\to\\clickup-mcp\\index.js"]
    }
  }
}
```

**That's it.** No API key in the config — the onboarding handles everything.

Linux/Mac:
```json
"args": ["/home/user/clickup-mcp/index.js"]
```

### 3. Run onboarding

Start a new Claude Code session and say:

> "Configure the ClickUp MCP with my API key: pk_YOUR_KEY_HERE"

The onboarding will automatically:
- Validate your API key
- Identify your user account
- Discover all workspaces
- List all spaces, folders, and lists (including personal/private)
- Save everything to `config.json`

### Getting your API Key

1. Open ClickUp
2. Click your **avatar** (bottom-left)
3. Go to **Settings**
4. Click **Apps** in the sidebar
5. Copy your **API Token** (starts with `pk_`)

## Alternative: API Key via Environment Variable

You can also pass the API key as an env var (takes priority over config.json):

```json
{
  "mcpServers": {
    "clickup-local": {
      "type": "stdio",
      "command": "node",
      "args": ["C:\\path\\to\\clickup-mcp\\index.js"],
      "env": {
        "CLICKUP_API_KEY": "pk_YOUR_KEY"
      }
    }
  }
}
```

## Available Tools (28)

### Setup
| Tool | Description |
|------|-------------|
| `clickup_onboarding` | Setup / reconfigure the MCP |

### Search & Navigation
| Tool | Description |
|------|-------------|
| `clickup_search` | Search tasks across workspace |
| `clickup_get_workspace_hierarchy` | View spaces, folders, lists |
| `clickup_get_list` | Get list details |
| `clickup_get_folder` | Get folder details |

### Tasks
| Tool | Description |
|------|-------------|
| `clickup_create_task` | Create task (uses config defaults) |
| `clickup_get_task` | Get full task details |
| `clickup_update_task` | Update task fields |
| `clickup_add_tag_to_task` | Add tag to task |
| `clickup_remove_tag_from_task` | Remove tag from task |

### Comments & Files
| Tool | Description |
|------|-------------|
| `clickup_get_task_comments` | Get task comments |
| `clickup_create_task_comment` | Add comment to task |
| `clickup_attach_task_file` | Upload file to task |

### Time Tracking
| Tool | Description |
|------|-------------|
| `clickup_get_task_time_entries` | Get time entries for task |
| `clickup_start_time_tracking` | Start timer on task |
| `clickup_stop_time_tracking` | Stop current timer |
| `clickup_add_time_entry` | Add manual time entry |
| `clickup_get_current_time_entry` | Get running timer |

### Members
| Tool | Description |
|------|-------------|
| `clickup_get_workspace_members` | List all workspace members |
| `clickup_find_member_by_name` | Find member by name |
| `clickup_resolve_assignees` | Resolve names to user IDs |

### Documents
| Tool | Description |
|------|-------------|
| `clickup_create_document` | Create a ClickUp Doc |
| `clickup_list_document_pages` | List pages in a doc |
| `clickup_get_document_pages` | Get page content |
| `clickup_create_document_page` | Create new page |
| `clickup_update_document_page` | Update existing page |

### Chat
| Tool | Description |
|------|-------------|
| `clickup_get_chat_channels` | List chat channels |
| `clickup_send_chat_message` | Send chat message |

## Config File

After onboarding, a `config.json` is created locally (gitignored):

```json
{
  "api_key": "pk_...",
  "workspace_id": "1234567",
  "workspace_name": "My Workspace",
  "default_list_id": "900100200300",
  "default_list_name": "My Personal List",
  "user_id": "12345678",
  "user_name": "Eric",
  "user_email": "eric@example.com",
  "defaults": {
    "assignee_self": true,
    "priority": 3,
    "tags": ["via-claude"],
    "due_date_offset_days": 1
  }
}
```

## License

MIT

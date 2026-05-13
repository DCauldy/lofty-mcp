# Lofty CRM MCP Server

A [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server that connects Claude to your [Lofty](https://lofty.com) (formerly Chime) CRM account. Provides **110 tools** across 21 categories for managing leads, tasks, transactions, communications, AI features, and more -- directly from Claude.

## Features

- **Full CRM access** -- Manage leads, tasks, transactions, listings, communications, and team settings
- **AI-powered tools** -- Lead analysis, call scripts, call summaries, and insight preparation via Lofty's built-in AI
- **Sales Agent management** -- Working leads, quotas, plan tasks, mute controls, and agent settings
- **Two deployment modes** -- Run locally via stdio or deploy to Vercel with OAuth
- **Safe by design** -- All delete operations are disabled to prevent accidental data loss
- **OAuth authentication** -- Secure API key handling with encrypted storage for hosted mode

## Quick Start

### Option 1: Claude.ai (Hosted on Vercel)

1. Open **Claude.ai** > Settings > Connectors
2. Click **Add Custom Connector**
3. Enter the server URL: `https://lofty-mcp.vercel.app/mcp`
4. Complete the OAuth flow by entering your **Lofty API key**

### Option 2: Claude Desktop (Local stdio)

1. Clone the repository:
   ```bash
   git clone https://github.com/DCauldy/lofty-mcp.git
   cd lofty-mcp
   ```

2. Install dependencies and build:
   ```bash
   npm install
   npm run build
   ```

3. Create a `.env` file:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and add your Lofty API key:
   ```
   LOFTY_API_KEY=your-api-key-here
   ```

4. Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):
   ```json
   {
     "mcpServers": {
       "lofty": {
         "command": "node",
         "args": ["/path/to/lofty-mcp/dist/src/index.js"],
         "env": {
           "LOFTY_API_KEY": "your-api-key-here"
         }
       }
     }
   }
   ```

5. Restart Claude Desktop.

## Tools Reference

### Leads

| Tool | Description |
|------|-------------|
| `lofty_list_leads` | List leads with filtering (limit, offset, sorting) |
| `lofty_get_lead` | Get individual lead details |
| `lofty_create_lead` | Create a new lead (name, email, phone, source, tags) |
| `lofty_update_lead` | Update an existing lead |
| `lofty_assign_lead` | Assign a lead to an agent |
| `lofty_list_lead_activities` | List activities for a lead (v2) |
| `lofty_add_lead_activity` | Add an activity to a lead |
| `lofty_add_lead_inquiry` | Add a property inquiry to a lead |
| `lofty_update_lead_property` | Update a lead's property interest |
| `lofty_preview_lead_routing` | Preview lead routing results |

### Communication

| Tool | Description |
|------|-------------|
| `lofty_send_email` | **WARNING: Sends a REAL email.** Send an email to a lead |
| `lofty_send_sms` | **WARNING: Sends a REAL SMS.** Send an SMS to a lead |
| `lofty_get_call_history` | Get call history for a lead |
| `lofty_get_email_history` | Get email history for a lead |
| `lofty_get_text_history` | Get text message history for a lead |
| `lofty_get_agent_communication` | Get agent communication records |
| `lofty_send_opportunity_notification` | Send an opportunity notification |

### Notes

| Tool | Description |
|------|-------------|
| `lofty_list_notes` | List notes for a lead |
| `lofty_get_note` | Get a note by ID |
| `lofty_create_note` | Create a note on a lead |
| `lofty_update_note` | Update a note |

### Calls

| Tool | Description |
|------|-------------|
| `lofty_list_calls` | List call records |
| `lofty_get_call` | Get call details |
| `lofty_get_recording_url` | Get the recording URL for a call |

### Tasks (v1)

| Tool | Description |
|------|-------------|
| `lofty_list_tasks` | List tasks with filtering |
| `lofty_get_task` | Get task details |
| `lofty_create_task` | Create a new task |
| `lofty_update_task` | Update a task |
| `lofty_list_appointments` | List appointments |

### Tasks (v2)

| Tool | Description |
|------|-------------|
| `lofty_list_tasks_v2` | List tasks (v2 API with composite IDs) |
| `lofty_get_task_v2` | Get a task by composite ID |
| `lofty_create_task_v2` | Create a task (v2) |
| `lofty_update_task_v2` | Update a task (v2) |
| `lofty_finish_task_v2` | Mark a task as finished |
| `lofty_unfinish_task_v2` | Mark a task as unfinished |
| `lofty_get_my_tasks` | Get the current user's tasks |

### Calendar (v2)

| Tool | Description |
|------|-------------|
| `lofty_query_calendar` | Query calendar events |
| `lofty_create_calendar_event` | Create a calendar event |
| `lofty_update_calendar_event` | Update a calendar event |
| `lofty_finish_calendar_event` | Mark a calendar event as finished |
| `lofty_unfinish_calendar_event` | Mark a calendar event as unfinished |
| `lofty_get_available_meetings` | Get available meeting slots |

### Transactions

| Tool | Description |
|------|-------------|
| `lofty_list_transactions_by_lead` | List transactions for a lead |
| `lofty_get_transaction` | Get transaction details |
| `lofty_create_transaction` | Create a transaction |
| `lofty_update_transaction` | Update a transaction |
| `lofty_get_property_address` | Get property address for a transaction |
| `lofty_update_property_address` | Update property address |
| `lofty_search_transactions` | Search transactions (v2) |
| `lofty_list_transaction_custom_fields` | List transaction custom fields |

### Members

| Tool | Description |
|------|-------------|
| `lofty_list_members` | List team members |
| `lofty_get_member` | Get member by ID |
| `lofty_get_member_by_account` | Get member by account name |
| `lofty_get_me` | Get the current authenticated user |

### Listings

| Tool | Description |
|------|-------------|
| `lofty_get_published_listings` | Get published listings |
| `lofty_get_listings_by_user` | Get listings for a specific user |
| `lofty_search_listings` | Search listings (v2) |

### Webhooks

| Tool | Description |
|------|-------------|
| `lofty_list_webhooks` | List configured webhooks |
| `lofty_create_webhook` | Create a webhook subscription |

### Team Features

| Tool | Description |
|------|-------------|
| `lofty_list_tags` | List available tags |
| `lofty_list_custom_fields` | List custom fields |
| `lofty_add_custom_field` | Add a custom field |
| `lofty_list_lead_ponds` | List lead ponds |
| `lofty_get_lead_pond` | Get lead pond details |

### Lead Routing

| Tool | Description |
|------|-------------|
| `lofty_list_routing_members` | List routing members |
| `lofty_list_routing_roles` | List routing roles |
| `lofty_list_routing_rules` | List routing rules |
| `lofty_get_supplement_rule` | Get supplemental routing rule |
| `lofty_update_supplement_rule` | Update supplemental routing rule |

### Agent Users

| Tool | Description |
|------|-------------|
| `lofty_add_agent` | Add a new agent user |
| `lofty_add_agent_tag` | Add a tag to an agent |

### Organization

| Tool | Description |
|------|-------------|
| `lofty_get_organization` | Get organization details |
| `lofty_update_company` | Update company information |
| `lofty_add_office` | Add an office |
| `lofty_update_office` | Update an office |
| `lofty_list_permission_profiles` | List permission profiles |

### Manual Logs

| Tool | Description |
|------|-------------|
| `lofty_list_log_types` | List manual log types |
| `lofty_get_log_type` | Get a log type by ID |
| `lofty_create_log_type` | Create a manual log type |

### System Logs

| Tool | Description |
|------|-------------|
| `lofty_list_system_logs` | List system logs with filtering |

### AI Features

| Tool | Description |
|------|-------------|
| `lofty_list_lead_analysis` | List AI lead analyses |
| `lofty_create_lead_analysis` | Create an AI lead analysis |
| `lofty_generate_call_script` | Generate an AI call script |
| `lofty_get_call_summary` | Get an AI call summary |
| `lofty_generate_call_summary` | Generate an AI call summary |
| `lofty_prepare_insight` | Prepare an AI insight for a lead |

### Sales Agents

| Tool | Description |
|------|-------------|
| `lofty_get_current_sales_agent` | Get the current Sales Agent profile |
| `lofty_get_sales_agent_by_lead` | Get the Sales Agent assigned to a lead |
| `lofty_get_sales_agent_quota` | Get Sales Agent quota |
| `lofty_get_working_leads` | Query working leads (paginated) |
| `lofty_check_working_lead` | Check if a lead is a working lead |
| `lofty_batch_add_working_leads` | Batch add leads to working pool |
| `lofty_mute_working_lead` | Mute a working lead |
| `lofty_get_sales_agent_settings` | Get Sales Agent settings |
| `lofty_update_sales_agent_settings` | Update Sales Agent settings |
| `lofty_get_lead_mute_status` | Get mute status for a lead |
| `lofty_get_plan_tasks_by_lead` | Get plan tasks for a lead |
| `lofty_batch_create_plan_tasks` | Batch create plan tasks |
| `lofty_send_sms_via_ai_number` | **WARNING: Sends a REAL SMS.** Send SMS via the AI number |

### Notifications

| Tool | Description |
|------|-------------|
| `lofty_send_email_to_agent` | **WARNING: Sends a REAL email.** Send email notification to the agent |
| `lofty_send_sms_to_agent` | **WARNING: Sends a REAL SMS.** Send SMS notification to the agent |
| `lofty_send_task_reminder_push` | Send a task reminder push notification |

### Identity

| Tool | Description |
|------|-------------|
| `lofty_get_vendor_info` | Get vendor/API identity information |

## Architecture

```
lofty-mcp/
├── api/
│   └── index.ts              # Vercel serverless entry point
├── src/
│   ├── index.ts              # Local stdio entry point
│   ├── server.ts             # Express app with OAuth + MCP (hosted mode)
│   ├── client.ts             # Lofty API client (auth, requests, response helpers)
│   ├── types.ts              # Shared TypeScript interfaces
│   ├── auth/
│   │   ├── provider.ts       # OAuth provider implementation
│   │   ├── crypto.ts         # API key encryption/decryption
│   │   ├── store.ts          # Auth code storage (Vercel KV)
│   │   └── pages.ts          # OAuth authorization page HTML
│   └── tools/
│       ├── leads.ts          # Lead management
│       ├── communication.ts  # Email, SMS, call/text history
│       ├── notes.ts          # Lead notes
│       ├── calls.ts          # Call records and recordings
│       ├── tasks.ts          # Tasks v1 and appointments
│       ├── tasks-v2.ts       # Tasks v2 with composite IDs
│       ├── calendar.ts       # Calendar v2 events and meetings
│       ├── transactions.ts   # Transaction management
│       ├── members.ts        # Team member management
│       ├── listings.ts       # Property listings
│       ├── webhooks.ts       # Event subscriptions
│       ├── team-features.ts  # Tags, custom fields, lead ponds
│       ├── routing.ts        # Lead routing rules
│       ├── agents.ts         # Agent user management
│       ├── organization.ts   # Organization and office settings
│       ├── manual-logs.ts    # Manual log types
│       ├── system-logs.ts    # System audit logs
│       ├── ai-features.ts    # AI lead analysis, call scripts, summaries
│       ├── sales-agents.ts   # Sales Agent management and working leads
│       ├── notifications.ts  # Agent email, SMS, and push notifications
│       └── identity.ts       # Vendor/API identity
├── vercel.json               # Vercel routing configuration
├── tsconfig.json
└── package.json
```

## Deployment (Vercel)

### Prerequisites

- A [Vercel](https://vercel.com) account
- [Vercel KV](https://vercel.com/docs/storage/vercel-kv) store (for auth code storage)

### Environment Variables

| Variable | Description |
|----------|-------------|
| `SERVER_URL` | Your deployed Vercel URL (e.g. `https://lofty-mcp.vercel.app`) |
| `ENCRYPTION_KEY` | 64-character hex string for encrypting API keys |
| `KV_REST_API_URL` | Vercel KV REST API URL |
| `KV_REST_API_TOKEN` | Vercel KV REST API token |

Generate an encryption key:

```bash
openssl rand -hex 32
```

### Deploy

```bash
npm install -g vercel
vercel --prod
```

## Local Development

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run in stdio mode (for Claude Desktop)
npm start

# Run HTTP server locally (for testing hosted mode)
LOFTY_API_KEY=your-key SERVER_URL=http://localhost:3000 npm run start:server

# Watch mode for development
npm run dev
```

## Environment Variables

| Variable | Required | Mode | Description |
|----------|----------|------|-------------|
| `LOFTY_API_KEY` | Yes (stdio) | Local | Your Lofty API key |
| `SERVER_URL` | Yes (hosted) | Hosted | Deployed server URL |
| `ENCRYPTION_KEY` | Yes (hosted) | Hosted | 64-char hex string for API key encryption |
| `KV_REST_API_URL` | Yes (hosted) | Hosted | Vercel KV REST API URL |
| `KV_REST_API_TOKEN` | Yes (hosted) | Hosted | Vercel KV REST API token |

## Safety

All delete operations (`lofty_delete_lead`, `lofty_delete_note`, `lofty_delete_task`, `lofty_delete_task_v2`, `lofty_delete_calendar_event`, `lofty_delete_webhook`, `lofty_delete_log_type`) are **intentionally disabled** and will return an error message if invoked. This prevents accidental data loss when used with AI assistants.

Tools that send real emails or SMS messages (`lofty_send_email`, `lofty_send_sms`, `lofty_send_email_to_agent`, `lofty_send_sms_to_agent`, `lofty_send_sms_via_ai_number`) include explicit **WARNING** labels in their descriptions. Always confirm content with the user before invoking these tools.

## Links

- [Lofty API Documentation](https://developer.lofty.com)
- [Model Context Protocol](https://modelcontextprotocol.io)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)

## License

MIT

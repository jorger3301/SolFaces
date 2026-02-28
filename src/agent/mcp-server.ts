// ═══════════════════════════════════════════════════════════════
// SOLFACES — MCP Server
// Standalone Model Context Protocol server for Claude Code,
// Cursor, Windsurf, and any MCP-compatible client.
//
// Usage:
//   npx solfaces
//   node dist/agent/mcp-server.cjs
//
// Claude Code config (~/.claude/settings.json):
//   {
//     "mcpServers": {
//       "solfaces": { "command": "npx", "args": ["solfaces-mcp"] }
//     }
//   }
// ═══════════════════════════════════════════════════════════════

import { SOLFACE_TOOLS } from "./tools";
import type { SolFaceTool } from "./tools";

interface MCPRequest {
  jsonrpc: "2.0";
  id: number | string;
  method: string;
  params?: Record<string, unknown>;
}

interface MCPResponse {
  jsonrpc: "2.0";
  id: number | string;
  result?: unknown;
  error?: { code: number; message: string };
}

// ─── JSON-RPC over stdio ────────────────────────

function send(response: MCPResponse): void {
  const json = JSON.stringify(response);
  const msg = `Content-Length: ${Buffer.byteLength(json)}\r\n\r\n${json}`;
  process.stdout.write(msg);
}

function handleRequest(req: MCPRequest): MCPResponse | null {
  const { id, method, params } = req;

  if (method === "initialize") {
    return {
      jsonrpc: "2.0",
      id,
      result: {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        serverInfo: {
          name: "solfaces",
          version: "1.0.0",
        },
      },
    };
  }

  if (method === "notifications/initialized") {
    return null; // Notifications get no response per JSON-RPC 2.0
  }

  if (method === "tools/list") {
    return {
      jsonrpc: "2.0",
      id,
      result: {
        tools: SOLFACE_TOOLS.map((t: SolFaceTool) => ({
          name: t.name,
          description: t.description,
          inputSchema: t.parameters,
        })),
      },
    };
  }

  if (method === "tools/call") {
    const p = params as Record<string, unknown> | undefined;
    if (!p || typeof p.name !== "string") {
      return {
        jsonrpc: "2.0",
        id,
        error: { code: -32602, message: "Missing required 'name' parameter in tools/call" },
      };
    }
    const toolName = p.name as string;
    const toolArgs = (p.arguments ?? {}) as Record<string, unknown>;

    const tool = SOLFACE_TOOLS.find((t) => t.name === toolName);
    if (!tool) {
      return {
        jsonrpc: "2.0",
        id,
        error: { code: -32601, message: `Unknown tool: ${toolName}` },
      };
    }

    try {
      const result = tool.handler(toolArgs);
      const text = typeof result === "string" ? result : JSON.stringify(result, null, 2);
      return {
        jsonrpc: "2.0",
        id,
        result: {
          content: [{ type: "text", text }],
        },
      };
    } catch (err) {
      return {
        jsonrpc: "2.0",
        id,
        error: {
          code: -32603,
          message: err instanceof Error ? err.message : String(err),
        },
      };
    }
  }

  return {
    jsonrpc: "2.0",
    id,
    error: { code: -32601, message: `Method not found: ${method}` },
  };
}

// ─── Stdio Transport ────────────────────────────

let buffer = "";

process.stdin.setEncoding("utf-8");
process.stdin.on("data", (chunk: string) => {
  buffer += chunk;

  // Parse Content-Length delimited messages
  while (true) {
    const headerEnd = buffer.indexOf("\r\n\r\n");
    if (headerEnd === -1) break;

    const header = buffer.slice(0, headerEnd);
    const match = header.match(/Content-Length:\s*(\d+)/i);
    if (!match) {
      buffer = buffer.slice(headerEnd + 4);
      continue;
    }

    const contentLength = parseInt(match[1], 10);
    const bodyStart = headerEnd + 4;

    if (buffer.length < bodyStart + contentLength) break;

    const body = buffer.slice(bodyStart, bodyStart + contentLength);
    buffer = buffer.slice(bodyStart + contentLength);

    try {
      const req = JSON.parse(body) as MCPRequest;
      const res = handleRequest(req);
      // Don't send response for notifications
      if (res && req.id !== undefined) {
        send(res);
      }
    } catch {
      // Skip malformed messages
    }
  }
});

process.stderr.write("SolFaces MCP server started\n");

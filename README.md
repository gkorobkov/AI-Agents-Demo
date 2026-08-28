# AI Agent Chat

Web interface for AI agents powered by [n8n](https://n8n.io) workflows.  
Paste a webhook URL — start chatting instantly.

## ToC

- [Quick start](#quick-start)
- [Features](#features)
- [UI/UX](#uiux)
  - [Transport modes](#transport-modes)
  - [How requests are built](#how-requests-are-built)
  - [How responses are parsed](#how-responses-are-parsed)
  - [Sectioned debug inspector](#sectioned-debug-inspector)
  - [Message formatting](#message-formatting)
  - [Storage and security](#storage-and-security)
- [License](#license)
- [LLM GPT Models](#llm-gpt-models)
  - [✅ Free providers (available in the list)](#free-providers-available-in-the-list)
  - [❌ Other providers in the list — paid only](#other-providers-in-the-list-paid-only)

## Quick start

```
ui-start.cmd              # serve UI at http://localhost:8080/
ui-start.cmd 3000         # use another port: http://localhost:3000/
ui-build.cmd              # increment version + copy to .build/ui/
ui-deploy.cmd             # scp .build/ui/* to server
```

Configure deploy target in `.env`:
```
DEPLOY_USER=user
DEPLOY_HOST=example.com
DEPLOY_PATH=/var/www/ai-agent-demo/
```

## Features

- One chat UI with three transports: Webhook, OpenAI-compatible API, and local Stub responses
- Webhook support for GET/POST, PROD/TEST URLs, session IDs, and recent connections
- Direct OpenAI-compatible `/v1/chat/completions` requests with model parameters and named local profiles
- Read-only OpenAI request preview with safe JSON and cURL copying
- Deployable Stub JSON file for testing messages, debug blocks, suggestions, and simulated latency without a backend
- Source labels on responses for comparing Webhook, OpenAI, and Stub results in one chat
- Collapsible and pinnable settings panels with automatic field persistence
- Structured debug output, request timing, token usage, and error rendering
- Editable, repeatable, copyable, and removable chat messages
- Dark/light themes, responsive desktop/mobile layout, and RU/EN localization
- Controlled HTML-like response formatting with sanitized external links
- API keys kept in `sessionStorage`; profiles never contain API keys

## UI/UX

The page provides one visible chat and one message composer. The transport selector in the header determines where the next message is sent. The compact label beside the composer repeats the active transport so the destination is visible immediately before sending.

Each transport has its own settings panel. Panels open below the header as overlays, can be pinned while testing the chat, and do not resize the message area. Settings are applied automatically on change or when leaving a field; validation errors are shown inline.

Assistant messages include a source label such as:

```text
Webhook · POST · example.com/webhook/chat
OpenAI · qwen3.8-27b · 842 ms
Stub · stub_json.json · 500 ms
```

### Transport modes

| Mode | Purpose | Network request |
|---|---|---|
| **Webhook** | Connect n8n, Make, Activepieces, or a custom low-code/backend endpoint | GET or POST to the configured URL |
| **OpenAI API** | Call an OpenAI-compatible chat completion endpoint directly from the browser | POST to `{baseUrl}/chat/completions` |
| **Stub** | Preview response rendering when no model or backend is available | Static `GET ./stub_json.json` when selected; no model/backend request |

#### Webhook

Webhook settings include the HTTP method, PROD/TEST URL variant, URL history, and session ID. Recent connections store the URL together with the method and environment, so selecting an old entry restores the complete connection.

The default request contract is intentionally small:

```json
{
  "message": "Hello",
  "sessionId": "generated-session-id"
}
```

#### OpenAI API

OpenAI settings include Base URL, API key, model, system prompt, temperature, maximum output tokens, and named profiles. Profiles are stored locally but never include the API key.

The panel separates actual OpenAI API fields from browser UI behavior. The history option is UI logic rather than a separate OpenAI API parameter. Previous messages exist only in the current page DOM and are converted into entries in `messages[]` before sending.

Only turns created in OpenAI mode for the current OpenAI profile/conversation are included. Webhook and Stub turns are excluded. Reloading the page, clearing the chat, or creating a new session resets this context.

#### Stub

Stub mode exposes the deployable file `ui/stub_json.json`. Selecting Stub loads `./stub_json.json` with `fetch`; sending then uses that loaded document locally and never calls a model or backend endpoint. There is no text-debug preset. A loading or file error is shown inline, and a failed load is never replaced by an embedded fallback answer. Stub can simulate 0, 500, or 1500 ms latency and independently enable suggestion chips or the focused Backend debug section.

### How requests are built

#### Webhook GET

For GET, the UI appends URL-encoded query parameters:

```http
GET https://example.com/webhook/chat?sessionId=...&message=Hello
```

#### Webhook POST

For POST, the UI sends JSON:

```http
POST https://example.com/webhook/chat
Content-Type: application/json
```

```json
{
  "message": "Hello",
  "sessionId": "generated-session-id"
}
```

#### OpenAI-compatible request

The UI sends:

```http
POST https://api.example.com/v1/chat/completions
Authorization: Bearer $OPENAI_API_KEY
Content-Type: application/json
```

Example body without previous messages:

```json
{
  "model": "qwen3.8-27b",
  "messages": [
    { "role": "system", "content": "Answer briefly." },
    { "role": "user", "content": "What is RAG?" }
  ],
  "temperature": 0.7,
  "max_tokens": 500
}
```

When browser-managed history is enabled, the order is:

```text
messages[]
  1. system prompt, if configured
  2. previous OpenAI user/assistant turns from the current profile
  3. current user message
```

For example:

```json
{
  "messages": [
    { "role": "system", "content": "Answer briefly." },
    { "role": "user", "content": "What is RAG?" },
    { "role": "assistant", "content": "RAG combines retrieval with generation." },
    { "role": "user", "content": "Give me an example." }
  ]
}
```

The expanded **Request preview** shows the exact endpoint, sanitized headers, and body produced for the next request. The preview and the real `fetch` call use the same request builder. Copied cURL commands use `$OPENAI_API_KEY` and never expose the real key.

### How responses are parsed

#### Webhook response

The Webhook transport expects JSON. If the top-level response is an array, the first item is used. The assistant text is selected in this order:

```text
message → text → output
```

Recommended response:

```json
{
  "text": "<b>Result</b>\nThe operation completed.",
  "debug": {
    "latency_ms": 420,
    "tools": ["search"]
  },
  "suggestions": ["Show details", "Try again"]
}
```

Supported optional fields:

- `debug`: a string or an object; shown both inside the complete response and in the focused **Backend debug** section.
- `suggestions`: an array of strings; rendered as buttons that submit their text back through the currently selected transport.
- `error`: displayed as an agent error instead of a normal response.

If the response is a non-empty JSON object without `message`, `text`, `output`, or `error`, the complete object is displayed as formatted JSON. Invalid JSON, an empty response, HTTP errors, network failures, and timeouts are rendered as chat errors.

#### OpenAI response

The OpenAI transport reads:

```text
choices[0].message.content
```

The visible reply still comes from `choices[0].message.content`. The Debug inspector keeps the complete parsed response, including the complete `choices[]`, message fields, reasoning content, tool calls, usage details, and provider-specific fields. A separate UI-generated Summary derives only concise facts such as response ID, model, `finish_reason`, HTTP status, token total, and elapsed time.

Tool execution is not implemented in this stage. If a model returns tool calls without text, the chat shows an explanatory message instead of failing silently.

#### Stub response

Stub responses use the same rendering path as live responses. This makes it possible to verify HTML-like text, object or string debug payloads, suggestion buttons, source labels, and typing latency without a working API.

### Sectioned debug inspector

Every successful transport response can have one outer **Debug** disclosure. The global debug control still cycles between expanded, collapsed, and hidden states. Expanding the outer block reveals consistent nested disclosures:

Before rendering, every transport adapter produces the same normalized contract with schema identifier `ai-agent-debug/v1`:

```json
{
  "schema": "ai-agent-debug/v1",
  "summary": {
    "status": "ok",
    "transport": "openai",
    "model": "provider/model",
    "response_id": "chatcmpl_123",
    "finish_reason": "stop"
  },
  "request": {
    "method": "POST",
    "endpoint": "https://api.example/v1/chat/completions",
    "headers": { "Authorization": "Bearer $OPENAI_API_KEY" },
    "body": {}
  },
  "response": { "http_status": 200, "output_role": "assistant" },
  "usage": {
    "input_tokens": 12,
    "output_tokens": 8,
    "total_tokens": 20,
    "cached_tokens": 4,
    "raw": {}
  },
  "timing": { "elapsed_ms": 842 },
  "trace": null,
  "error": null,
  "raw_response": {}
}
```

The stable groups are:

- `summary`: normalized status, transport, model, response ID, and finish reason.
- `request`: exact method, endpoint, sanitized headers, and body selected or sent by the UI.
- `response`: HTTP/status metadata and metadata about the extracted output.
- `usage`: normalized input/output/total/cached counts plus the provider's untouched usage object in `raw`.
- `timing`: elapsed UI measurement and optional provider/backend timing values.
- `trace`: optional backend debug or tool steps.
- `error`: normalized error value or `null`.
- `raw_response`: complete parsed provider, backend, or Stub document.

| Section | Source | Contents |
|---|---|---|
| **Summary** | Generated by the browser UI | Concise normalized facts: transport, method/endpoint or local mode, HTTP status, model/response ID/finish reason, elapsed time, and a token total when available. It is open by default inside an expanded Debug block. |
| **Request** | Sent or selected by the UI | Webhook method, URL, query/body and session ID; OpenAI endpoint, sanitized headers and the exact shared-builder JSON body; or local Stub/inline JSON settings with `network: false`. |
| **Full response** | `raw_response` | The complete parsed response object or array. It is collapsed by default and is not reconstructed from selected fields. |
| **Backend debug** | Supplied by the backend or Stub preset | A focused view of the response's `debug` field, preserving either string or object form. The section appears only when that value is available and enabled for Stub. |
| **Timing & usage** | UI timing plus server metadata | Elapsed browser measurement and HTTP status; for OpenAI, the exact `usage` object including any provider-specific nested token details. |

The visual inspector is derived from that contract:

```text
Debug                         [copy complete package]
  Summary (UI-generated)      [copy section]
  Request (Sent by UI)        [copy section]
  Full response (Server-provided / Local preset)
  Backend debug (Server-provided / Local preset)
  Timing & usage (UI-generated)
```

Older screenshots omitted OpenAI `choices` because the UI previously reconstructed one reduced debug object from `id`, `model`, `finish_reason`, `usage`, and `tool_calls`. The OpenAI adapter now uses three separate paths from the same parsed response:

```text
choices[0].message.content → visible assistant text
selected response fields   → UI-generated Summary
complete parsed data       → raw_response → Full response (complete choices[] and provider fields)
```

Webhook GET/POST maps HTTP metadata and the selected `message → text → output` field into `response`, backend `debug` into `trace`, and keeps the complete parsed JSON—including `debug`, `suggestions`, and extra fields—in `raw_response`. Inline JSON uses the same adapter with transport `webhook-inline` and a local request descriptor.

The Stub adapter maps the selected filename and user message into `request`, file/output metadata into `response`, the measured/simulated delay into `timing`, optional file `debug` into `trace`, and the complete loaded `stub_json.json` document into `raw_response`. Disabling Stub debug hides the focused trace section but never alters `raw_response`.

Each inner section has its own copy action. The outer copy action produces the complete normalized `ai-agent-debug/v1` object. Request credentials are sanitized: OpenAI Authorization is always shown as `Bearer $OPENAI_API_KEY`, and the real API key is never placed in the inspector or copied debug contract.

### Message formatting

User messages are always rendered as plain text.

Assistant responses support a deliberately small sanitized HTML-like subset:

| Markup | Result |
|---|---|
| `<b>`, `<strong>` | Bold text |
| `<i>`, `<em>` | Italic text |
| `<u>` | Underlined text |
| `<small>` | Secondary/small text |
| `<code>` | Inline code |
| `<pre>` | Preformatted code or JSON block |
| `<a href="https://...">` | External link opened in a new tab |

Line breaks (`\n`) are preserved. Links are accepted only for `http://` and `https://` URLs and receive `noopener noreferrer`. Unsupported tag names are removed. Plain responses without tags are HTML-escaped before display.

Each assistant bubble also has a copy action. User messages can be edited, resent, or deleted; assistant messages can be copied or deleted.

### Storage and security

| Data | Storage |
|---|---|
| Visible chat messages | Current page DOM only; lost on reload |
| OpenAI API key | `sessionStorage`; removed when the browser session ends |
| Webhook URL, method, recents, UI preferences | `localStorage` |
| OpenAI settings and named profiles | `localStorage`, without API keys |
| Stub settings | `localStorage` |

The API key is never included in profiles, request previews, copied JSON, copied cURL, debug output, URLs, or console logs. Direct browser calls still require the API server to permit the page origin and `Authorization` header through CORS.

## License

Free for non-commercial use · Commercial use requires a paid license  
See [LICENSE](LICENSE) · Contact: gkorobkov@gmail.com


Of all the providers shown in the screenshots, here are the ones that offer **free access with limits**:

---

## LLM GPT Models

### ✅ Free providers (available in the list)

**🟠 Groq Chat Model**
- Model: `llama-3.3-70b-versatile`
- Free API key, no credit card required
- Limits: tokens per minute/day (see [console.groq.com/docs/rate-limits](https://console.groq.com/docs/rate-limits))
- ✅ Supports tool calling, JSON, fast

**🔵 OpenRouter Chat Model**
- Free models via `openrouter/free` or `openai/gpt-oss-20b:free`
- Limits: ~20 req/min, 200 req/day on free models
- ✅ Already integrated in the course project

**🔴 Google Gemini Chat Model**
- Model: `gemini-2.5-flash-lite-preview-09-2025` via Google AI Studio
- Free tier available
- ✅ OpenAI-compatible endpoint, suitable for most educational tasks

---

### ❌ Other providers in the list — paid only

| Provider | Status |
|---|---|
| Anthropic Chat Model | Paid only |
| Azure OpenAI Chat Model | Paid only |
| AWS Bedrock Chat Model | Paid only |
| Cohere Chat Model | Paid only (trial available) |
| DeepSeek Chat Model | ~Free chat, but API is paid |
| Google Vertex Chat Model | Paid (not to be confused with Gemini AI Studio) |
| Mistral Cloud Chat Model | Experiment plan — free, but prompts are used for training |
| OpenAI Chat Model | Paid only |
| xAI Grok Chat Model | Paid only |
| Lemonade / Ollama | Local run, free, but requires your own hardware |

---

**Recommendation for the course workflow:** use **Groq** as the primary free provider (no daily request limit, only token rate limit), **OpenRouter** as fallback, and **Google Gemini** via AI Studio when a large context window is needed.

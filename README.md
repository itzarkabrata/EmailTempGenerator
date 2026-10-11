# AI-Powered Email Template Generator Service

A backend microservice (Express.js, ES modules) that generates short, customer-friendly email templates from three inputs: `purpose`, `recipient_name` and `tone`. It uses Google Gemini through the official `@google/genai` SDK.

## Features

- `POST /api/emails/generate` returns a structured `{ subject, body }` template
- Clean separation of layers: routes, controller, service, AI service
- Input validation and sanitising
- API key and model configured through environment variables
- Response time logs for every AI call (simple timestamp diff)
- Centralised error handling with one consistent error shape

## Tech Stack

- Node.js 18+ with ES modules
- Express.js
- Google Gemini (`@google/genai`)
- dotenv, cors

## Project Structure

```
EmailTempGenerator/
├── src/
│   ├── config/
│   │   └── config.env.js        # loads and validates environment variables
│   ├── controllers/
│   │   └── email.controller.js  # HTTP layer only (request -> response)
│   ├── middleware/
│   │   ├── error.js             # centralised error handler
│   │   └── validate.js          # request body validation
│   ├── prompts/
│   │   └── email.prompt.js      # system prompt, user prompt builder, response schema
│   ├── routes/
│   │   └── email.routes.js      # route definitions
│   ├── services/
│   │   ├── ai.service.js        # Gemini client, timing logs, error mapping
│   │   └── email.service.js     # business logic: prompt -> AI -> parse result
│   ├── utils/
│   │   ├── error.js             # custom AppError class
│   │   └── logger.js            # structured JSON logger
│   ├── app.js                   # express app, middleware, routes
│   └── server.js                # entry point
├── .env.example
├── .gitignore
└── package.json
```

Request flow:

```
route -> validate middleware -> controller -> email.service -> ai.service -> Gemini
```

## Setup Instructions

**Prerequisites:** Node.js 18 or later, and a free Gemini API key from [Google AI Studio](https://aistudio.google.com/).

```bash
# 1. Clone the repository
git clone https://github.com/itzarkabrata/EmailTempGenerator.git
cd EmailTempGenerator

# 2. Install dependencies
npm install

# 3. Create your environment file
cp .env.example .env
# then open .env and set GEMINI_API_KEY

# 4. Start the server
npm run dev      # development (auto-restarts on file changes)
npm start        # production
```

The server starts on `http://localhost:5000` by default. Restart it after changing `.env`, because environment variables are only read at startup.

### Environment Variables

| Variable | Default | Description |
|---|---|---|
| `GEMINI_API_KEY` | (required) | Gemini API key. The server refuses to start without it. |
| `GEMINI_MODEL` | `gemini-flash-latest` | Gemini model name. This project uses `gemini-3.5-flash-lite`. |
| `AI_MAX_TOKENS` | `1024` | Maximum output tokens per AI call. |
| `AI_TIMEOUT_MS` | `20000` | Timeout for each AI call, in milliseconds. |
| `PORT` | `5000` | Server port. |
| `FRONTEND_URL` | `http://localhost:3000` | Allowed CORS origin. |

The `.env` file is git-ignored, so the API key is never committed.

## API Documentation

### `POST /api/emails/generate`

Generates an email template.

**Request body**

| Field | Type | Rules |
|---|---|---|
| `purpose` | string | 3-300 characters |
| `recipient_name` | string | 1-80 characters |
| `tone` | string | one of: `formal`, `friendly`, `professional`, `casual`, `apologetic`, `persuasive`, `empathetic` |

**Example request**

```bash
curl -X POST http://localhost:5000/api/emails/generate \
  -H "Content-Type: application/json" \
  -d '{
    "purpose": "Just a casual Invitation mail for a Team lunch in a company",
    "recipient_name": "Arkabrata Chandra",
    "tone": "professional"
  }'
```

**Sample response (200 OK)**

```json
{
  "success": true,
  "message": "Email template generated successfully",
  "timestamp": "2026-10-11T07:23:29.722Z",
  "data": {
    "subject": "Invitation: Team Lunch",
    "body": "Dear Arkabrata Chandra,\n\nI hope this email finds you well. We are organizing a team lunch to connect and unwind together outside of our usual daily routines.\n\nThe lunch is scheduled for [DATE] at [TIME] at [LOCATION]. Please let us know if you have any dietary restrictions so we can accommodate them.\n\nPlease RSVP by [RSVP_DATE] so we can finalize the reservation.\n\nBest regards,\n[SENDER_NAME]",
    "tone": "professional",
    "recipient_name": "Arkabrata Chandra"
  },
  "meta": {
    "requestId": "2574ee14-950b-4415-a9f3-ff8315b5c1f4",
    "aiLatencyMs": 1341
  }
}
```

The `body` is plain text with `\n` line breaks, so it can be pasted into any email client. Placeholders such as `[DATE]` and `[SENDER_NAME]` are intentional (see "Prompt Design" below).

**Error responses**

All errors share one shape:

| Field | Description |
|---|---|
| `success` | Always `false` for errors |
| `requestId` | Unique ID for the request (also sent in the `X-Request-Id` header) |
| `timestamp` | ISO 8601 time of the response |
| `message` | Human-readable error message |
| `details` | Optional array with specifics (used for validation errors) |

| Status | When |
|---|---|
| `400` | Validation failed (missing or invalid fields, invalid JSON) |
| `404` | Unknown route |
| `429` | Gemini free-tier rate limit reached |
| `502` | AI provider failed, timed out, or returned an unparseable response |
| `500` | Unexpected server error |

Example validation error (`400`):

```json
{
  "success": false,
  "requestId": "52427ee5-4306-46a1-8041-365d3f8fe129",
  "timestamp": "2026-10-11T07:27:37.270Z",
  "message": "Validation failed",
  "details": [
    "tone must be one of: formal, friendly, professional, casual, apologetic, persuasive, empathetic"
  ]
}
```

### `GET /health`

Returns `{ "status": "ok" }`.

## Response Time Logs

Every AI call is timed with a simple timestamp difference (`performance.now()` before and after the call). The result is logged as structured JSON and also returned to the client as `meta.aiLatencyMs`.

```json
{"ts":"2026-10-11T07:23:29.721Z","level":"info","message":"ai_call_completed","requestId":"2574ee14-950b-4415-a9f3-ff8315b5c1f4","model":"gemini-3.5-flash-lite","latencyMs":1341,"inputTokens":213,"outputTokens":120}
```

Failed calls are logged as `ai_call_failed` with the latency and status code. Every request carries an `X-Request-Id` header, so a response can be matched to its log lines.

## Prompt Design

1. **Role and constraints in the system instruction.** The fixed rules live in the system instruction: write a short template (about 120 words), be customer-friendly, greet the recipient by name, match the requested tone, and end with one clear next step. Keeping these rules separate from the request makes the output consistent.
2. **User input is treated as data.** `purpose`, `recipient_name` and `tone` are placed inside XML tags in the user message, and the system instruction states that tag contents are data, not instructions. Inputs are also length-limited and stripped of `<` and `>`, which reduces prompt-injection risk.
3. **Placeholders instead of invented facts.** The model is told to use `[PLACEHOLDERS]` (for example `[DATE]`, `[LOCATION]`, `[SENDER_NAME]`) for anything it cannot know. The result is a reusable template that never contains made-up details.
4. **Structured output.** The request uses Gemini's JSON response schema (`subject` and `body`, both required), so the API enforces the shape. The service still parses and validates the result, and returns a `502` if it is malformed.
5. **Cost and latency control.** A lightweight Flash-Lite model, a capped `max_tokens`, a short word limit and a request timeout keep calls fast and cheap. This matters on the free tier.

## Design Decisions

- **Controller vs service:** the controller handles HTTP only. Prompt building, AI calls and parsing live in the services, so each layer can be tested on its own.
- **Provider isolation:** only `ai.service.js` knows about Gemini. Switching providers or SDK APIs touches that one file.
- **Fail-fast configuration:** missing required environment variables stop the server at startup instead of failing on the first request.
- **Consistent errors:** every error goes through one error handler and returns the same JSON shape.

## Possible Improvements

- Response caching for identical requests (saves free-tier quota)
- Rate limiting per client
- Unit tests with the AI service mocked
- Dockerfile and CI pipeline
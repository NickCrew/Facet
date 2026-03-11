import { createServer } from 'node:http'
import Anthropic from '@anthropic-ai/sdk'

// ── Configuration (all overridable via .env) ────────────────────────
const PORT = parseInt(process.env.PORT ?? '9001', 10)
const DEFAULT_MODEL = process.env.MODEL ?? 'claude-sonnet-4-20250514'
const DEFAULT_MAX_TOKENS = parseInt(process.env.MAX_TOKENS ?? '4096', 10)
const MAX_REQUEST_TOKENS = parseInt(process.env.MAX_REQUEST_TOKENS ?? String(DEFAULT_MAX_TOKENS), 10)
const MAX_BODY_BYTES = parseInt(process.env.MAX_BODY_BYTES ?? '1048576', 10)
const DEFAULT_TEMPERATURE = parseFloat(process.env.DEFAULT_TEMPERATURE ?? '')
const DEFAULT_THINKING_BUDGET = parseInt(process.env.THINKING_BUDGET ?? '0', 10)
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? 'http://localhost:5173,http://127.0.0.1:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)
const PROXY_API_KEY = process.env.PROXY_API_KEY ?? 'facet-local-proxy'
const USING_DEFAULT_PROXY_API_KEY = PROXY_API_KEY === 'facet-local-proxy'

// Model aliases — the app can send short names instead of full model IDs
const MODEL_ALIASES = {
  haiku: 'claude-haiku-4-5-20251001',
  sonnet: 'claude-sonnet-4-20250514',
  opus: 'claude-opus-4-20250514',
}
const ALLOWED_MODEL_VALUES = new Set([DEFAULT_MODEL, ...Object.keys(MODEL_ALIASES), ...Object.values(MODEL_ALIASES)])
const ALLOWED_TOOL_TYPES = new Set(['web_search_20250305'])

const client = new Anthropic() // reads ANTHROPIC_API_KEY from env

function resolveModel(requested) {
  if (!requested) return DEFAULT_MODEL
  return MODEL_ALIASES[requested] ?? requested
}

function isAllowedOrigin(origin) {
  return ALLOWED_ORIGINS.includes(origin)
}

function hasValidMessages(messages) {
  return Array.isArray(messages) && messages.every((message) => (
    message &&
    typeof message === 'object' &&
    typeof message.role === 'string' &&
    (typeof message.content === 'string' || Array.isArray(message.content))
  ))
}

function normalizeTools(tools) {
  if (!Array.isArray(tools)) {
    return []
  }

  return tools.flatMap((tool) => {
    if (!tool || typeof tool !== 'object') {
      return []
    }

    const normalized = {
      type: tool.type,
      name: tool.name,
      max_uses:
        typeof tool.max_uses === 'number'
          ? Math.max(1, Math.min(15, Math.floor(tool.max_uses)))
          : undefined,
    }

    if (
      !ALLOWED_TOOL_TYPES.has(normalized.type) ||
      normalized.name !== 'web_search'
    ) {
      return []
    }

    return [normalized.max_uses ? normalized : { type: normalized.type, name: normalized.name }]
  })
}

/** Parse JSON body from incoming request */
function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let bytesRead = 0
    let isClosed = false
    req.on('data', (chunk) => {
      if (isClosed) {
        return
      }
      bytesRead += chunk.length
      if (bytesRead > MAX_BODY_BYTES) {
        isClosed = true
        reject(new Error(`Request body exceeds ${MAX_BODY_BYTES} bytes`))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => {
      if (isClosed) {
        return
      }
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString()))
      } catch {
        reject(new Error('Invalid JSON body'))
      }
    })
    req.on('error', (error) => {
      if (isClosed) {
        return
      }
      reject(error)
    })
  })
}

/** CORS headers for local Vite dev server */
function setCors(req, res) {
  const origin = req.headers.origin
  if (origin && isAllowedOrigin(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Vary', 'Origin')
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key, X-Proxy-API-Key')
}

function sendJson(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(data))
}

const server = createServer(async (req, res) => {
  setCors(req, res)

  if (!req.headers.origin || !isAllowedOrigin(req.headers.origin)) {
    sendJson(res, 403, { error: 'Origin not allowed' })
    return
  }

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  if (req.headers['x-proxy-api-key'] !== PROXY_API_KEY) {
    sendJson(res, 401, { error: 'Invalid proxy API key' })
    return
  }

  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed' })
    return
  }

  try {
    const body = await readBody(req)
    const { system, messages, temperature, max_tokens, model, thinking_budget, tools } = body

    if (!hasValidMessages(messages)) {
      sendJson(res, 400, { error: 'Missing or invalid "messages" array' })
      return
    }

    const resolvedModel = resolveModel(model)
    if (!ALLOWED_MODEL_VALUES.has(resolvedModel)) {
      sendJson(res, 400, { error: 'Requested model is not allowed' })
      return
    }

    // Per-request thinking budget overrides server default
    const thinkingBudget = thinking_budget ?? DEFAULT_THINKING_BUDGET
    const useThinking = thinkingBudget > 0

    // Server env temperature wins when set; then request value; then 0.3 fallback
    const resolvedTemp = !Number.isNaN(DEFAULT_TEMPERATURE)
      ? DEFAULT_TEMPERATURE
      : (temperature ?? 0.3)
    const resolvedMaxTokens = Math.max(
      1,
      Math.min(
        MAX_REQUEST_TOKENS,
        typeof max_tokens === 'number' ? Math.floor(max_tokens) : DEFAULT_MAX_TOKENS,
      ),
    )
    const normalizedTools = normalizeTools(tools)
    if (Array.isArray(tools) && normalizedTools.length !== tools.length) {
      sendJson(res, 400, { error: 'One or more requested tools are not allowed' })
      return
    }

    const params = {
      model: resolvedModel,
      max_tokens: resolvedMaxTokens,
      system: system || undefined,
      messages,
      ...(normalizedTools.length > 0 ? { tools: normalizedTools } : {}),
    }

    if (useThinking) {
      params.thinking = { type: 'enabled', budget_tokens: thinkingBudget }
      // temperature must be omitted when thinking is enabled
    } else {
      params.temperature = resolvedTemp
    }

    const start = Date.now()
    const result = await client.messages.create(params)
    const elapsed = Date.now() - start

    console.log(`[proxy] ${resolvedModel} ${result.usage?.input_tokens ?? '?'}in/${result.usage?.output_tokens ?? '?'}out ${elapsed}ms`)

    // Return Anthropic-style response directly — the app handles this format
    sendJson(res, 200, result)
  } catch (err) {
    const status = err.status ?? 500
    const message =
      status >= 500 ? 'Internal proxy error' : (err.message ?? 'Internal proxy error')
    console.error(`[proxy] ${status}: ${message}`)
    sendJson(res, status, { error: message })
  }
})

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Facet AI proxy listening on http://localhost:${PORT}`)
  console.log(`Default model: ${DEFAULT_MODEL}`)
  console.log(`Aliases: ${Object.entries(MODEL_ALIASES).map(([k, v]) => `${k} → ${v}`).join(', ')}`)
  console.log(`Max tokens: ${DEFAULT_MAX_TOKENS}`)
  if (!Number.isNaN(DEFAULT_TEMPERATURE)) console.log(`Temperature override: ${DEFAULT_TEMPERATURE}`)
  if (DEFAULT_THINKING_BUDGET > 0) console.log(`Thinking budget: ${DEFAULT_THINKING_BUDGET} tokens`)
  console.log(`Allowed origins: ${ALLOWED_ORIGINS.join(', ')}`)
  console.log(`Proxy auth: ${PROXY_API_KEY ? 'configured' : 'NOT SET'}`)
  console.log(`API key: ${process.env.ANTHROPIC_API_KEY ? 'configured' : 'NOT SET'}`)
  if (USING_DEFAULT_PROXY_API_KEY) {
    console.warn('[proxy] Using default proxy API key. Set PROXY_API_KEY before sharing this server.')
  }
})

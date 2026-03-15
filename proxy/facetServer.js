import { createServer } from 'node:http'
import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { extname, resolve } from 'node:path'
import Anthropic from '@anthropic-ai/sdk'
import {
  createInMemoryWorkspaceStore,
  createTokenActorResolver,
  createPersistenceApi,
  DEFAULT_PERSISTENCE_AUTH_TOKENS,
  parsePersistenceAuthTokens,
} from './persistenceApi.js'
import {
  createBillingApi,
  createStripeBillingClient,
} from './billingApi.js'
import {
  createHostedAiErrorPayload,
  isFacetAiFeatureKey,
  resolveHostedAiAccess,
} from './aiAccess.js'
import {
  createFileHostedBillingStore,
  createInMemoryHostedBillingStore,
} from './billingState.js'
import {
  createHostedSessionActorResolver,
} from './hostedAuth.js'
import {
  createFileHostedWorkspaceStore,
  createInMemoryHostedWorkspaceStore,
} from './hostedWorkspaceStore.js'

const DEFAULT_MODEL = 'claude-sonnet-4-20250514'
const DEFAULT_PROXY_API_KEY = 'facet-local-proxy'
const DEFAULT_ALLOWED_ORIGINS = ['http://localhost:5173', 'http://127.0.0.1:5173']
const TEXT_UTF8_EXTENSIONS = new Set(['.css', '.html', '.js', '.json', '.map', '.svg', '.txt', '.xml'])
const STATIC_CONTENT_TYPES = {
  '.css': 'text/css',
  '.gif': 'image/gif',
  '.html': 'text/html',
  '.ico': 'image/x-icon',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.map': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain',
  '.wasm': 'application/wasm',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml',
}

const MODEL_ALIASES = {
  haiku: 'claude-haiku-4-5-20251001',
  sonnet: 'claude-sonnet-4-20250514',
  opus: 'claude-opus-4-20250514',
}

export const formatModelAliases = () =>
  Object.entries(MODEL_ALIASES)
    .map(([alias, model]) => `${alias} -> ${model}`)
    .join(', ')

const ALLOWED_TOOL_TYPES = new Set(['web_search_20250305'])

function resolveModel(requested, defaultModel) {
  if (!requested) return defaultModel
  return MODEL_ALIASES[requested] ?? requested
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

function readBody(req, maxBodyBytes) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let bytesRead = 0
    let isClosed = false
    req.on('data', (chunk) => {
      if (isClosed) {
        return
      }
      bytesRead += chunk.length
      if (bytesRead > maxBodyBytes) {
        isClosed = true
        reject(new Error(`Request body exceeds ${maxBodyBytes} bytes`))
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

function sendJson(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(data))
}

function getStaticContentType(filePath) {
  const extension = extname(filePath).toLowerCase()
  const baseType = STATIC_CONTENT_TYPES[extension] ?? 'application/octet-stream'
  if (TEXT_UTF8_EXTENSIONS.has(extension)) {
    return `${baseType}; charset=utf-8`
  }
  return baseType
}

async function resolveStaticFilePath(staticDir, pathname) {
  const decodedPath = decodeURIComponent(pathname)
  const requestedPath = decodedPath === '/' ? '/index.html' : decodedPath
  const candidatePath = resolve(staticDir, `.${requestedPath}`)
  const staticRoot = resolve(staticDir)

  if (!candidatePath.startsWith(staticRoot)) {
    return null
  }

  try {
    const fileStats = await stat(candidatePath)
    if (fileStats.isFile()) {
      return candidatePath
    }
  } catch {}

  if (extname(candidatePath)) {
    return null
  }

  return resolve(staticRoot, 'index.html')
}

async function tryServeStatic(staticDir, req, res, url) {
  if (!staticDir || (req.method !== 'GET' && req.method !== 'HEAD')) {
    return false
  }

  if (url.pathname.startsWith('/api/')) {
    return false
  }

  const filePath = await resolveStaticFilePath(staticDir, url.pathname)
  if (!filePath) {
    return false
  }

  const headers = {
    'Content-Type': getStaticContentType(filePath),
  }

  if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/fonts/')) {
    headers['Cache-Control'] = 'public, immutable, max-age=31536000'
  } else {
    headers['Cache-Control'] = 'no-cache'
  }

  res.writeHead(200, headers)
  if (req.method === 'HEAD') {
    res.end()
    return true
  }

  await new Promise((resolveRequest, rejectRequest) => {
    const stream = createReadStream(filePath)
    stream.on('error', rejectRequest)
    stream.on('end', resolveRequest)
    stream.pipe(res)
  })

  return true
}

export function createFacetServer(options = {}) {
  const allowedOrigins = options.allowedOrigins ?? DEFAULT_ALLOWED_ORIGINS
  const defaultModel = options.defaultModel ?? DEFAULT_MODEL
  const defaultMaxTokens = options.defaultMaxTokens ?? 4096
  const maxRequestTokens = options.maxRequestTokens ?? defaultMaxTokens
  const maxBodyBytes = options.maxBodyBytes ?? 1048576
  const staticDir = options.staticDir ? resolve(options.staticDir) : null
  const defaultTemperature = options.defaultTemperature
  const defaultThinkingBudget = options.defaultThinkingBudget ?? 0
  const proxyApiKey = options.proxyApiKey ?? DEFAULT_PROXY_API_KEY
  const anthropicClient = options.anthropicClient ?? new Anthropic()
  const allowedModelValues = new Set([
    defaultModel,
    ...Object.keys(MODEL_ALIASES),
    ...Object.values(MODEL_ALIASES),
  ])
  const authMode = options.authMode === 'hosted' ? 'hosted' : 'local'
  const hostedWorkspaceStore =
    authMode === 'hosted'
      ? (options.hostedWorkspaceStore ?? createInMemoryHostedWorkspaceStore())
      : null
  const persistenceAuthTokens = options.persistenceAuthTokens ?? DEFAULT_PERSISTENCE_AUTH_TOKENS
  const persistenceStore =
    options.persistenceStore ??
    (authMode === 'hosted' ? hostedWorkspaceStore : createInMemoryWorkspaceStore())
  const persistenceActorResolver =
    options.persistenceActorResolver ??
    (
      authMode === 'hosted'
        ? createHostedSessionActorResolver({
            ...(options.hostedAuth ?? {}),
            membershipStore:
              options.hostedAuth?.membershipStore ?? hostedWorkspaceStore,
          })
        : createTokenActorResolver(persistenceAuthTokens)
    )
  const persistenceApi = createPersistenceApi({
    actorResolver: persistenceActorResolver,
    store: persistenceStore,
    now: options.now,
  })
  const billingStore =
    authMode === 'hosted'
      ? (options.billingStore ?? createInMemoryHostedBillingStore())
      : null
  const stripeClient =
    options.stripeClient ??
    (
      options.stripeSecretKey
        ? createStripeBillingClient({
            secretKey: options.stripeSecretKey,
          })
        : null
    )

  if (authMode === 'hosted' && !stripeClient) {
    console.warn('[proxy] hosted mode: Stripe client not configured; billing checkout will be unavailable')
  }
  if (authMode === 'hosted' && !options.stripePriceId) {
    console.warn('[proxy] hosted mode: Stripe price id not configured; billing checkout will be unavailable')
  }

  const billingApi =
    authMode === 'hosted'
      ? createBillingApi({
          actorResolver: persistenceActorResolver,
          billingStore,
          stripeClient,
          stripePriceId: options.stripePriceId,
          successUrl: options.billingSuccessUrl ?? `${allowedOrigins[0] ?? 'http://localhost:5173'}/settings/billing/success`,
          cancelUrl: options.billingCancelUrl ?? `${allowedOrigins[0] ?? 'http://localhost:5173'}/settings/billing/cancel`,
        })
      : null

  const isAllowedOrigin = (origin) => allowedOrigins.includes(origin)

  function setCors(req, res) {
    const origin = req.headers.origin
    if (origin && isAllowedOrigin(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin)
      res.setHeader('Vary', 'Origin')
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Authorization, Content-Type, X-API-Key, X-Proxy-API-Key',
    )
  }

  const server = createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost')

    if (await tryServeStatic(staticDir, req, res, url)) {
      return
    }

    setCors(req, res)

    if (!req.headers.origin || !isAllowedOrigin(req.headers.origin)) {
      sendJson(res, 403, { error: 'Origin not allowed' })
      return
    }

    if (req.method === 'OPTIONS') {
      res.writeHead(204)
      res.end()
      return
    }

    if (req.headers['x-proxy-api-key'] !== proxyApiKey) {
      sendJson(res, 401, { error: 'Invalid proxy API key' })
      return
    }

    try {
      // Keep the explicit billing routes ahead of the generic AI handler.
      if (billingApi?.canHandle(req)) {
        await billingApi.handle(
          req,
          res,
          (request) => readBody(request, maxBodyBytes),
          sendJson,
        )
        return
      }

      if (persistenceApi.canHandle(req)) {
        await persistenceApi.handle(
          req,
          res,
          (request) => readBody(request, maxBodyBytes),
          sendJson,
        )
        return
      }

      if (url.pathname !== '/') {
        sendJson(res, 404, { error: 'Route not found' })
        return
      }

      if (req.method !== 'POST') {
        sendJson(res, 405, { error: 'Method not allowed' })
        return
      }

      const body = await readBody(req, maxBodyBytes)
      const { system, messages, temperature, max_tokens, model, thinking_budget, tools, feature } = body

      if (!hasValidMessages(messages)) {
        sendJson(res, 400, { error: 'Missing or invalid "messages" array' })
        return
      }

      if (feature !== undefined && feature !== null && !isFacetAiFeatureKey(feature)) {
        sendJson(res, 400, {
          error: 'AI requests must declare a valid feature when provided.',
          code: 'invalid_ai_feature',
        })
        return
      }

      if (authMode === 'hosted') {
        if (feature === undefined || feature === null) {
          sendJson(res, 400, {
            error: 'Hosted AI requests must declare a valid feature.',
            code: 'invalid_ai_feature',
          })
          return
        }

        let actor
        try {
          actor = await persistenceActorResolver(req)
        } catch (error) {
          if (error?.status === 401 || error?.status === 403) {
            sendJson(res, error.status, {
              error: 'Sign in to use AI features in hosted Facet.',
              code: 'auth_required',
            })
            return
          }

          console.error('[proxy] actor_resolve_error', error)
          sendJson(res, 500, {
            error: 'Unable to verify identity for AI access.',
            code: 'auth_internal_error',
          })
          return
        }

        if (!actor?.tenantId || !actor?.accountId) {
          sendJson(res, 403, {
            error: 'Hosted AI access requires a tenant-scoped account context.',
            code: 'incomplete_actor',
          })
          return
        }

        if (!billingStore) {
          sendJson(res, 500, {
            error: 'Hosted billing state is unavailable for this AI request.',
            code: 'billing_state_error',
          })
          return
        }

        try {
          const billingState = await billingStore.getAccountState(actor.tenantId, actor.accountId)
          const access = resolveHostedAiAccess(billingState, feature)
          if (!access.allowed) {
            sendJson(res, 402, createHostedAiErrorPayload(access.reason, feature))
            return
          }
        } catch (error) {
          console.error('[proxy] billing_state_error', error)
          sendJson(res, 500, {
            error: 'Hosted billing state could not be loaded for this AI request.',
            code: 'billing_state_error',
          })
          return
        }
      }

      const resolvedModel = resolveModel(model, defaultModel)
      if (!allowedModelValues.has(resolvedModel)) {
        sendJson(res, 400, { error: 'Requested model is not allowed' })
        return
      }

      const thinkingBudget = thinking_budget ?? defaultThinkingBudget
      const useThinking = thinkingBudget > 0
      const resolvedTemp = !Number.isNaN(defaultTemperature)
        ? defaultTemperature
        : (temperature ?? 0.3)
      const resolvedMaxTokens = Math.max(
        1,
        Math.min(
          maxRequestTokens,
          typeof max_tokens === 'number' ? Math.floor(max_tokens) : defaultMaxTokens,
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
      } else {
        params.temperature = resolvedTemp
      }

      const start = Date.now()
      const result = await anthropicClient.messages.create(params)
      const elapsed = Date.now() - start

      console.log(
        `[proxy] ${resolvedModel} ${result.usage?.input_tokens ?? '?'}in/${result.usage?.output_tokens ?? '?'}out ${elapsed}ms`,
      )

      sendJson(res, 200, result)
    } catch (error) {
      const status = error?.status ?? 500
      const message =
        status >= 500 ? 'Internal proxy error' : (error?.message ?? 'Internal proxy error')
      console.error(`[proxy] ${status}: ${message}`)
      sendJson(res, status, { error: message })
    }
  })

  return {
    server,
    persistenceStore,
  }
}

export function createEnvFacetServer(env = process.env) {
  const authMode = env.FACET_AUTH_MODE === 'hosted' ? 'hosted' : 'local'
  const allowedOrigins = (env.ALLOWED_ORIGINS ?? DEFAULT_ALLOWED_ORIGINS.join(','))
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
  const hostedWorkspaceStore =
    authMode === 'hosted'
      ? createFileHostedWorkspaceStore(env.HOSTED_WORKSPACE_FILE)
      : undefined
  const hostedAuth = authMode === 'hosted'
    ? {
        issuer:
          env.SUPABASE_JWT_ISSUER ??
          (
            env.SUPABASE_URL
              ? `${env.SUPABASE_URL.replace(/\/+$/, '')}/auth/v1`
              : undefined
          ),
        audience: env.SUPABASE_JWT_AUDIENCE ?? 'authenticated',
        jwksUrl: env.SUPABASE_JWKS_URL,
        membershipStore: hostedWorkspaceStore,
      }
    : undefined
  const billingBaseUrl =
    env.BILLING_APP_URL ??
    env.PUBLIC_APP_URL ??
    allowedOrigins[0] ??
    'http://localhost:5173'
  const billingStore =
    authMode === 'hosted'
      ? createFileHostedBillingStore(env.HOSTED_BILLING_FILE)
      : undefined

  return createFacetServer({
    authMode,
    allowedOrigins,
    defaultModel: env.MODEL ?? DEFAULT_MODEL,
    defaultMaxTokens: parseInt(env.MAX_TOKENS ?? '4096', 10),
    maxRequestTokens: parseInt(env.MAX_REQUEST_TOKENS ?? env.MAX_TOKENS ?? '4096', 10),
    maxBodyBytes: parseInt(env.MAX_BODY_BYTES ?? '1048576', 10),
    defaultTemperature: parseFloat(env.DEFAULT_TEMPERATURE ?? ''),
    defaultThinkingBudget: parseInt(env.THINKING_BUDGET ?? '0', 10),
    proxyApiKey: env.PROXY_API_KEY ?? DEFAULT_PROXY_API_KEY,
    persistenceAuthTokens:
      authMode === 'hosted'
        ? undefined
        : parsePersistenceAuthTokens(env.PERSISTENCE_AUTH_TOKENS),
    hostedWorkspaceStore,
    hostedAuth,
    billingStore,
    stripeSecretKey: env.STRIPE_SECRET_KEY,
    stripePriceId: env.STRIPE_PRICE_AI_MONTHLY,
    staticDir: env.FACET_STATIC_DIR,
    billingSuccessUrl:
      env.STRIPE_CHECKOUT_SUCCESS_URL ??
      `${billingBaseUrl.replace(/\/+$/, '')}/settings/billing/success`,
    billingCancelUrl:
      env.STRIPE_CHECKOUT_CANCEL_URL ??
      `${billingBaseUrl.replace(/\/+$/, '')}/settings/billing/cancel`,
  })
}

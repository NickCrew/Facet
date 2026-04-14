import { describe, expect, it } from 'vitest'
import { FacetAiProxyError, readAiProxyError } from '../utils/aiProxyErrors'

describe('readAiProxyError', () => {
  it('maps Anthropic low-credit payloads to a Facet billing issue error', async () => {
    const response = new Response(
      JSON.stringify({
        type: 'error',
        error: {
          type: 'invalid_request_error',
          message:
            'Your credit balance is too low to access the Anthropic API. Please go to Plans & Billing to upgrade or purchase credits.',
        },
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      },
    )

    const error = await readAiProxyError(response)

    expect(error).toBeInstanceOf(FacetAiProxyError)
    expect(error.message).toBe(
      'AI proxy billing issue: the Anthropic account behind the proxy is out of credits. Update Plans & Billing and try again.',
    )
    expect((error as FacetAiProxyError).reason).toBe('billing_issue')
    expect((error as FacetAiProxyError).code).toBe('ai_access_denied')
    expect((error as FacetAiProxyError).status).toBe(400)
  })
})

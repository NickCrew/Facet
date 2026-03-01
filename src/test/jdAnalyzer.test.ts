import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ResumeData } from '../types'
import { analyzeJobDescription, parseJdAnalysisResponse, prepareJobDescription } from '../utils/jdAnalyzer'

describe('jdAnalyzer utils', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  const sampleData: ResumeData = {
    version: 2,
    meta: {
      name: 'Jane Doe',
      email: 'jane@example.com',
      phone: '555-0100',
      location: 'Remote',
      links: [{ label: 'LinkedIn', url: 'https://example.com/in/jane' }],
    },
    vectors: [{ id: 'backend', label: 'Backend', color: '#0ea5e9' }],
    target_lines: [{ id: 'tl-1', vectors: { backend: 'must' }, text: 'Platform Engineer' }],
    profiles: [{ id: 'pf-1', vectors: { backend: 'must' }, text: 'Builds resilient services.' }],
    skill_groups: [{ id: 'sg-1', label: 'Core', content: 'TypeScript, Node.js', vectors: { backend: { priority: 'must', order: 1 } } }],
    roles: [
      {
        id: 'role-1',
        company: 'Acme',
        title: 'Engineer',
        dates: '2020-2024',
        bullets: [{ id: 'acme-b1', vectors: { backend: 'must' }, text: 'Scaled APIs' }],
      },
    ],
    projects: [],
    education: [],
    saved_variants: [],
  }

  describe('prepareJobDescription', () => {
    it('returns clean metadata for empty input', () => {
      expect(prepareJobDescription('')).toEqual({
        content: '',
        wordCount: 0,
        truncated: false,
      })
      expect(prepareJobDescription('   \n\t   ')).toEqual({
        content: '',
        wordCount: 0,
        truncated: false,
      })
      expect(prepareJobDescription('hello')).toEqual({
        content: 'hello',
        wordCount: 1,
        truncated: false,
      })
    })

    it('does not truncate short content', () => {
      const prepared = prepareJobDescription('  one  two\nthree ')
      expect(prepared.wordCount).toBe(3)
      expect(prepared.truncated).toBe(false)
      expect(prepared.content).toBe('one  two\nthree')
    })

    it('handles 1800 and 1801 word boundaries correctly', () => {
      const limitText = Array.from({ length: 1800 }, (_, index) => `word${index}`).join(' ')
      const overLimitText = `${limitText} overflow`

      const atLimit = prepareJobDescription(limitText)
      expect(atLimit.wordCount).toBe(1800)
      expect(atLimit.truncated).toBe(false)
      expect(atLimit.content.split(/\s+/).length).toBe(1800)

      const overLimit = prepareJobDescription(overLimitText)
      expect(overLimit.wordCount).toBe(1801)
      expect(overLimit.truncated).toBe(true)
      expect(overLimit.content.split(/\s+/).length).toBe(1800)
      expect(overLimit.content.split(/\s+/)[0]).toBe('word0')
      expect(overLimit.content.split(/\s+/)[1799]).toBe('word1799')
    })
  })

  describe('parseJdAnalysisResponse', () => {
    const validJson = `{
  "primary_vector": "backend",
  "bullet_adjustments": [
    { "bullet_id": "acme-b1", "recommended_priority": "must", "reason": "Direct match" }
  ],
  "suggested_target_line": "Platform Security Engineer",
  "skill_gaps": ["SIEM", "Threat Modeling"],
  "positioning_note": "Lead with cross-domain reliability plus security impact."
}`

    it('parses structured JSON and all expected fields', () => {
      const raw = `Some preface\n${validJson}\nTrailing notes`
      const parsed = parseJdAnalysisResponse(raw)
      expect(parsed.primary_vector).toBe('backend')
      expect(parsed.bullet_adjustments[0]?.bullet_id).toBe('acme-b1')
      expect(parsed.skill_gaps).toContain('SIEM')
      expect(parsed.suggested_target_line).toBe('Platform Security Engineer')
      expect(parsed.positioning_note).toContain('reliability')
    })

    it('extracts the valid JSON block even with brace noise around it', () => {
      const raw = `Header brace noise {ignore this}\n${validJson}\nFooter brace noise }`
      const parsed = parseJdAnalysisResponse(raw)
      expect(parsed.primary_vector).toBe('backend')
    })

    it('defaults optional fields when omitted', () => {
      const parsed = parseJdAnalysisResponse(`{
        "primary_vector": "backend",
        "bullet_adjustments": [],
        "skill_gaps": []
      }`)
      expect(parsed.suggested_target_line).toBe('')
      expect(parsed.positioning_note).toBe('')

      const invalidOptionalTypes = parseJdAnalysisResponse(`{
        "primary_vector": "backend",
        "bullet_adjustments": [],
        "skill_gaps": [],
        "suggested_target_line": 42,
        "positioning_note": true
      }`)
      expect(invalidOptionalTypes.suggested_target_line).toBe('')
      expect(invalidOptionalTypes.positioning_note).toBe('')
    })

    it('throws for missing or malformed JSON', () => {
      expect(() => parseJdAnalysisResponse('')).toThrow('valid JSON output')
      expect(() => parseJdAnalysisResponse('no json here')).toThrow('valid JSON output')
      expect(() => parseJdAnalysisResponse('{"primary_vector": }')).toThrow('valid JSON output')
      expect(() => parseJdAnalysisResponse('{"primary_vector":"backend","bullet_adjustments":[')).toThrow(
        'valid JSON output',
      )
      expect(() => parseJdAnalysisResponse('{'.repeat(120))).toThrow('valid JSON output')
      expect(() => parseJdAnalysisResponse('x'.repeat(50_000))).toThrow('valid JSON output')
    })

    it('skips invalid JSON candidates and parses the next valid block', () => {
      const parsed = parseJdAnalysisResponse(`{bad json}
{
  "primary_vector": "backend",
  "bullet_adjustments": [],
  "skill_gaps": []
}`)
      expect(parsed.primary_vector).toBe('backend')
    })

    it('uses the first valid JSON block when multiple valid blocks are present', () => {
      const parsed = parseJdAnalysisResponse(`{
  "primary_vector": "first",
  "bullet_adjustments": [],
  "skill_gaps": []
}
{
  "primary_vector": "second",
  "bullet_adjustments": [],
  "skill_gaps": []
}`)
      expect(parsed.primary_vector).toBe('first')
    })

    it('handles escaped quotes inside JSON strings', () => {
      const parsed = parseJdAnalysisResponse(`{
        "primary_vector": "backend",
        "bullet_adjustments": [
          { "bullet_id": "acme-b1", "recommended_priority": "must", "reason": "Said \\u0022ship it\\u0022 in JD" }
        ],
        "skill_gaps": []
      }`)
      expect(parsed.bullet_adjustments[0]?.reason).toContain('"ship it"')
    })

    it('handles braces and backslash-escaped quotes inside JSON string values', () => {
      const escapedQuote = '\\"'
      const parsed = parseJdAnalysisResponse(`{
        "primary_vector": "backend",
        "bullet_adjustments": [
          {
            "bullet_id": "acme-b1",
            "recommended_priority": "must",
            "reason": "She said ${escapedQuote}ship it${escapedQuote} and referenced {React} in notes."
          }
        ],
        "skill_gaps": [],
        "positioning_note": "Prefer {platform} framing for this role."
      }`)
      expect(parsed.bullet_adjustments[0]?.reason).toContain('"ship it"')
      expect(parsed.positioning_note).toContain('{platform}')
    })

    it('handles deeply nested valid JSON structures', () => {
      const parsed = parseJdAnalysisResponse(`{
        "primary_vector": "backend",
        "bullet_adjustments": [],
        "skill_gaps": [],
        "debug": {
          "layer1": {
            "layer2": {
              "layer3": {
                "notes": "nested context for parser stability"
              }
            }
          }
        }
      }`)
      expect(parsed.primary_vector).toBe('backend')
      expect(parsed).not.toHaveProperty('debug')
    })

    it('handles escaped backslashes inside JSON strings', () => {
      const parsed = parseJdAnalysisResponse(`{
        "primary_vector": "backend",
        "bullet_adjustments": [
          {
            "bullet_id": "acme-b1",
            "recommended_priority": "must",
            "reason": "Path C:\\\\Users\\\\dev\\\\resume-builder"
          }
        ],
        "skill_gaps": []
      }`)
      expect(parsed.bullet_adjustments[0]?.reason).toContain('C:\\Users\\dev\\resume-builder')
    })

    it('accepts all valid priorities and rejects invalid priority values', () => {
      const valid = parseJdAnalysisResponse(`{
        "primary_vector": "backend",
        "bullet_adjustments": [
          { "bullet_id": "b1", "recommended_priority": "must", "reason": "a" },
          { "bullet_id": "b2", "recommended_priority": "strong", "reason": "b" },
          { "bullet_id": "b3", "recommended_priority": "optional", "reason": "c" },
          { "bullet_id": "b4", "recommended_priority": "exclude", "reason": "d" }
        ],
        "skill_gaps": []
      }`)
      expect(valid.bullet_adjustments).toHaveLength(4)

      expect(() =>
        parseJdAnalysisResponse(`{
          "primary_vector": "backend",
          "bullet_adjustments": [
            { "bullet_id": "b1", "recommended_priority": "high", "reason": "bad" }
          ],
          "skill_gaps": []
        }`),
      ).toThrow('schema was invalid')
    })

    it('throws when required fields are missing or invalid', () => {
      expect(() =>
        parseJdAnalysisResponse(`{
          "bullet_adjustments": [],
          "skill_gaps": []
        }`),
      ).toThrow('schema was invalid')

      expect(() =>
        parseJdAnalysisResponse(`{
          "primary_vector": "backend",
          "bullet_adjustments": "wrong",
          "skill_gaps": []
        }`),
      ).toThrow('schema was invalid')

      expect(() =>
        parseJdAnalysisResponse(`{
          "primary_vector": "backend",
          "bullet_adjustments": [],
          "skill_gaps": {}
        }`),
      ).toThrow('schema was invalid')

      expect(() =>
        parseJdAnalysisResponse(`{
          "primary_vector": "backend",
          "bullet_adjustments": [{}],
          "skill_gaps": []
        }`),
      ).toThrow('schema was invalid')

      expect(() =>
        parseJdAnalysisResponse(`{
          "primary_vector": "backend",
          "bullet_adjustments": [{ "bullet_id": "b1", "recommended_priority": "must" }],
          "skill_gaps": []
        }`),
      ).toThrow('schema was invalid')

      expect(() =>
        parseJdAnalysisResponse(`{
          "primary_vector": "backend",
          "bullet_adjustments": [{ "recommended_priority": "must", "reason": "x" }],
          "skill_gaps": []
        }`),
      ).toThrow('schema was invalid')

      expect(() =>
        parseJdAnalysisResponse(`{
          "primary_vector": "backend",
          "bullet_adjustments": [{ "bullet_id": 123, "recommended_priority": "must", "reason": "x" }],
          "skill_gaps": []
        }`),
      ).toThrow('schema was invalid')

      expect(() =>
        parseJdAnalysisResponse(`{
          "primary_vector": 42,
          "bullet_adjustments": [],
          "skill_gaps": []
        }`),
      ).toThrow('schema was invalid')

      expect(() =>
        parseJdAnalysisResponse(`{
          "primary_vector": "backend",
          "bullet_adjustments": [{ "bullet_id": "b1", "recommended_priority": "must", "reason": null }],
          "skill_gaps": []
        }`),
      ).toThrow('schema was invalid')

      expect(() =>
        parseJdAnalysisResponse(`{
          "primary_vector": "backend",
          "bullet_adjustments": [],
          "skill_gaps": [123]
        }`),
      ).toThrow('schema was invalid')
    })
  })

  describe('analyzeJobDescription', () => {
    const prepared = {
      content: 'Need backend reliability and observability leadership.',
      wordCount: 6,
      truncated: false,
    }

    it('throws API error details for non-ok responses', async () => {
      const fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>(async () => ({
        ok: false,
        status: 500,
        text: async () => 'proxy unavailable',
      } as Response))
      vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch)

      await expect(analyzeJobDescription(prepared, sampleData, 'https://proxy.local/analyze')).rejects.toThrow(
        'Anthropic API error (500): proxy unavailable',
      )
    })

    it('propagates error-body read failures for non-ok responses', async () => {
      const fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>(async () => ({
        ok: false,
        status: 500,
        text: async () => {
          throw new Error('body read failed')
        },
      } as unknown as Response))
      vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch)

      await expect(analyzeJobDescription(prepared, sampleData, 'https://proxy.local/analyze')).rejects.toThrow(
        'body read failed',
      )
    })

    it('rejects redirect responses from endpoint', async () => {
      const fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>(async () => ({
        ok: false,
        status: 302,
        text: async () => '',
      } as Response))
      vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch)

      await expect(analyzeJobDescription(prepared, sampleData, 'https://proxy.local/analyze')).rejects.toThrow(
        'returned a redirect',
      )
    })

    it('rejects redirect boundary statuses 300 and 399', async () => {
      const fetch300 = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>(async () => ({
        ok: false,
        status: 300,
        text: async () => '',
      } as Response))
      vi.stubGlobal('fetch', fetch300 as unknown as typeof fetch)
      await expect(analyzeJobDescription(prepared, sampleData, 'https://proxy.local/analyze')).rejects.toThrow(
        'returned a redirect',
      )

      const fetch399 = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>(async () => ({
        ok: false,
        status: 399,
        text: async () => '',
      } as Response))
      vi.stubGlobal('fetch', fetch399 as unknown as typeof fetch)
      await expect(analyzeJobDescription(prepared, sampleData, 'https://proxy.local/analyze')).rejects.toThrow(
        'returned a redirect',
      )
    })

    it('rejects invalid endpoint URLs before request', async () => {
      await expect(analyzeJobDescription(prepared, sampleData, 'not-a-url')).rejects.toThrow(
        'endpoint URL is invalid',
      )
      await expect(analyzeJobDescription(prepared, sampleData, 'ftp://proxy.local/analyze')).rejects.toThrow(
        'must use HTTP or HTTPS',
      )
      await expect(analyzeJobDescription(prepared, sampleData, 'https://user:pass@proxy.local/analyze')).rejects.toThrow(
        'must not include credentials',
      )
      await expect(analyzeJobDescription(prepared, sampleData, 'http://proxy.local/analyze')).rejects.toThrow(
        'HTTP is only allowed for localhost',
      )
      await expect(analyzeJobDescription(prepared, sampleData, 'https://10.0.0.5/analyze')).rejects.toThrow(
        'must not target private network IP addresses',
      )
      await expect(analyzeJobDescription(prepared, sampleData, 'https://0.0.0.1/analyze')).rejects.toThrow(
        'must not target private network IP addresses',
      )
      await expect(analyzeJobDescription(prepared, sampleData, 'https://127.0.0.2/analyze')).rejects.toThrow(
        'must not target private network IP addresses',
      )
      await expect(analyzeJobDescription(prepared, sampleData, 'https://172.16.0.5/analyze')).rejects.toThrow(
        'must not target private network IP addresses',
      )
      await expect(analyzeJobDescription(prepared, sampleData, 'https://172.31.255.5/analyze')).rejects.toThrow(
        'must not target private network IP addresses',
      )
      await expect(analyzeJobDescription(prepared, sampleData, 'https://192.168.0.10/analyze')).rejects.toThrow(
        'must not target private network IP addresses',
      )
      await expect(analyzeJobDescription(prepared, sampleData, 'https://169.254.169.254/analyze')).rejects.toThrow(
        'must not target private network IP addresses',
      )
      await expect(analyzeJobDescription(prepared, sampleData, 'https://100.64.0.5/analyze')).rejects.toThrow(
        'must not target private network IP addresses',
      )
      await expect(analyzeJobDescription(prepared, sampleData, 'https://198.18.0.5/analyze')).rejects.toThrow(
        'must not target private network IP addresses',
      )
      await expect(analyzeJobDescription(prepared, sampleData, 'https://198.19.0.5/analyze')).rejects.toThrow(
        'must not target private network IP addresses',
      )
      await expect(analyzeJobDescription(prepared, sampleData, 'https://240.0.0.5/analyze')).rejects.toThrow(
        'must not target private network IP addresses',
      )
      await expect(analyzeJobDescription(prepared, sampleData, 'https://[::]/analyze')).rejects.toThrow(
        'must not target private network IP addresses',
      )
      await expect(analyzeJobDescription(prepared, sampleData, 'https://[fc00::1]/analyze')).rejects.toThrow(
        'must not target private network IP addresses',
      )
      await expect(analyzeJobDescription(prepared, sampleData, 'https://[fd00::1]/analyze')).rejects.toThrow(
        'must not target private network IP addresses',
      )
      await expect(analyzeJobDescription(prepared, sampleData, 'https://[fdff::1]/analyze')).rejects.toThrow(
        'must not target private network IP addresses',
      )
      await expect(analyzeJobDescription(prepared, sampleData, 'https://[fe80::1]/analyze')).rejects.toThrow(
        'must not target private network IP addresses',
      )
      await expect(analyzeJobDescription(prepared, sampleData, 'https://[febf::1]/analyze')).rejects.toThrow(
        'must not target private network IP addresses',
      )
      await expect(analyzeJobDescription(prepared, sampleData, 'https://[::ffff:10.0.0.5]/analyze')).rejects.toThrow(
        'must not target private network IP addresses',
      )
      await expect(analyzeJobDescription(prepared, sampleData, 'https://[::ffff:7f00:1]/analyze')).rejects.toThrow(
        'must not target private network IP addresses',
      )
      await expect(analyzeJobDescription(prepared, sampleData, 'https://[::ffff:1:2:3]/analyze')).rejects.toThrow(
        'must not target private network IP addresses',
      )
      await expect(analyzeJobDescription(prepared, sampleData, 'https://[::ffff:c0a8:0001]/analyze')).rejects.toThrow(
        'must not target private network IP addresses',
      )
      await expect(analyzeJobDescription(prepared, sampleData, 'https://[::ffff:gggg:hhhh]/analyze')).rejects.toThrow(
        'endpoint URL is invalid',
      )
    })

    it('documents runtime handling of numeric and hex host representations', async () => {
      await expect(analyzeJobDescription(prepared, sampleData, 'https://0x7f000001/analyze')).rejects.toThrow(
        /private network|URL is invalid|fetch failed/,
      )
      await expect(analyzeJobDescription(prepared, sampleData, 'https://2130706433/analyze')).rejects.toThrow(
        /private network|URL is invalid|fetch failed/,
      )
    })

    it('allows loopback HTTP and public HTTPS endpoints', async () => {
      const fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>(async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          primary_vector: 'backend',
          bullet_adjustments: [],
          suggested_target_line: '',
          skill_gaps: [],
          positioning_note: '',
        }),
      } as Response))
      vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch)

      await expect(analyzeJobDescription(prepared, sampleData, 'http://localhost/analyze')).resolves.toMatchObject({
        primary_vector: 'backend',
      })
      await expect(analyzeJobDescription(prepared, sampleData, 'http://127.0.0.1/analyze')).resolves.toMatchObject({
        primary_vector: 'backend',
      })
      await expect(analyzeJobDescription(prepared, sampleData, 'http://[::1]/analyze')).resolves.toMatchObject({
        primary_vector: 'backend',
      })
      await expect(analyzeJobDescription(prepared, sampleData, 'https://172.15.255.1/analyze')).resolves.toMatchObject({
        primary_vector: 'backend',
      })
      await expect(analyzeJobDescription(prepared, sampleData, 'https://172.32.0.1/analyze')).resolves.toMatchObject({
        primary_vector: 'backend',
      })
      await expect(analyzeJobDescription(prepared, sampleData, 'https://100.63.255.1/analyze')).resolves.toMatchObject({
        primary_vector: 'backend',
      })
      await expect(analyzeJobDescription(prepared, sampleData, 'https://100.128.0.1/analyze')).resolves.toMatchObject({
        primary_vector: 'backend',
      })
      await expect(analyzeJobDescription(prepared, sampleData, 'https://198.17.255.1/analyze')).resolves.toMatchObject({
        primary_vector: 'backend',
      })
      await expect(analyzeJobDescription(prepared, sampleData, 'https://198.20.0.1/analyze')).resolves.toMatchObject({
        primary_vector: 'backend',
      })
      await expect(analyzeJobDescription(prepared, sampleData, 'https://[fec0::1]/analyze')).resolves.toMatchObject({
        primary_vector: 'backend',
      })
      await expect(analyzeJobDescription(prepared, sampleData, 'https://203.0.113.10/analyze')).resolves.toMatchObject({
        primary_vector: 'backend',
      })
      await expect(analyzeJobDescription(prepared, sampleData, 'https://[::ffff:203.0.113.10]/analyze')).resolves.toMatchObject({
        primary_vector: 'backend',
      })
      await expect(analyzeJobDescription(prepared, sampleData, 'https://[::ffff:cb00:7101]/analyze')).resolves.toMatchObject({
        primary_vector: 'backend',
      })
    })

    it('maps fetch abort to timeout error', async () => {
      const fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>(async () => {
        const abortError = new Error('aborted')
        abortError.name = 'AbortError'
        throw abortError
      })
      vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch)

      await expect(analyzeJobDescription(prepared, sampleData, 'https://proxy.local/analyze')).rejects.toThrow(
        'timed out after 30000ms',
      )
    })

    it('propagates non-abort fetch errors', async () => {
      const fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>(async () => {
        throw new TypeError('network exploded')
      })
      vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch)

      await expect(analyzeJobDescription(prepared, sampleData, 'https://proxy.local/analyze')).rejects.toThrow(
        'network exploded',
      )
    })

    it('maps abort during response body read to timeout error', async () => {
      const fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>(async () => ({
        ok: true,
        status: 200,
        json: async () => {
          const abortError = new Error('aborted while reading body')
          abortError.name = 'AbortError'
          throw abortError
        },
      } as unknown as Response))
      vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch)

      await expect(analyzeJobDescription(prepared, sampleData, 'https://proxy.local/analyze')).rejects.toThrow(
        'timed out after 30000ms',
      )
    })

    it('handles direct analysis payload shape', async () => {
      const fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>(async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          primary_vector: 'backend',
          bullet_adjustments: [
            { bullet_id: 'acme-b1', recommended_priority: 'must', reason: 'Match' },
            { bullet_id: 'unknown-bullet', recommended_priority: 'strong', reason: 'Ignore this' },
          ],
          suggested_target_line: 'Platform Engineer',
          skill_gaps: ['Kubernetes'],
          positioning_note: 'Lead with systems design.',
        }),
      } as Response))
      vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch)

      const result = await analyzeJobDescription(prepared, sampleData, 'https://proxy.local/analyze')
      expect(result.primary_vector).toBe('backend')
      expect(result.skill_gaps).toEqual(['Kubernetes'])
      expect(result.bullet_adjustments).toEqual([
        { bullet_id: 'acme-b1', recommended_priority: 'must', reason: 'Match' },
      ])
    })

    it('handles wrapped analysis payload shape', async () => {
      const fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>(async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          analysis: {
            primary_vector: 'backend',
            bullet_adjustments: [],
            suggested_target_line: 'Staff Backend Engineer',
            skill_gaps: ['SRE'],
            positioning_note: '',
          },
        }),
      } as Response))
      vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch)

      const result = await analyzeJobDescription(prepared, sampleData, 'https://proxy.local/analyze')
      expect(result.suggested_target_line).toBe('Staff Backend Engineer')
    })

    it('handles anthropic content text payload shape', async () => {
      const fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>(async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          content: [
            {
              type: 'text',
              text: `analysis:\n{
                "primary_vector": "backend",
                "bullet_adjustments": [],
                "skill_gaps": [],
                "suggested_target_line": "Backend Lead",
                "positioning_note": "Bias toward measurable outcomes."
              }`,
            },
          ],
        }),
      } as Response))
      vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch)

      const result = await analyzeJobDescription(prepared, sampleData, 'https://proxy.local/analyze')
      expect(result.suggested_target_line).toBe('Backend Lead')
    })

    it('handles anthropic content arrays that include null entries', async () => {
      const fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>(async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          content: [
            null,
            {
              type: 'text',
              text: `{
                "primary_vector": "backend",
                "bullet_adjustments": [],
                "skill_gaps": [],
                "suggested_target_line": "Backend Lead",
                "positioning_note": ""
              }`,
            },
          ],
        }),
      } as Response))
      vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch)

      const result = await analyzeJobDescription(prepared, sampleData, 'https://proxy.local/analyze')
      expect(result.primary_vector).toBe('backend')
    })

    it('throws when anthropic content payload has no text block', async () => {
      const fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>(async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          content: [{ type: 'tool_result' }],
        }),
      } as Response))
      vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch)

      await expect(analyzeJobDescription(prepared, sampleData, 'https://proxy.local/analyze')).rejects.toThrow(
        'schema was invalid',
      )
    })

    it('throws when anthropic text block is empty', async () => {
      const fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>(async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          content: [{ type: 'text', text: '' }],
        }),
      } as Response))
      vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch)

      await expect(analyzeJobDescription(prepared, sampleData, 'https://proxy.local/analyze')).rejects.toThrow(
        'schema was invalid',
      )
    })

    it('rejects non-object JSON payloads', async () => {
      const fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>(async () => ({
        ok: true,
        status: 200,
        json: async () => null,
      } as Response))
      vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch)

      await expect(analyzeJobDescription(prepared, sampleData, 'https://proxy.local/analyze')).rejects.toThrow(
        'schema was invalid',
      )
    })

    it('rejects primitive JSON payloads', async () => {
      const stringPayloadFetch = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>(async () => ({
        ok: true,
        status: 200,
        json: async () => 'not-an-object',
      } as Response))
      vi.stubGlobal('fetch', stringPayloadFetch as unknown as typeof fetch)
      await expect(analyzeJobDescription(prepared, sampleData, 'https://proxy.local/analyze')).rejects.toThrow(
        'schema was invalid',
      )

      const numberPayloadFetch = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>(async () => ({
        ok: true,
        status: 200,
        json: async () => 42,
      } as Response))
      vi.stubGlobal('fetch', numberPayloadFetch as unknown as typeof fetch)
      await expect(analyzeJobDescription(prepared, sampleData, 'https://proxy.local/analyze')).rejects.toThrow(
        'schema was invalid',
      )
    })

    it('rejects array payloads returned by response.json()', async () => {
      const fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>(async () => ({
        ok: true,
        status: 200,
        json: async () => [1, 2, 3],
      } as Response))
      vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch)

      await expect(analyzeJobDescription(prepared, sampleData, 'https://proxy.local/analyze')).rejects.toThrow(
        'schema was invalid',
      )
    })

    it('rejects invalid analysis wrapper payload types', async () => {
      const analysisArrayFetch = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>(async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          analysis: ['not-an-object'],
        }),
      } as Response))
      vi.stubGlobal('fetch', analysisArrayFetch as unknown as typeof fetch)
      await expect(analyzeJobDescription(prepared, sampleData, 'https://proxy.local/analyze')).rejects.toThrow(
        'valid JSON output',
      )

      const analysisStringFetch = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>(async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          analysis: 'bad',
        }),
      } as Response))
      vi.stubGlobal('fetch', analysisStringFetch as unknown as typeof fetch)
      await expect(analyzeJobDescription(prepared, sampleData, 'https://proxy.local/analyze')).rejects.toThrow(
        'schema was invalid',
      )
    })

    it('propagates malformed JSON body parse errors', async () => {
      const fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>(async () => ({
        ok: true,
        status: 200,
        json: async () => {
          throw new SyntaxError('Unexpected token <')
        },
      } as unknown as Response))
      vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch)

      await expect(analyzeJobDescription(prepared, sampleData, 'https://proxy.local/analyze')).rejects.toThrow(
        'Unexpected token <',
      )
    })

    it('rejects non-array content payloads', async () => {
      const fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>(async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          content: 'not-an-array',
        }),
      } as Response))
      vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch)

      await expect(analyzeJobDescription(prepared, sampleData, 'https://proxy.local/analyze')).rejects.toThrow(
        'schema was invalid',
      )
    })

    it('truncates long error bodies and uses fallback for empty bodies', async () => {
      const longMessage = `${'x'.repeat(450)} end`
      const longErrorFetch = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>(async () => ({
        ok: false,
        status: 502,
        text: async () => longMessage,
      } as Response))
      vi.stubGlobal('fetch', longErrorFetch as unknown as typeof fetch)

      await expect(analyzeJobDescription(prepared, sampleData, 'https://proxy.local/analyze')).rejects.toThrow(
        `Anthropic API error (502): ${'x'.repeat(200)}`,
      )

      const emptyErrorFetch = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>(async () => ({
        ok: false,
        status: 503,
        text: async () => '',
      } as Response))
      vi.stubGlobal('fetch', emptyErrorFetch as unknown as typeof fetch)

      await expect(analyzeJobDescription(prepared, sampleData, 'https://proxy.local/analyze')).rejects.toThrow(
        'Anthropic API error (503): Request failed.',
      )
    })

    it('collapses whitespace in API error bodies', async () => {
      const fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>(async () => ({
        ok: false,
        status: 500,
        text: async () => 'line1\nline2\t\tline3',
      } as Response))
      vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch)

      await expect(analyzeJobDescription(prepared, sampleData, 'https://proxy.local/analyze')).rejects.toThrow(
        'Anthropic API error (500): line1 line2 line3',
      )
    })

    it('sends expected request payload contract', async () => {
      const fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>(async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          primary_vector: 'backend',
          bullet_adjustments: [],
          suggested_target_line: '',
          skill_gaps: [],
          positioning_note: '',
        }),
      } as Response))
      vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch)

      await analyzeJobDescription(prepared, sampleData, 'https://proxy.local/analyze', { apiKey: 'secret-token' })
      expect(fetchMock).toHaveBeenCalledTimes(1)

      const firstCall = fetchMock.mock.calls[0]
      expect(firstCall).toBeDefined()
      if (!firstCall) {
        throw new Error('fetch call was expected')
      }
      const [url, init] = firstCall
      expect(url).toBe('https://proxy.local/analyze')
      expect(init?.method).toBe('POST')
      expect(init?.redirect).toBe('manual')
      expect(init?.headers).toEqual({
        'content-type': 'application/json',
        authorization: 'Bearer secret-token',
      })
      expect(init?.signal).toBeDefined()

      const body = JSON.parse(String(init?.body)) as {
        model: string
        system_prompt: string
        job_description: string
        prompt: string
        resume_data: Record<string, unknown>
      }
      expect(body.model).toBe('claude-sonnet-4-20250514')
      expect(body.job_description).toBe(prepared.content)
      expect(body.system_prompt).toContain('resume strategist')
      expect(body.prompt).toContain(prepared.content)
      expect(Object.keys(body.resume_data).sort()).toEqual([
        'profiles',
        'roles',
        'skill_groups',
        'target_lines',
        'vectors',
      ])
      expect(body.resume_data).not.toHaveProperty('meta')
      expect(body.resume_data).not.toHaveProperty('education')
      expect(body.resume_data).not.toHaveProperty('projects')
      expect(body.resume_data).not.toHaveProperty('saved_variants')
      expect(body.resume_data).not.toHaveProperty('version')
      expect(body.resume_data).toMatchObject({
        vectors: sampleData.vectors,
        target_lines: sampleData.target_lines,
        profiles: sampleData.profiles,
        skill_groups: sampleData.skill_groups,
        roles: sampleData.roles,
      })
    })

    it('normalizes endpoint URL casing while preserving path and query', async () => {
      const fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>(async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          primary_vector: 'backend',
          bullet_adjustments: [],
          suggested_target_line: '',
          skill_gaps: [],
          positioning_note: '',
        }),
      } as Response))
      vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch)

      await analyzeJobDescription(prepared, sampleData, 'HTTPS://PROXY.LOCAL/v1/analyze?org=abc')
      const firstCall = fetchMock.mock.calls[0]
      expect(firstCall).toBeDefined()
      if (!firstCall) {
        throw new Error('fetch call was expected')
      }
      const [url] = firstCall
      expect(url).toBe('https://proxy.local/v1/analyze?org=abc')
    })

    it('omits authorization header when apiKey is not provided', async () => {
      const fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>(async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          primary_vector: 'backend',
          bullet_adjustments: [],
          suggested_target_line: '',
          skill_gaps: [],
          positioning_note: '',
        }),
      } as Response))
      vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch)

      await analyzeJobDescription(prepared, sampleData, 'https://proxy.local/analyze')
      const firstCall = fetchMock.mock.calls[0]
      expect(firstCall).toBeDefined()
      if (!firstCall) {
        throw new Error('fetch call was expected')
      }
      const [, init] = firstCall
      expect(init?.headers).toEqual({
        'content-type': 'application/json',
      })
    })
  })
})

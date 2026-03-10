import type { CoverLetterParagraph } from '../types/coverLetter'
import type { ResumeMeta, ResumeVector } from '../types'

const REQUEST_TIMEOUT_MS = 45000

interface CoverLetterGenerationPayload {
  name: string
  greeting: string
  signOff: string
  paragraphs: unknown[]
}

export interface CoverLetterGenerationRequest {
  company: string
  role: string
  contact?: string
  vectorId: string
  vectorLabel: string
  companyUrl?: string
  skillMatch?: string
  positioning?: string
  notes?: string
  companyResearch?: string
  jobDescription: string
  resumeContext: {
    candidate: ResumeMeta
    vector: ResumeVector
    assembled: unknown
  }
}

export type GeneratedCoverLetterParagraph = Pick<CoverLetterParagraph, 'label' | 'text'>

export interface CoverLetterGenerationResult {
  name: string
  header: string
  greeting: string
  signOff: string
  paragraphs: GeneratedCoverLetterParagraph[]
}

class JsonExtractionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'JsonExtractionError'
  }
}

function extractJsonBlock(text: string): string {
  const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/)
  if (jsonMatch?.[1]) {
    return jsonMatch[1].trim()
  }

  const firstBrace = text.indexOf('{')
  const lastBrace = text.lastIndexOf('}')
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return text.slice(firstBrace, lastBrace + 1)
  }

  throw new JsonExtractionError('Could not find JSON block in AI response.')
}

async function callLlmProxy(endpoint: string, systemPrompt: string, userPrompt: string) {
  const controller = new AbortController()
  const timeoutId = globalThis.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
        temperature: 0.3,
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error(`AI proxy error (${response.status}): ${(await response.text()).slice(0, 160)}`)
    }

    const payload = (await response.json()) as Record<string, unknown>
    if (Array.isArray(payload.choices)) {
      const choice = payload.choices[0] as Record<string, unknown>
      const message = choice.message as Record<string, unknown>
      if (typeof message?.content === 'string') {
        return message.content
      }
    }

    if (Array.isArray(payload.content)) {
      const textPart = payload.content.find(
        (part) => part && typeof part === 'object' && (part as { type?: unknown }).type === 'text',
      ) as { text?: string } | undefined
      if (typeof textPart?.text === 'string') {
        return textPart.text
      }
    }

    return JSON.stringify(payload)
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`AI request timed out after ${REQUEST_TIMEOUT_MS}ms.`)
    }
    throw error
  } finally {
    globalThis.clearTimeout(timeoutId)
  }
}

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function buildHeader(meta: ResumeMeta): string {
  const contactLine = [meta.location, meta.email, meta.phone]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(' | ')

  const linksLine = meta.links
    .map((link) => [link.label?.trim(), link.url.trim()].filter(Boolean).join(': '))
    .filter(Boolean)
    .join(' | ')

  return [meta.name.trim(), contactLine, linksLine].filter(Boolean).join('\n')
}

function normalizeParagraphs(paragraphs: unknown[]): GeneratedCoverLetterParagraph[] {
  return paragraphs.flatMap((paragraph) => {
    if (!paragraph || typeof paragraph !== 'object') return []
    const record = paragraph as Record<string, unknown>
    if (!isString(record.text) || !record.text.trim()) return []

    return [
      {
        label: isString(record.label) && record.label.trim() ? record.label.trim() : undefined,
        text: record.text.trim(),
      },
    ]
  })
}

export async function generateCoverLetter(
  endpoint: string,
  request: CoverLetterGenerationRequest,
): Promise<CoverLetterGenerationResult> {
  const systemPrompt = `You are an expert cover-letter writer for senior technical candidates. Return JSON only.
Draft a concise, specific, truthful cover letter grounded only in the provided resume and job context.
Favor 3 to 5 paragraphs with direct, modern language. Keep the tone confident but not inflated.
Do not invent employers, projects, metrics, technologies, or responsibilities not present in the input.
Use the target vector and job description to decide what to emphasize.
If a hiring contact is unavailable, use a professional generic greeting.

Response schema:
{
  "name": "string",
  "greeting": "string",
  "signOff": "string",
  "paragraphs": [
    {
      "label": "optional short label",
      "text": "string"
    }
  ]
}`

  const header = buildHeader(request.resumeContext.candidate)
  const userPrompt = `Target Company: ${request.company}
Target Role: ${request.role}
Hiring Contact: ${request.contact || 'Not provided'}
Target Vector: ${request.vectorLabel} (${request.vectorId})
Company URL: ${request.companyUrl ?? 'Not provided'}
Skill Match Notes: ${request.skillMatch ?? 'Not provided'}
Positioning Notes: ${request.positioning ?? 'Not provided'}
Additional Notes: ${request.notes ?? 'Not provided'}
Company Research Notes: ${request.companyResearch ?? 'Not provided'}

Candidate Header:
${header}

Job Description:
${request.jobDescription}

Resume Context:
${JSON.stringify(request.resumeContext, null, 2)}

Return JSON only.`

  const rawResponse = await callLlmProxy(endpoint, systemPrompt, userPrompt)

  let parsed: CoverLetterGenerationPayload
  try {
    parsed = JSON.parse(extractJsonBlock(rawResponse)) as CoverLetterGenerationPayload
  } catch (error) {
    if (error instanceof JsonExtractionError) throw error
    throw new Error('Failed to parse cover letter response.')
  }

  const paragraphs = normalizeParagraphs(Array.isArray(parsed.paragraphs) ? parsed.paragraphs : [])
  if (!isString(parsed.name) || !isString(parsed.greeting) || !isString(parsed.signOff) || paragraphs.length === 0) {
    throw new Error('Cover letter response schema was invalid.')
  }

  return {
    name: parsed.name.trim(),
    header,
    greeting: parsed.greeting.trim(),
    signOff: parsed.signOff.trim(),
    paragraphs,
  }
}

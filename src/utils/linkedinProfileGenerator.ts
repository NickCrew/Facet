import type { ProfessionalIdentityV3 } from '../identity/schema'
import type { LinkedInProfileGenerationRequest } from '../types/linkedin'
import { callLlmProxy, extractJsonBlock, JsonExtractionError, isString } from './llmProxy'

const LINKEDIN_PROFILE_MODEL = 'sonnet'

interface LinkedInProfileGenerationPayload {
  name: string
  headline: string
  about: string
  topSkills: unknown[]
  featuredHighlights: unknown[]
}

const normalizeStringList = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter(isString).map((entry) => entry.trim()).filter(Boolean)
    : []

export async function generateLinkedInProfile(
  endpoint: string,
  identity: ProfessionalIdentityV3,
  request: LinkedInProfileGenerationRequest = {},
): Promise<Omit<import('../types/linkedin').LinkedInProfileDraft, 'id' | 'generatedAt'>> {
  const systemPrompt = `You are an expert LinkedIn profile writer for senior technical candidates. Return JSON only.
Use only the provided identity model. Do not invent employers, titles, metrics, technologies, or scope.
Write crisp, modern LinkedIn copy that is specific and credible.
The headline should be compact and signal role direction clearly.
The about section should be 2 to 4 short paragraphs.
Top skills should be a concise ordered list.
Featured highlights should be 3 to 5 short bullets suitable for a profile summary or featured section.

Response schema:
{
  "name": "string",
  "headline": "string",
  "about": "string",
  "topSkills": ["string"],
  "featuredHighlights": ["string"]
}`

  const userPrompt = `Focus: ${request.focus?.trim() || 'Not provided'}
Audience: ${request.audience?.trim() || 'Not provided'}

Professional Identity:
${JSON.stringify(identity, null, 2)}

Return JSON only.`

  const rawResponse = await callLlmProxy(endpoint, systemPrompt, userPrompt, {
    feature: 'linkedin.generate',
    model: LINKEDIN_PROFILE_MODEL,
    timeoutMs: 45000,
  })

  let parsed: LinkedInProfileGenerationPayload
  try {
    parsed = JSON.parse(extractJsonBlock(rawResponse)) as LinkedInProfileGenerationPayload
  } catch (error) {
    if (error instanceof JsonExtractionError) throw error
    throw new Error('Failed to parse LinkedIn profile response.')
  }

  const topSkills = normalizeStringList(parsed.topSkills)
  const featuredHighlights = normalizeStringList(parsed.featuredHighlights)
  if (
    !isString(parsed.name) ||
    !isString(parsed.headline) ||
    !isString(parsed.about) ||
    topSkills.length === 0 ||
    featuredHighlights.length === 0
  ) {
    throw new Error('LinkedIn profile response schema was invalid.')
  }

  return {
    name: parsed.name.trim(),
    focus: request.focus?.trim() ?? '',
    audience: request.audience?.trim() ?? '',
    headline: parsed.headline.trim(),
    about: parsed.about.trim(),
    topSkills,
    featuredHighlights,
  }
}

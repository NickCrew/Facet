export interface LinkedInProfileDraft {
  id: string
  name: string
  focus: string
  audience: string
  headline: string
  about: string
  topSkills: string[]
  featuredHighlights: string[]
  generatedAt: string
}

export interface LinkedInProfileGenerationRequest {
  focus?: string
  audience?: string
}

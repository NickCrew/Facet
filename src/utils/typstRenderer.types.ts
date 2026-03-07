import type { TypstDataPayload, TypstThemePayload } from './typstRenderer'

export interface TypstWorkerRequest {
  id: number
  fontFiles: string[]
  dataPayload: TypstDataPayload
  themePayload: TypstThemePayload
  templateContent: string
}

export type TypstWorkerResponse = 
  | { id: number; type: 'success'; bytes: Uint8Array; pageCount: number }
  | { id: number; type: 'error'; error: string }

import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs'
import { parseResumeTextItems } from './parser'
import type { ResumeTextItem } from './types'

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/legacy/build/pdf.worker.mjs',
  import.meta.url,
).toString()

const isPdfTextItem = (value: unknown): value is {
  str: string
  transform: number[]
  width: number
  height?: number
  fontName?: string
} =>
  typeof value === 'object' &&
  value !== null &&
  'str' in value &&
  'transform' in value &&
  Array.isArray((value as { transform: unknown }).transform)

export const extractPdfTextItems = async (file: File): Promise<{ items: ResumeTextItem[]; pageCount: number }> => {
  const data = new Uint8Array(await file.arrayBuffer())
  const document = await pdfjs.getDocument({ data }).promise
  const items: ResumeTextItem[] = []

  for (let pageIndex = 1; pageIndex <= document.numPages; pageIndex += 1) {
    const page = await document.getPage(pageIndex)
    const textContent = await page.getTextContent()

    for (const entry of textContent.items) {
      if (!isPdfTextItem(entry)) {
        continue
      }

      const text = entry.str.replaceAll('\u0000', '').trim()
      if (!text) {
        continue
      }

      items.push({
        text,
        x: entry.transform[4] ?? 0,
        y: entry.transform[5] ?? 0,
        width: entry.width ?? 0,
        height: entry.height ?? (Math.abs(entry.transform[0] ?? 0) || 10),
        page: pageIndex,
        ...(entry.fontName ? { fontName: entry.fontName } : {}),
      })
    }
  }

  return {
    items,
    pageCount: document.numPages,
  }
}

export const scanResumePdf = async (file: File) => {
  const extracted = await extractPdfTextItems(file)
  const parsed = parseResumeTextItems(extracted.items)

  return {
    fileName: file.name,
    pageCount: extracted.pageCount,
    scannedAt: new Date().toISOString(),
    rawText: parsed.rawText,
    identity: parsed.identity,
    warnings: parsed.warnings,
    counts: {
      roles: parsed.identity.roles.length,
      bullets: parsed.identity.roles.reduce((total, role) => total + role.bullets.length, 0),
      skillGroups: parsed.identity.skills.groups.length,
      education: parsed.identity.education.length,
      extractedBullets: parsed.identity.roles.reduce(
        (total, role) =>
          total + role.bullets.filter((bullet) => Boolean(bullet.source_text?.trim())).length,
        0,
      ),
      decomposedBullets: 0,
    },
    layout: parsed.layout,
  }
}

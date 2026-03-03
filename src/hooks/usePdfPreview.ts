import { useEffect, useRef, useState } from 'react'
import type { AssembledResume, ResumeTheme } from '../types'
import { toDataPayload, toThemePayload } from '../utils/typstRenderer'
import { getThemeFontFiles } from '../themes/theme'

interface UsePdfPreviewArgs {
  resume: AssembledResume
  theme: ResumeTheme
  debounceMs?: number
}

export interface UsePdfPreviewState {
  previewBlobUrl: string | null
  cachedPdfBlob: Blob | null
  pageCount: number | null
  pending: boolean
  error: string | null
}

const DEFAULT_DEBOUNCE_MS = 400

export function usePdfPreview({ resume, theme, debounceMs = DEFAULT_DEBOUNCE_MS }: UsePdfPreviewArgs): UsePdfPreviewState {
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null)
  const [cachedPdfBlob, setCachedPdfBlob] = useState<Blob | null>(null)
  const [pageCount, setPageCount] = useState<number | null>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const previewUrlRef = useRef<string | null>(null)
  const renderGenerationRef = useRef(0)
  const workerRef = useRef<Worker | null>(null)

  useEffect(() => {
    // Initialize worker
    workerRef.current = new Worker(new URL('../engine/pdf.worker.ts', import.meta.url), {
      type: 'module'
    })

    workerRef.current.onmessage = (event) => {
      const { id, type, bytes, pageCount: nextPageCount, error: workerError } = event.data
      
      if (id !== renderGenerationRef.current) {
        return
      }

      if (type === 'success') {
        const blob = new Blob([bytes], { type: 'application/pdf' })
        const nextUrl = URL.createObjectURL(blob)
        const previousUrl = previewUrlRef.current
        previewUrlRef.current = nextUrl

        setPreviewBlobUrl(nextUrl)
        setCachedPdfBlob(blob)
        setPageCount(nextPageCount)
        setPending(false)

        if (previousUrl) {
          URL.revokeObjectURL(previousUrl)
        }
      } else {
        if (previewUrlRef.current) {
          URL.revokeObjectURL(previewUrlRef.current)
          previewUrlRef.current = null
        }
        setPreviewBlobUrl(null)
        setCachedPdfBlob(null)
        setPageCount(null)
        setError(workerError || 'Unable to render PDF preview.')
        setPending(false)
      }
    }

    return () => {
      workerRef.current?.terminate()
      workerRef.current = null
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current)
        previewUrlRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    const generation = renderGenerationRef.current + 1
    renderGenerationRef.current = generation

    setPending(true)
    setError(null)

    const timer = window.setTimeout(() => {
      if (!workerRef.current) {
        setPending(false)
        return
      }

      const dataPayload = toDataPayload(resume)
      const themePayload = toThemePayload(theme)
      const fontFiles = getThemeFontFiles(theme)

      workerRef.current.postMessage({
        id: generation,
        dataPayload,
        themePayload,
        fontFiles
      })
    }, debounceMs)

    return () => {
      window.clearTimeout(timer)
      renderGenerationRef.current = generation + 1
    }
  }, [resume, theme, debounceMs])

  useEffect(
    () => () => {
      if (!previewUrlRef.current) {
        return
      }
      URL.revokeObjectURL(previewUrlRef.current)
      previewUrlRef.current = null
    },
    [],
  )

  return {
    previewBlobUrl,
    cachedPdfBlob,
    pageCount,
    pending,
    error,
  }
}


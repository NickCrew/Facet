import { useRef, useState } from 'react'

interface PdfPreviewProps {
  blobUrl: string | null
  loading: boolean
  error: string | null
}

export function PdfPreview({ blobUrl, loading, error }: PdfPreviewProps) {
  const [displayUrl, setDisplayUrl] = useState<string | null>(null)
  const [prevBlobUrl, setPrevBlobUrl] = useState(blobUrl)
  const bufferRef = useRef<HTMLIFrameElement>(null)

  // Clear display when blobUrl goes null (React "store previous prop" pattern —
  // adjusts state during render instead of in an effect to avoid cascading renders)
  if (blobUrl !== prevBlobUrl) {
    setPrevBlobUrl(blobUrl)
    if (!blobUrl) {
      setDisplayUrl(null)
    }
  }

  // Derive bufferUrl — it's just "is there a new blobUrl not yet promoted to display?"
  const bufferUrl = blobUrl && blobUrl !== displayUrl ? blobUrl : null

  // When the buffer iframe finishes loading, promote it to display
  const handleBufferLoad = () => {
    setDisplayUrl(blobUrl)
  }

  const showPlaceholder = !displayUrl && !bufferUrl

  return (
    <div className="pdf-preview-shell" aria-live="polite">
      {showPlaceholder ? (
        <div className="pdf-preview-placeholder">PDF preview will appear here.</div>
      ) : (
        <div className="pdf-preview-buffer-container">
          {displayUrl ? (
            <iframe
              className="pdf-preview-frame"
              src={displayUrl}
              title="Resume PDF preview"
            />
          ) : null}
          {bufferUrl ? (
            <iframe
              ref={bufferRef}
              className="pdf-preview-frame pdf-preview-loading"
              src={bufferUrl}
              title="Resume PDF preview (loading)"
              onLoad={handleBufferLoad}
            />
          ) : null}
        </div>
      )}
      {loading ? <div className="pdf-preview-status">Rendering PDF…</div> : null}
      {error ? (
        <div className="pdf-preview-status error" role="alert">
          {error}
        </div>
      ) : null}
    </div>
  )
}

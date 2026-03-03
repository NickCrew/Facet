import resumeTemplate from '../templates/resume.typ?raw'
import { getTypstSnippet, toPdfPageCount } from '../utils/typstRendererUtils'

self.onmessage = async (event) => {
  const { id, fontFiles, dataPayload, themePayload } = event.data

  try {
    const snippet = await getTypstSnippet(fontFiles)
    
    const pdfBytes = await snippet.pdf({
      mainContent: resumeTemplate,
      inputs: {
        data: JSON.stringify(dataPayload),
        theme: JSON.stringify(themePayload),
      },
    })

    if (!pdfBytes || pdfBytes.length === 0) {
      throw new Error('Typst renderer produced an empty PDF output.')
    }

    const bytes = new Uint8Array(pdfBytes)
    
    // Transfer the bytes to the main thread for performance
    ;(self as any).postMessage({
      id,
      type: 'success',
      bytes,
      pageCount: toPdfPageCount(bytes),
    }, [bytes.buffer])
  } catch (error) {
    ;(self as any).postMessage({
      id,
      type: 'error',
      error: error instanceof Error ? error.message : String(error),
    })
  }
}


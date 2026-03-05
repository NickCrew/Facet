import { getTypstSnippet, toPdfPageCount } from '../utils/typstRendererUtils'

self.onmessage = async (event) => {
  const { id, fontFiles, dataPayload, themePayload, templateContent } = event.data

  try {
    if (!templateContent) {
      throw new Error(`Missing templateContent in worker message (id: ${id})`)
    }
    const snippet = await getTypstSnippet(fontFiles)
    
    const pdfBytes = await snippet.pdf({
      mainContent: templateContent,
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
    ;(self as unknown as Worker).postMessage({
      id,
      type: 'success',
      bytes,
      pageCount: toPdfPageCount(bytes),
    }, [bytes.buffer])
  } catch (error) {
    ;(self as unknown as Worker).postMessage({
      id,
      type: 'error',
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

